const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const ytSearch = require("yt-search");
const youtubedl = require("youtube-dl-exec");
const ffmpegPath = require("ffmpeg-static");

const COOKIES_PATH = path.join(__dirname, '../cookies.txt');

async function downloadAudio(url, outputPath) {
    const options = {
        extractAudio: true,
        audioFormat: "mp3",
        output: outputPath + ".%(ext)s",
        noPlaylist: true,
        noWarnings: true,
        ffmpegLocation: ffmpegPath
    };

    if (fs.existsSync(COOKIES_PATH)) {
        options.cookies = COOKIES_PATH;
        options.extractorArgs = "youtube:player_client=web";
        options.jsRuntimes = "node";
    }

    await youtubedl(url, options);
}

async function getThumbnailStream(url) {
    const response = await axios.get(url, { responseType: "stream" });
    return response.data;
}

module.exports = {
    name: 'sing',
    aliases: ['music', 'play'],
    description: 'Tìm kiếm và tải nhạc từ YouTube',
    usage: 'sing <tên bài hát>',
    cooldown: 5000,
    adminOnly: false,
    author: 'Arafat | Viết Công',

    async execute({ message, args, reply, api, bot }) {
        try {
            const keyword = args.join(" ");

            if (!keyword) {
                return await reply('❌ Vui lòng nhập tên bài hát.\n\nVí dụ: /sing Despacito');
            }

            const searchResults = (await ytSearch(keyword)).videos.slice(0, 6);

            if (!searchResults || searchResults.length === 0) {
                return await reply(`⭕ Không tìm thấy kết quả cho: ${keyword}`);
            }

            let msg = '🎶 Kết quả tìm kiếm:\n\n';
            for (let i = 0; i < searchResults.length; i++) {
                const video = searchResults[i];
                msg += `✨ ${i + 1}. ${video.title}\n⏱ Thời lượng: ${video.timestamp}\n👤 Kênh: ${video.author.name}\n\n`;
            }
            msg += '➡ Phản hồi với số (1-6) để tải nhạc.';

            const thumbnails = await Promise.all(searchResults.map(v => getThumbnailStream(v.thumbnail)));

            const sentMsg = await api.sendMessage({
                body: msg,
                attachment: thumbnails
            }, message.threadID);

            if (!bot.onReply) bot.onReply = new Map();

            bot.onReply.set(sentMsg.messageID, {
                commandName: 'sing',
                messageID: sentMsg.messageID,
                author: message.senderID,
                results: searchResults
            });

        } catch (error) {
            console.error('Error in sing command:', error);
            await reply('❌ Không thể tìm kiếm YouTube.');
        }
    },

    async onReply({ message, reply, api, bot, replyData }) {
        try {
            const { results, author } = replyData;
            const choice = parseInt(message.body);

            if (isNaN(choice) || choice < 1 || choice > results.length) {
                return await reply('❌ Lựa chọn không hợp lệ. Nhập số từ 1-6.');
            }

            const video = results[choice - 1];
            const videoURL = video.url;

            await reply('⏳ Đang tải nhạc, vui lòng đợi...');

            const cacheDir = path.join(__dirname, '../cache');
            await fs.ensureDir(cacheDir);

            const fileName = path.join(cacheDir, `audio_${Date.now()}`);

            await downloadAudio(videoURL, fileName);

            // Tìm file đã tải (yt-dlp tự thêm đuôi)
            const baseName = path.basename(fileName);
            const files = fs.readdirSync(cacheDir).filter(f => f.startsWith(baseName));
            if (files.length === 0) {
                throw new Error('Downloaded file not found');
            }
            const outputFile = path.join(cacheDir, files[0]);

            await api.unsendMessage(replyData.messageID);

            await api.sendMessage({
                body: `🎵 Đã tải: ${video.title}\n⏱ Thời lượng: ${video.timestamp}`,
                attachment: fs.createReadStream(outputFile)
            }, message.threadID, () => {
                try { fs.unlinkSync(outputFile); } catch (e) {}
            });

            bot.onReply.delete(replyData.messageID);

        } catch (error) {
            console.error('Error in sing onReply:', error);
            await reply('❌ Không thể tải nhạc. Vui lòng thử lại sau.');
        }
    }
};
