const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

const CACHE_DIR = path.join(__dirname, '..', 'cache', 'videos');
const CACHE_TTL = 30 * 60 * 1000; // 30 phút

const log = {
    info: (prefix, msg) => console.log(`[INFO] ${prefix}: ${msg}`),
    warn: (prefix, msg) => console.warn(`[WARN] ${prefix}: ${msg}`),
    error: (prefix, msg) => console.error(`[ERROR] ${prefix}: ${msg}`),
};

class VideoDownloader {
    constructor() {
        this.cache = new Map();
        this.pending = new Map();
        this.initCache();
    }

    async initCache() {
        await fs.ensureDir(CACHE_DIR);
        this.cleanOldCache();
    }

    async cleanOldCache() {
        try {
            const files = await fs.readdir(CACHE_DIR);
            const now = Date.now();
            for (const file of files) {
                const filePath = path.join(CACHE_DIR, file);
                const stat = await fs.stat(filePath);
                if (now - stat.mtimeMs > CACHE_TTL) {
                    await fs.remove(filePath);
                }
            }
        } catch (e) { /* ignore */ }
    }

    detectPlatform(url) {
        if (!url) return null;
        const u = url.toLowerCase();
        if (u.includes('tiktok.com') || u.includes('vm.tiktok.com')) return 'tiktok';
        if (u.includes('douyin.com') || u.includes('v.douyin.com')) return 'douyin';
        if (u.includes('facebook.com') || u.includes('fb.watch') || u.includes('fb.com')) return 'facebook';
        if (u.includes('instagram.com') || u.includes('instagr.am')) return 'instagram';
        if (u.includes('twitter.com') || u.includes('x.com')) return 'twitter';
        if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
        return null;
    }

    extractUrls(text) {
        if (!text) return [];
        const regex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
        return (text.match(regex) || []).map(u => u.replace(/[.,;!?]+$/, ''));
    }

    async download(url) {
        const cached = this.cache.get(url);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL) && fs.existsSync(cached.filePath)) {
            log.info('VIDEO_CACHE', `Hit cache: ${url}`);
            return cached.filePath;
        }

        if (this.pending.has(url)) {
            return await this.pending.get(url);
        }

        const promise = this._doDownload(url);
        this.pending.set(url, promise);

        try {
            return await promise;
        } finally {
            this.pending.delete(url);
        }
    }

    async _doDownload(url) {
        const platform = this.detectPlatform(url);
        log.info('VIDEO_DL', `Bắt đầu download [${platform}]: ${url}`);

        try {
            let filePath;

            switch (platform) {
                case 'tiktok':
                    filePath = await this.downloadTikTok(url);
                    break;
                case 'douyin':
                    filePath = await this.downloadDouyin(url);
                    break;
                case 'facebook':
                    filePath = await this.downloadFacebook(url);
                    break;
                default:
                    filePath = await this.downloadYtDlp(url);
                    break;
            }

            if (filePath && fs.existsSync(filePath)) {
                this.cache.set(url, { filePath, timestamp: Date.now() });
                log.info('VIDEO_DL', `Download thành công: ${filePath}`);
                return filePath;
            }

            return null;
        } catch (error) {
            log.error('VIDEO_DL', `Lỗi download [${platform}]: ${error.message}`);
            return null;
        }
    }

    /**
     * Resolve redirect URL (short links like v.douyin.com)
     */
    async resolveRedirect(url) {
        try {
            const resp = await axios.head(url, {
                maxRedirects: 0,
                validateStatus: () => true,
                timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            });
            return resp.headers.location || url;
        } catch (e) {
            if (e.response?.headers?.location) return e.response.headers.location;
            return url;
        }
    }

    /**
     * TikTok qua TikWM API (không watermark)
     */
    async downloadTikTok(url) {
        try {
            // Resolve short URL nếu có
            if (url.includes('vm.tiktok.com') || url.includes('vt.tiktok.com')) {
                url = await this.resolveRedirect(url);
            }

            const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
            const { data: res } = await axios.get(apiUrl, { timeout: 15000 });

            if (res.code !== 0 || !res.data) {
                throw new Error(`TikWM error: ${res.msg || 'Unknown'}`);
            }

            const videoUrl = res.data.play || res.data.hdplay || res.data.wmplay;
            if (!videoUrl) throw new Error('Không tìm thấy URL video');

            return await this.downloadFile(videoUrl, `tiktok_${res.data.id || Date.now()}.mp4`);
        } catch (error) {
            log.warn('TIKTOK', `TikWM failed, fallback yt-dlp: ${error.message}`);
            return await this.downloadYtDlp(url);
        }
    }

    /**
     * Douyin: resolve short URL -> scrape RENDER_DATA -> CDN download
     */
    async downloadDouyin(url) {
        try {
            // Bước 1: Resolve short URL
            let resolvedUrl = url;
            if (url.includes('v.douyin.com')) {
                resolvedUrl = await this.resolveRedirect(url);
                log.info('DOUYIN', `Resolved: ${resolvedUrl.substring(0, 80)}`);
            }

            // Bước 2: Trích xuất video ID
            let videoId = null;
            const idMatch = resolvedUrl.match(/video\/(\d+)/);
            if (idMatch) {
                videoId = idMatch[1];
            } else {
                // Thử từ modal_id query param
                const modalMatch = resolvedUrl.match(/modal_id=(\d+)/);
                if (modalMatch) videoId = modalMatch[1];
            }

            if (!videoId) throw new Error('Không thể trích xuất video ID');
            log.info('DOUYIN', `Video ID: ${videoId}`);

            // Bước 3: Fetch trang Douyin để lấy RENDER_DATA
            const videoUrl = await this.scrapeDouyinPage(videoId);
            if (!videoUrl) throw new Error('Không tìm thấy video URL trong page');

            // Bước 4: Download từ CDN
            return await this.downloadFile(videoUrl, `douyin_${videoId}.mp4`);
        } catch (error) {
            log.warn('DOUYIN', `Scrape failed, fallback yt-dlp: ${error.message}`);
            return await this.downloadYtDlp(url);
        }
    }

    /**
     * Scrape Douyin page để tìm video CDN URL
     */
    async scrapeDouyinPage(videoId) {
        // Thử nhiều URL format
        const pageUrls = [
            `https://www.douyin.com/jingxuan?modal_id=${videoId}`,
            `https://www.douyin.com/video/${videoId}`,
        ];

        for (const pageUrl of pageUrls) {
            try {
                const { data: html } = await axios.get(pageUrl, {
                    timeout: 15000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                        'Accept': 'text/html',
                        'Accept-Language': 'zh-CN,zh;q=0.9',
                        'Referer': 'https://www.douyin.com/',
                    },
                });

                // Parse RENDER_DATA
                const renderMatch = html.match(/<script id="RENDER_DATA"[^>]*>([\s\S]*?)<\/script>/);
                if (!renderMatch) continue;

                const decoded = decodeURIComponent(renderMatch[1]);

                // Tìm playAddrH265 (video H264/H265 CDN URLs)
                const cdnUrls = decoded.match(/https?:\/\/v\d+-[^\s"'\\]{20,500}/g);
                if (cdnUrls && cdnUrls.length > 0) {
                    // Lọc chỉ lấy URL chứa video (không phải audio)
                    const videoUrls = cdnUrls.filter(u =>
                        u.includes('media-video') || u.includes('video/tos')
                    );

                    if (videoUrls.length > 0) {
                        // Ưu tiên URL có bitrate cao nhất
                        const bestUrl = this.pickBestDouyinUrl(videoUrls);
                        log.info('DOUYIN', `Tìm thấy CDN URL: ${bestUrl.substring(0, 80)}`);
                        return bestUrl;
                    }
                }

                // Fallback: tìm playApi
                const playApiMatch = decoded.match(/"playApi":"(https?:\/\/[^"]+)"/);
                if (playApiMatch) {
                    log.info('DOUYIN', `Tìm thấy playApi: ${playApiMatch[1].substring(0, 80)}`);
                    return playApiMatch[1].replace(/\\u002F/g, '/');
                }
            } catch (e) {
                log.warn('DOUYIN', `Lỗi fetch ${pageUrl}: ${e.message}`);
            }
        }

        return null;
    }

    /**
     * Chọn URL Douyin tốt nhất (bitrate cao nhất)
     */
    pickBestDouyinUrl(urls) {
        let best = urls[0];
        let bestBr = 0;

        for (const url of urls) {
            const brMatch = url.match(/br=(\d+)/);
            if (brMatch) {
                const br = parseInt(brMatch[1]);
                if (br > bestBr) {
                    bestBr = br;
                    best = url;
                }
            }
        }

        return best;
    }

    /**
     * Facebook qua yt-dlp
     */
    async downloadFacebook(url) {
        try {
            return await this.downloadYtDlp(url);
        } catch (error) {
            log.error('FACEBOOK', `yt-dlp failed: ${error.message}`);
            try {
                return await this.scrapeFacebook(url);
            } catch (e) {
                throw new Error(`Không thể tải video Facebook: ${e.message}`);
            }
        }
    }

    async scrapeFacebook(url) {
        const cheerio = require('cheerio');

        const { data: html } = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            },
        });

        const $ = cheerio.load(html);
        let videoUrl = $('meta[property="og:video"]').attr('content') ||
                       $('meta[property="og:video:url"]').attr('content');

        if (!videoUrl) {
            const bodyText = $.html();
            const patterns = [
                /"playable_url":"([^"]+)"/,
                /"playable_url_quality_hd":"([^"]+)"/,
                /src="(https:\/\/[^"]*\.mp4[^"]*)"/,
            ];
            for (const pattern of patterns) {
                const match = bodyText.match(pattern);
                if (match) {
                    videoUrl = match[1].replace(/\\u0025/g, '%').replace(/\\u0026/g, '&');
                    break;
                }
            }
        }

        if (!videoUrl) throw new Error('Không tìm thấy video URL trong page');

        videoUrl = videoUrl.replace(/\\u[\dA-F]{4}/gi, (match) =>
            String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))
        );

        return await this.downloadFile(videoUrl, `fb_${Date.now()}.mp4`);
    }

    /**
     * Download qua yt-dlp (universal fallback)
     */
    async downloadYtDlp(url) {
        const fileName = `ytdl_${Date.now()}`;
        const outputTemplate = path.join(CACHE_DIR, `${fileName}.%(ext)s`);
        const ytdlpPath = path.join(__dirname, '..', 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe');

        try {
            await execFileAsync(ytdlpPath, [
                url,
                '-o', outputTemplate,
                '--no-playlist',
                '-f', 'best[ext=mp4]/best',
                '--no-warnings',
                '--quiet',
                '--no-check-certificates',
            ], { timeout: 60000 });

            const files = await fs.readdir(CACHE_DIR);
            const downloaded = files.find(f => f.startsWith(fileName));

            if (downloaded) return path.join(CACHE_DIR, downloaded);
            throw new Error('yt-dlp không tạo file output');
        } catch (error) {
            throw new Error(`yt-dlp error: ${error.stderr || error.message}`);
        }
    }

    /**
     * Download file từ URL trực tiếp
     */
    async downloadFile(url, fileName) {
        const filePath = path.join(CACHE_DIR, fileName);
        const writer = fs.createWriteStream(filePath);

        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            timeout: 60000,
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.douyin.com/',
            },
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(filePath));
            writer.on('error', reject);
        });
    }

    async cleanup(filePath) {
        try {
            if (filePath && fs.existsSync(filePath)) {
                await fs.remove(filePath);
                this.cache.forEach((val, key) => {
                    if (val.filePath === filePath) this.cache.delete(key);
                });
            }
        } catch (e) { /* ignore */ }
    }

    async clearAllCache() {
        try {
            await fs.emptyDir(CACHE_DIR);
            this.cache.clear();
        } catch (e) { /* ignore */ }
    }
}

module.exports = new VideoDownloader();
