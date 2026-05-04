const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: 'privatechat',
    aliases: ['pc', 'private'],
    description: 'Cài đặt chế độ chat riêng',
    usage: 'privatechat [on/off/status/message]',
    cooldown: 0,
    adminOnly: true,
    author: 'Lê Công',

    async execute({ args, reply, bot }) {
        try {
            if (args.length === 0) {
                const pcHelp = `⚙️ CÀI ĐẶT PRIVATE CHAT\n\n` +
                             `• privatechat on - Bật chế độ chỉ admin\n` +
                             `• privatechat off - Tắt chế độ chỉ admin\n` +
                             `• privatechat status - Xem trạng thái\n` +
                             `• privatechat message - Xem tin nhắn chuyển hướng\n` +
                             `• privatechat test - Test tin nhắn`;
                
                return await reply(pcHelp);
            }

            const action = args[0].toLowerCase();
            
            switch (action) {
                case 'on':
                case 'enable':
                    bot.config.privateChat.allowAdminOnly = true;
                    bot.config.privateChat.autoRedirectMessage = true;
                    await this.saveConfig(bot);
                    await reply('✅ Đã BẬT chế độ private chat chỉ admin');
                    break;

                case 'off':
                case 'disable':
                    bot.config.privateChat.allowAdminOnly = false;
                    bot.config.privateChat.autoRedirectMessage = false;
                    await this.saveConfig(bot);
                    await reply('❌ Đã TẮT chế độ private chat chỉ admin');
                    break;

                case 'status':
                    const status = bot.config.privateChat.allowAdminOnly ? '🟢 BẬT' : '🔴 TẮT';
                    const autoMsg = bot.config.privateChat.autoRedirectMessage ? '✅ Có' : '❌ Không';
                    
                    const statusMsg = `📊 TRẠNG THÁI PRIVATE CHAT\n\n` +
                                    `• Chỉ admin: ${status}\n` +
                                    `• Tin nhắn tự động: ${autoMsg}\n` +
                                    `• Link admin: ${bot.config.adminFacebookLink ? '✅ Đã cài' : '❌ Chưa cài'}\n` +
                                    `• Số admin: ${bot.config.adminIDs.length}`;
                    
                    await reply(statusMsg);
                    break;

                case 'message':
                case 'msg':
                    const currentMsg = bot.config.privateChat.redirectMessage;
                    const previewMsg = currentMsg.replace('{adminLink}', bot.config.adminFacebookLink || '[Link admin]');
                    
                    await reply(`📝 TIN NHẮN CHUYỂN HƯỚNG:\n\n${previewMsg}`);
                    break;

                case 'test':
                    const testMsg = bot.config.privateChat.redirectMessage
                        .replace('{adminLink}', bot.config.adminFacebookLink || '[Link admin chưa cài]');
                    
                    await reply(`🧪 TEST TIN NHẮN:\n\n${testMsg}`);
                    break;

                default:
                    await reply('❌ Action không hợp lệ! Sử dụng: on, off, status, message, test');
            }
        } catch (error) {
            await reply('❌ Lỗi cài đặt private chat!');
        }
    },

    async saveConfig(bot) {
        const configPath = path.join(__dirname, '../config.json');
        await fs.writeJson(configPath, bot.config, { spaces: 2 });
    }
};