const os = require('os');

module.exports = {
    name: 'info',
    aliases: ['botinfo', 'about'],
    description: 'Hiển thị thông tin về bot',
    usage: 'info',
    cooldown: 10000,
    adminOnly: false,
    category: 'info',
    author: 'Lê Công',

    async execute({ bot, reply }) {
        try {
            const uptime = bot.timeUtils.getUptime(bot.startTime);
            const memoryUsage = process.memoryUsage();
            const memoryMB = Math.round(memoryUsage.rss / 1024 / 1024);
            const currentTime = bot.timeUtils.formatVi();
            const greeting = bot.timeUtils.getGreeting();
            
            const infoMessage = `🤖 THÔNG TIN BOT\n\n` +
                              `• Tên: ${bot.config.name}\n` +
                              `• Prefix: ${bot.config.prefix}\n` +
                              `• Số lệnh: ${bot.commands.size}\n` +
                              `• Số event: ${bot.events.size}\n` +
                              `• Thời gian hoạt động: ${uptime}\n` +
                              `• RAM sử dụng: ${memoryMB}MB\n` +
                              `• Platform: ${os.platform()}\n` +
                              `• Node.js: ${process.version}\n` +
                              `• Timezone: ${bot.config.timezone || 'Asia/Ho_Chi_Minh'}\n` +
                              `• Thời gian hiện tại: ${currentTime}\n\n` +
                              `${greeting}! 👋`;
            
            await reply(infoMessage);
        } catch (error) {
            await reply('❌ Không thể lấy thông tin bot!');
        }
    }
};