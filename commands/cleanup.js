module.exports = {
    name: 'cleanup',
    aliases: ['clean'],
    description: 'Dọn dẹp dữ liệu cũ trong database',
    usage: 'cleanup [số ngày | all]',
    cooldown: 60000,
    adminOnly: true,
    author: 'Lê Công',

    async execute({ args, reply, bot }) {
        try {
            if (bot.config.database.type === 'mongodb') {
                const mode = (args[0] || '').toLowerCase();
                const deleteAll = mode === 'all';
                const olderThanDays = deleteAll ? 0 : Number(mode || 30);

                if (!deleteAll && (!Number.isInteger(olderThanDays) || olderThanDays < 1)) {
                    return await reply('❌ Số ngày không hợp lệ.\nVí dụ: /cleanup 30 hoặc /cleanup all');
                }

                await reply(deleteAll
                    ? '🧹 Đang xóa toàn bộ dữ liệu users/threads trong database...'
                    : `🧹 Đang xóa dữ liệu cũ hơn ${olderThanDays} ngày...`
                );
                
                await bot.databaseReady;

                const cleanupResult = await bot.database.cleanupOldData({
                    olderThanDays,
                    deleteAll,
                    keepAdminIDs: bot.config.adminIDs || []
                });

                if (cleanupResult.error) {
                    return await reply(`❌ Lỗi khi dọn dẹp database: ${cleanupResult.error}`);
                }

                bot.users.clear();
                bot.threads.clear();
                
                const userStats = await bot.database.getUserStats();
                const threadStats = await bot.database.getThreadStats();

                const cleanupMessage = `✅ DỌN DẸP HOÀN TẤT\n\n` +
                                     `🗑️ Đã xóa: ${cleanupResult.deletedUsers} users, ${cleanupResult.deletedThreads} threads\n` +
                                     `🛡️ Giữ lại admin: ${(bot.config.adminIDs || []).length} ID\n` +
                                     `📊 Thống kê sau cleanup:\n` +
                                     `👥 Users còn lại: ${userStats.total}\n` +
                                     `💬 Threads còn lại: ${threadStats.total}\n` +
                                     `⏰ Thời gian: ${bot.timeUtils.formatVi()}`;

                await reply(cleanupMessage);
            } else {
                await reply('📋 JSON database chưa hỗ trợ cleanup bằng lệnh này.');
            }
        } catch (error) {
            await reply(`❌ Lỗi khi dọn dẹp database: ${error.message}`);
        }
    }
};
