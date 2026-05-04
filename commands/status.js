module.exports = {
    name: 'status',
    aliases: ['up', 'uptime', 'upt'],
    description: 'Xem thời gian hoạt động và thống kê bot',
    usage: 'status',
    cooldown: 5000,
    adminOnly: false,
    category: 'info',
    author: 'Lê Công',
    version: '1.0',

    async execute({ api, event, bot, reply }) {
        try {
            const uptime = process.uptime();
            const days = Math.floor(uptime / (60 * 60 * 24));
            const hours = Math.floor((uptime % (60 * 60 * 24)) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);

            const uptimeString = `${days} ngày ${hours} giờ ${minutes} phút ${seconds} giây`;

            // Get user and thread stats
            let totalUsers = 0;
            let totalThreads = 0;

            try {
                await bot.databaseReady;

                if (bot.config.database.type === 'mongodb') {
                    const userStats = await bot.database.getUserStats();
                    const threadStats = await bot.database.getThreadStats();

                    totalUsers = userStats.total;
                    totalThreads = threadStats.total;
                } else {
                    const fs = require('fs-extra');
                    const path = require('path');
                    const usersPath = path.join(bot.config.database.path, 'users');
                    const threadsPath = path.join(bot.config.database.path, 'threads');

                    if (await fs.pathExists(usersPath)) {
                        totalUsers = (await fs.readdir(usersPath)).filter(file => file.endsWith('.json')).length;
                    }

                    if (await fs.pathExists(threadsPath)) {
                        totalThreads = (await fs.readdir(threadsPath)).filter(file => file.endsWith('.json')).length;
                    }
                }
            } catch (dbError) {
                console.log('Database not available for stats');
            }

            const msg = 
`╭─🎀 𝗧𝗛𝗢̛̀𝗜 𝗚𝗜𝗔𝗡 𝗛𝗢𝗔̣𝗧 Đ𝗢̣̂𝗡𝗚
│
├🐤 𝗧𝗵𝗼̛̀𝗶 𝗴𝗶𝗮𝗻: ${uptimeString}  
├👥 𝗧𝗼̂̉𝗻𝗴 𝗻𝗴𝘂̛𝗼̛̀𝗶 𝗱𝘂̀𝗻𝗴: ${totalUsers.toLocaleString()}  
├💬 𝗧𝗼̂̉𝗻𝗴 𝗻𝗵𝗼́𝗺: ${totalThreads.toLocaleString()}  
├📊 𝗧𝗼̂̉𝗻𝗴 𝗹𝗲̣̂𝗻𝗵: ${bot.commands.size}
│
╰───────────────◉`;

            await reply(msg);
        } catch (error) {
            console.error('Error in status command:', error);
            await reply('❌ Đã xảy ra lỗi khi lấy thông tin bot!');
        }
    }
};
