module.exports = {
    name: 'dbstats',
    aliases: ['database', 'db'],
    description: 'Xem thống kê database',
    usage: 'dbstats',
    cooldown: 10000,
    adminOnly: true,
    author: 'Lê Công',

    async execute({ reply, bot }) {
        try {
            if (bot.config.database.type === 'mongodb') {
                // MongoDB stats
                const userStats = await bot.database.getUserStats();
                const threadStats = await bot.database.getThreadStats();
                const connectionInfo = bot.database.getConnectionInfo();

                const statsMessage = `📊 THỐNG KÊ DATABASE (MongoDB)\n\n` +
                                   `👥 USERS:\n` +
                                   `• Tổng số: ${userStats.total}\n` +
                                   `• Hoạt động (7 ngày): ${userStats.active}\n` +
                                   `• Bị cấm: ${userStats.banned}\n\n` +
                                   `💬 THREADS:\n` +
                                   `• Tổng số: ${threadStats.total}\n` +
                                   `• Hoạt động (7 ngày): ${threadStats.active}\n` +
                                   `• Bị cấm: ${threadStats.banned}\n\n` +
                                   `🔗 KẾT NỐI:\n` +
                                   `• Trạng thái: ${connectionInfo.connected ? '✅ Kết nối' : '❌ Mất kết nối'}\n` +
                                   `• Database: ${connectionInfo.name}\n` +
                                   `• Ready State: ${connectionInfo.readyState}`;

                await reply(statsMessage);
            } else {
                // JSON stats
                const statsMessage = `📊 THỐNG KÊ DATABASE (JSON)\n\n` +
                                   `👥 Users trong cache: ${bot.users.size}\n` +
                                   `💬 Threads trong cache: ${bot.threads.size}\n` +
                                   `📁 Database type: JSON Files`;

                await reply(statsMessage);
            }
        } catch (error) {
            await reply('❌ Không thể lấy thống kê database!');
        }
    }
};