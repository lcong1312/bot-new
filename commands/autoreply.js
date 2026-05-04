const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: 'autoreply',
    aliases: ['ar', 'auto'],
    description: 'Cài đặt auto reply và auto reaction',
    usage: 'autoreply [on/off/status/config]',
    cooldown: 3000,
    adminOnly: true,
    author: 'Lê Công',

    async execute({ args, reply, bot }) {
        try {
            if (args.length === 0) {
                const arHelp = `🤖 CÀI ĐẶT AUTO REPLY\n\n` +
                             `• autoreply on - Bật auto reply\n` +
                             `• autoreply off - Tắt auto reply\n` +
                             `• autoreply status - Xem trạng thái\n` +
                             `• autoreply config - Cài đặt chi tiết\n` +
                             `• autoreply test - Test auto reply`;
                
                return await reply(arHelp);
            }

            const action = args[0].toLowerCase();
            
            switch (action) {
                case 'on':
                case 'enable':
                    bot.config.autoReply.enabled = true;
                    bot.config.autoReply.randomReply = true;
                    bot.config.autoReply.autoReaction = true;
                    await this.saveConfig(bot);
                    await reply('✅ Đã BẬT auto reply và auto reaction');
                    break;

                case 'off':
                case 'disable':
                    bot.config.autoReply.enabled = false;
                    await this.saveConfig(bot);
                    await reply('❌ Đã TẮT auto reply và auto reaction');
                    break;

                case 'status':
                    const status = bot.config.autoReply.enabled ? '🟢 BẬT' : '🔴 TẮT';
                    const replyStatus = bot.config.autoReply.randomReply ? '✅' : '❌';
                    const reactionStatus = bot.config.autoReply.autoReaction ? '✅' : '❌';
                    
                    const statusMsg = `📊 TRẠNG THÁI AUTO REPLY\n\n` +
                                    `• Tổng thể: ${status}\n` +
                                    `• Random reply: ${replyStatus} (${bot.config.autoReply.replyChance}%)\n` +
                                    `• Auto reaction: ${reactionStatus} (${bot.config.autoReply.reactionChance}%)\n` +
                                    `• Cooldown: ${bot.config.autoReply.cooldown}ms`;
                    
                    await reply(statusMsg);
                    break;

                case 'config':
                    const configMsg = `⚙️ CẤU HÌNH AUTO REPLY\n\n` +
                                    `• Reply chance: ${bot.config.autoReply.replyChance}%\n` +
                                    `• Reaction chance: ${bot.config.autoReply.reactionChance}%\n` +
                                    `• Cooldown: ${bot.config.autoReply.cooldown}ms\n\n` +
                                    `💡 Sửa trong config.json để thay đổi`;
                    
                    await reply(configMsg);
                    break;

                case 'test':
                    await reply('🧪 Testing auto reply system...\n\nGửi tin nhắn bình thường để test!');
                    break;

                case 'reply':
                    if (args[1] === 'on') {
                        bot.config.autoReply.randomReply = true;
                        await this.saveConfig(bot);
                        await reply('✅ Đã bật random reply');
                    } else if (args[1] === 'off') {
                        bot.config.autoReply.randomReply = false;
                        await this.saveConfig(bot);
                        await reply('❌ Đã tắt random reply');
                    }
                    break;

                case 'reaction':
                    if (args[1] === 'on') {
                        bot.config.autoReply.autoReaction = true;
                        await this.saveConfig(bot);
                        await reply('✅ Đã bật auto reaction');
                    } else if (args[1] === 'off') {
                        bot.config.autoReply.autoReaction = false;
                        await this.saveConfig(bot);
                        await reply('❌ Đã tắt auto reaction');
                    }
                    break;

                default:
                    await reply('❌ Action không hợp lệ! Sử dụng: on, off, status, config, test');
            }
        } catch (error) {
            await reply('❌ Lỗi cài đặt auto reply!');
        }
    },

    async saveConfig(bot) {
        const configPath = path.join(__dirname, '../config.json');
        await fs.writeJson(configPath, bot.config, { spaces: 2 });
    },
};