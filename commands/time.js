module.exports = {
    name: 'time',
    aliases: ['now', 'clock'],
    description: 'Xem thời gian hiện tại',
    usage: 'time',
    cooldown: 3000,
    adminOnly: false,
    author: 'Lê Công',

    async execute({ bot, reply }) {
        try {
            const timeInfo = bot.timeUtils.getTimeInfo();
            const greeting = bot.timeUtils.getGreeting();
            const isWorkingHours = bot.timeUtils.isWorkingHours();
            
            const timeMessage = `🕐 THỜI GIAN HIỆN TẠI\n\n` +
                              `📅 ${timeInfo.formatted}\n` +
                              `📍 ${timeInfo.dayOfWeekVi}, ${timeInfo.date}\n` +
                              `⏰ ${timeInfo.time}\n` +
                              `🌏 Timezone: ${timeInfo.timezone} (${timeInfo.utcOffset})\n` +
                              `👋 ${greeting}!\n` +
                              `💼 Giờ làm việc: ${isWorkingHours ? '✅ Có' : '❌ Không'}`;
            
            await reply(timeMessage);
        } catch (error) {
            await reply('❌ Không thể lấy thời gian!');
        }
    }
};