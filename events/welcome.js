const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: 'welcome',
    type: 'event',
    description: 'Chào mừng thành viên mới và giới thiệu bot khi vào nhóm',
    adminOnly: false,

    async execute({ message, send, bot }) {
        try {
            // Event messages không có isGroup, kiểm tra bằng logMessageType
            const isGroup = message.isGroup ||
                (Array.isArray(message.participantIDs) && message.participantIDs.length > 1) ||
                message.logMessageType?.startsWith('log:');

            if (!isGroup) return;
            if (message.logMessageType !== 'log:subscribe') return;

            const threadData = await bot.getThreadData(message.threadID);
            if (threadData?.settings?.welcome === false) return;

            const addedParticipants = message.logMessageData?.addedParticipants;
            if (!addedParticipants || !Array.isArray(addedParticipants) || addedParticipants.length === 0) return;

            const botID = bot.api.getCurrentUserID();
            const prefix = threadData?.prefix || bot.config.prefix;

            // Kiểm tra bot có trong danh sách được thêm không
            const botAdded = addedParticipants.some(p => p.userFbId === botID);

            if (botAdded) {
                // Bot vừa được thêm vào nhóm -> giới thiệu bản thân
                await this.handleBotJoin(message, send, bot, prefix, threadData);
            }

            // Chào mừng các thành viên mới (không bao gồm bot)
            for (const participant of addedParticipants) {
                const userID = participant.userFbId;
                if (!userID || userID === botID) continue;

                await this.handleNewMember(userID, message, send, bot, prefix, threadData);
            }

        } catch (error) {
            console.error('[WELCOME] Lỗi:', error.message);
        }
    },

    /**
     * Bot được thêm vào nhóm -> giới thiệu bản thân
     */
    async handleBotJoin(message, send, bot, prefix, threadData) {
        const introMsg =
            `🤖 Xin chào! Tôi là ${bot.config.name || 'Bot'}!\n\n` +
            `📋 **Giới thiệu:**\n` +
            `• Prefix: ${prefix}\n` +
            `• Gõ ${prefix}help để xem danh sách lệnh\n` +
            `• Gõ ${prefix}info để xem thông tin bot\n\n` +
            `✨ **Tính năng nổi bật:**\n` +
            `• Tự động tải video TikTok, Douyin, Facebook\n` +
            `• Nhiều lệnh giải trí & tiện ích\n\n` +
            `💡 Bot đã sẵn sàng phục vụ nhóm!`;

        try {
            await send(introMsg);
        } catch (e) {
            console.error('[WELCOME] Lỗi gửi giới thiệu bot:', e.message);
        }
    },

    /**
     * Thành viên mới join -> chào mừng kèm avatar
     */
    async handleNewMember(userID, message, send, bot, prefix, threadData) {
        // Lấy tên user
        let userName = 'Thành viên mới';
        try {
            const userInfo = await bot.getUserInfo(userID);
            userName = userInfo[userID]?.name || 'Thành viên mới';
        } catch (e) {
            console.error('[WELCOME] Lỗi getUserInfo:', e.message);
        }

        const welcomeMsg = `🎉 Chào mừng ${userName} đã tham gia nhóm!\n\n` +
            `👋 Xin chào! Chúc bạn có những trải nghiệm vui vẻ tại đây.\n` +
            `💡 Gõ ${prefix}help để xem danh sách lệnh.`;

        // Tải avatar và gửi kèm
        try {
            const avatarUrl = `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
            const cacheDir = path.join(__dirname, '../cache');
            await fs.ensureDir(cacheDir);
            const avatarPath = path.join(cacheDir, `welcome_${userID}.jpg`);

            const response = await axios.get(avatarUrl, {
                responseType: 'arraybuffer',
                timeout: 10000,
            });
            await fs.writeFile(avatarPath, response.data);

            await send({
                body: welcomeMsg,
                attachment: fs.createReadStream(avatarPath),
            });

            setTimeout(() => {
                fs.remove(avatarPath).catch(() => {});
            }, 5000);

        } catch (avatarErr) {
            console.error('[WELCOME] Lỗi avatar, gửi text:', avatarErr.message);
            try {
                await send(welcomeMsg);
            } catch (sendErr) {
                console.error('[WELCOME] Lỗi gửi tin nhắn:', sendErr.message);
            }
        }

        // Tạo user data cho thành viên mới
        try {
            await bot.getUserData(userID);
        } catch (e) { /* ignore */ }
    },
};
