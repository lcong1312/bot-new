const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: 'setadmin',
    aliases: ['addadmin'],
    description: 'Thêm admin mới cho bot (chỉ admin hiện tại)',
    usage: 'setadmin [userID hoặc @mention]',
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

            // Kiểm tra user đã là admin chưa
            if (bot.config.adminIDs.includes(targetID)) {
                return await reply('❌ User này đã là admin rồi!');
            }

            // Lấy thông tin user
            let userInfo;
            try {
                const info = await api.getUserInfo(targetID);
                userInfo = info[targetID];
            } catch (error) {
                userInfo = { name: 'Unknown User' };
            }

            // Thêm vào danh sách admin
            bot.config.adminIDs.push(targetID);

            // Lưu config
            const configPath = path.join(__dirname, '../config.json');
            await fs.writeJson(configPath, bot.config, { spaces: 2 });

            await reply(`✅ Đã thêm ${userInfo.name || targetID} vào danh sách admin!\n\n📋 Danh sách admin hiện tại: ${bot.config.adminIDs.length} người`);
        } catch (error) {
            await reply('❌ Không thể thêm admin!');
        }
    }
};