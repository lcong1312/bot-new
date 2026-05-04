const fs = require('fs-extra');
const videoDownloader = require('../utils/VideoDownloader');

const log = {
    info: (prefix, msg) => console.log(`[INFO] ${prefix}: ${msg}`),
    warn: (prefix, msg) => console.warn(`[WARN] ${prefix}: ${msg}`),
    error: (prefix, msg) => console.error(`[ERROR] ${prefix}: ${msg}`),
};

// Anti-spam: track mỗi user gần đây đã nhận video chưa
const recentVideos = new Map(); // "threadID_senderID_url" -> timestamp
const ANTI_SPAM_TTL = 60000; // 1 phút

module.exports = {
    name: 'autolink',
    type: 'message',
    description: 'Tự động tải video từ link TikTok, Facebook, Douyin, Instagram...',
    adminOnly: false,

    async execute({ message, bot, react, threadData }) {
        try {
            // Bỏ qua tin nhắn từ bot
            if (message.senderID === bot.api.getCurrentUserID()) return;

            // Bỏ qua nếu là command
            const prefix = threadData?.prefix || bot.config.prefix || '/';
            if (message.body?.startsWith(prefix)) return;

            const body = message.body || '';
            if (!body) return;

            // Trích xuất URLs
            const urls = videoDownloader.extractUrls(body);
            if (urls.length === 0) return;

            // Lọc chỉ lấy URL từ các platform hỗ trợ
            const videoUrls = urls.filter(url => videoDownloader.detectPlatform(url));
            if (videoUrls.length === 0) return;

            // Xử lý từng link
            for (const url of videoUrls) {
                await this.processVideoUrl(url, message, bot, react);
            }
        } catch (error) {
            log.error('AUTOLINK', `Lỗi: ${error.message}`);
        }
    },

    async processVideoUrl(url, message, bot, react) {
        const senderID = message.senderID || message.userID || message.author;
        const threadID = message.threadID;
        const platform = videoDownloader.detectPlatform(url);

        // Anti-spam check
        const spamKey = `${threadID}_${senderID}_${url}`;
        if (recentVideos.has(spamKey)) {
            const lastTime = recentVideos.get(spamKey);
            if (Date.now() - lastTime < ANTI_SPAM_TTL) {
                log.info('AUTOLINK', `Bỏ qua spam: ${url}`);
                return;
            }
        }
        recentVideos.set(spamKey, Date.now());

        // Dọn anti-spam entries cũ
        if (recentVideos.size > 1000) {
            const now = Date.now();
            for (const [key, ts] of recentVideos) {
                if (now - ts > ANTI_SPAM_TTL) recentVideos.delete(key);
            }
        }

        // React "đang tải"
        try {
            await react('⏳');
        } catch (e) { /* ignore */ }

        log.info('AUTOLINK', `Đang tải video [${platform}]: ${url}`);

        let filePath = null;
        try {
            filePath = await videoDownloader.download(url);

            if (!filePath) {
                await react('❌');
                return;
            }

            // Gửi video
            const api = bot.api;
            const msg = {
                body: `🎬 Video ${platform}`,
                attachment: fs.createReadStream(filePath),
            };

            await new Promise((resolve, reject) => {
                api.sendMessage(msg, threadID, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });

            // React thành công
            await react('✅');
            log.info('AUTOLINK', `Đã gửi video [${platform}] đến ${threadID}`);

        } catch (error) {
            log.error('AUTOLINK', `Lỗi gửi video: ${error.message}`);
            try {
                await react('❌');
                await bot.reply('❌ Không thể tải video. Link có thể đã bị chặn hoặc không hợp lệ.', message);
            } catch (e) { /* ignore */ }
        }
    },
};
