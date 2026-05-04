const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: 'profile',
    aliases: ['me', 'user'],
    description: 'Xem thông tin profile của bạn hoặc người khác',
    usage: 'profile [@mention hoặc để trống]',
    cooldown: 5000,
    adminOnly: false,
    author: 'Lê Công',

    async execute({ message, args, userData, bot, reply, api }) {
        try {
            let targetID = message.senderID;
            let targetData = userData;
            
            // Nếu có mention hoặc ID
            if (message.mentions && Object.keys(message.mentions).length > 0) {
                targetID = Object.keys(message.mentions)[0].replace(/^(fb)?id[:.]/, '');
                targetData = await bot.getUserData(targetID);
            } else if (args[0] && !isNaN(args[0])) {
                targetID = args[0];
                targetData = await bot.getUserData(targetID);
            }
            
            if (!targetData) {
                return await reply('❌ Không tìm thấy thông tin người dùng!');
            }
            
            // Lấy thông tin user từ Facebook
            let userInfo;
            try {
                userInfo = await api.getUserInfo(targetID);
                userInfo = userInfo[targetID];
            } catch (error) {
                userInfo = { name: 'Unknown User' };
            }
            
            const profileMessage = `👤 THÔNG TIN PROFILE\n\n` +
                                 `• Tên: ${userInfo.name || targetData.name || 'Chưa cập nhật'}\n` +
                                 `• ID: ${targetID}\n` +
                                 `• Kinh nghiệm: ${targetData.exp || 0}\n` +
                                 `• Tiền: ${targetData.money || 0}$\n` +
                                 `• Trạng thái: ${targetData.banned ? '🚫 Bị cấm' : '✅ Hoạt động'}\n` +
                                 `• Lần cuối hoạt động: ${targetData.lastActive ? bot.timeUtils.fromTimestamp(targetData.lastActive) : 'Chưa có'}`;
            
            // Tải avatar
            try {
                const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
                
                // Tạo thư mục cache nếu chưa có
                const cacheDir = path.join(__dirname, '../cache');
                await fs.ensureDir(cacheDir);
                
                const avatarPath = path.join(cacheDir, `avatar_${targetID}.jpg`);
                
                // Download avatar
                const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
                await fs.writeFile(avatarPath, response.data);
                
                // Gửi tin nhắn kèm avatar
                await api.sendMessage({
                    body: profileMessage,
                    attachment: fs.createReadStream(avatarPath)
                }, message.threadID, () => {
                    // Xóa file sau khi gửi
                    fs.unlink(avatarPath).catch(err => console.error('Error deleting avatar:', err));
                });
                
            } catch (error) {
                console.error('Error loading avatar:', error);
                // Nếu không tải được avatar, gửi tin nhắn thường
                await reply(profileMessage);
            }
            
        } catch (error) {
            await reply('❌ Không thể lấy thông tin profile!');
        }
    }
};