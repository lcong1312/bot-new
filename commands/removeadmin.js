const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: 'removeadmin',
    aliases: ['deladmin', 'unadmin'],
    description: 'Xóa admin khỏi bot (chỉ admin hiện tại)',
    usage: 'removeadmin [userID hoặc @mention]',
    cooldown: 0,
    adminOnly: true,
    author: 'Lê Công',

    async execute({ args, reply, bot, message, api }) {
        try {
            let targetID = null;
            
            // Lấy userID từ mention hoặc args
            if (message.mentions && Object.keys(message.mentions).length > 0) {
                targetID = Object.keys(message.mentions)[0].replace(/^(fb)?id[:.]/, '');
            } else if (args[0] && !isNaN(args[0])) {
                targetID = args[0];
            } else {
                return await reply('❌ Vui lòng mention user hoặc cung cấp userID!');
            }

            // Kiểm tra user có phải admin không
            if (!bot.config.adminIDs.includes(targetID)) {
                return await reply('❌ User này không phải admin!');
            }

            // Không cho phép tự xóa mình
            if (targetID === message.senderID) {
                return await reply('❌ Bạn không thể tự xóa mình khỏi danh sách admin!');
            }

            // Kiểm tra phải có ít nhất 1 admin
            if (bot.config.adminIDs.length <= 1) {
                return await reply('❌ Không thể xóa admin cuối cùng!');
            }

            // Lấy thông tin user
            let userInfo;
            try {
                const info = await api.getUserInfo(targetID);
                userInfo = info[targetID];
            } catch (error) {
                userInfo = { name: 'Unknown User' };
            }

            // Xóa khỏi danh sách admin
            bot.config.adminIDs = bot.config.adminIDs.filter(id => id !== targetID);

            // Lưu config
            const configPath = path.join(__dirname, '../config.json');
            await fs.writeJson(configPath, bot.config, { spaces: 2 });

            await reply(`✅ Đã xóa ${userInfo.name || targetID} khỏi danh sách admin!\n\n📋 Danh sách admin hiện tại: ${bot.config.adminIDs.length} người`);
        } catch (error) {
            await reply('❌ Không thể xóa admin!');
        }
    }
};