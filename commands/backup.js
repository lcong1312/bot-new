const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: 'backup',
    aliases: ['bk'],
    description: 'Tạo backup database',
    usage: 'backup',
    cooldown: 30000,
    adminOnly: true,
    author: 'Lê Công',

    async execute({ reply, bot }) {
        try {
            if (bot.config.database.type === 'mongodb') {
                // MongoDB backup
                const backupData = await bot.database.backup();
                
                if (!backupData) {
                    return await reply('❌ Không thể tạo backup!');
                }

                // Lưu backup vào file
                const backupDir = path.join(__dirname, '../backups');
                await fs.ensureDir(backupDir);
                
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const backupFile = path.join(backupDir, `backup_${timestamp}.json`);
                
                await fs.writeJson(backupFile, backupData, { spaces: 2 });

                const statsMessage = `✅ BACKUP THÀNH CÔNG\n\n` +
                                   `📁 File: backup_${timestamp}.json\n` +
                                   `👥 Users: ${backupData.users.length}\n` +
                                   `💬 Threads: ${backupData.threads.length}\n` +
                                   `⏰ Thời gian: ${bot.timeUtils.formatVi()}`;

                await reply(statsMessage);
            } else {
                await reply('📋 JSON database không cần backup riêng, dữ liệu đã được lưu trong thư mục database/');
            }
        } catch (error) {
            await reply('❌ Lỗi khi tạo backup!');
        }
    }
};