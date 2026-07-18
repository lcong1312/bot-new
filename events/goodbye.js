const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: 'goodbye',
    type: 'event',
    description: 'Chào tạm biệt thành viên rời nhóm',

    async execute({ message, send, api, bot }) {
        try {
            // Event messages không có isGroup
            const isGroup = message.isGroup ||
                (Array.isArray(message.participantIDs) && message.participantIDs.length > 1) ||
                message.logMessageType?.startsWith('log:');

            if (!isGroup) return;
            if (message.logMessageType !== 'log:unsubscribe') return;

            const leftUser = message.logMessageData?.leftParticipantFbId;
            if (!leftUser) return;

            // Lấy tên user
            let userName = 'Thành viên';
            try {
                const info = await api.getUserInfo(leftUser);
                userName = info[leftUser]?.name || 'Thành viên';
            } catch (error) {
                console.error('[GOODBYE] Lỗi getUserInfo:', error.message);
            }

            const goodbyeMsg = `👋 ${userName} đã rời khỏi nhóm.\n\n🌟 Chúc bạn luôn vui vẻ và hạnh phúc!`;

            // Tải avatar và gửi kèm
            try {
                const avatarUrl = `https://graph.facebook.com/${leftUser}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
                const cacheDir = path.join(__dirname, '../cache');
                await fs.ensureDir(cacheDir);
                const avatarPath = path.join(cacheDir, `goodbye_${leftUser}.jpg`);

                const response = await axios.get(avatarUrl, {
                    responseType: 'arraybuffer',
                    timeout: 10000,
                });
                await fs.writeFile(avatarPath, response.data);

                await send({
                    body: goodbyeMsg,
                    attachment: fs.createReadStream(avatarPath),
                });

                setTimeout(() => {
                    fs.remove(avatarPath).catch(() => {});
                }, 5000);
            } catch (avatarErr) {
                await send(goodbyeMsg);
            }

        } catch (error) {
            console.error('[GOODBYE] Lỗi:', error.message);
        }
    },
};
