module.exports = {
    name: 'admin',
    aliases: ['adm'],
    description: 'Các lệnh dành cho admin',
    usage: 'admin [ban/unban/reload] [userID]',
    cooldown: 0,
    adminOnly: true,
    category: 'admin',
    author: 'Lê Công',

    async execute({ args, reply, bot, message }) {
        try {
            if (args.length === 0) {
                const adminHelp = `🔧 LỆNH ADMIN\n\n` +
                                `• admin ban [userID] - Cấm user\n` +
                                `• admin unban [userID] - Bỏ cấm user\n` +
                                `• admin reload [type] - Reload (commands/events/config/all)\n` +
                                `• admin stats - Thống kê bot\n` +
                                `• admin watcher - Trạng thái file watcher\n` +
                                `• admin pc - Cài đặt private chat`;
                
                return await reply(adminHelp);
            }

            const action = args[0].toLowerCase();
            
            switch (action) {
                case 'ban':
                    if (!args[1]) {
                        return await reply('❌ Vui lòng cung cấp userID để ban!');
                    }
                    
                    const banUserData = await bot.getUserData(args[1]);
                    if (!banUserData) {
                        return await reply('❌ Không tìm thấy user!');
                    }
                    
                    banUserData.banned = true;
                    await bot.saveUserData(args[1], banUserData);
                    await reply(`✅ Đã ban user ${args[1]}`);
                    break;

                case 'unban':
                    if (!args[1]) {
                        return await reply('❌ Vui lòng cung cấp userID để unban!');
                    }
                    
                    const unbanUserData = await bot.getUserData(args[1]);
                    if (!unbanUserData) {
                        return await reply('❌ Không tìm thấy user!');
                    }
                    
                    unbanUserData.banned = false;
                    await bot.saveUserData(args[1], unbanUserData);
                    await reply(`✅ Đã unban user ${args[1]}`);
                    break;

                case 'reload':
                    const reloadType = args[1] || 'all';
                    try {
                        await bot.manualReload(reloadType);
                        await reply(`✅ Đã reload ${reloadType}!`);
                    } catch (error) {
                        await reply(`❌ Lỗi reload ${reloadType}: ${error.message}`);
                    }
                    break;

                case 'stats':
                    const stats = `📊 THỐNG KÊ BOT\n\n` +
                                `• Số commands: ${bot.commands.size}\n` +
                                `• Số events: ${bot.events.size}\n` +
                                `• Số users trong cache: ${bot.users.size}\n` +
                                `• Số threads trong cache: ${bot.threads.size}\n` +
                                `• Uptime: ${Math.floor(process.uptime() / 60)} phút`;
                    
                    await reply(stats);
                    break;

                case 'watcher':
                    const watcherStatus = bot.getWatcherStatus();
                    const watcherInfo = `📁 FILE WATCHER STATUS\n\n` +
                                      `• Active watchers: ${watcherStatus.totalWatchers}\n` +
                                      `• Watching: ${watcherStatus.activeWatchers.join(', ')}\n` +
                                      `• Pending reloads: ${watcherStatus.pendingReloads.length}\n` +
                                      `• Auto-reload: ${watcherStatus.totalWatchers > 0 ? '✅ Enabled' : '❌ Disabled'}`;
                    
                    await reply(watcherInfo);
                    break;

                case 'pc':
                case 'privatechat':
                    const pcStatus = bot.config.privateChat.allowAdminOnly ? '🟢 BẬT' : '🔴 TẮT';
                    const pcInfo = `💬 PRIVATE CHAT\n\n` +
                                 `• Trạng thái: ${pcStatus}\n` +
                                 `• Link admin: ${bot.config.adminFacebookLink ? '✅ Đã cài' : '❌ Chưa cài'}\n\n` +
                                 `💡 Sử dụng /privatechat để cài đặt chi tiết`;
                    
                    await reply(pcInfo);
                    break;

                default:
                    await reply('❌ Action không hợp lệ! Sử dụng: ban, unban, reload, stats, watcher, pc');
            }
        } catch (error) {
            await reply('❌ Đã xảy ra lỗi khi thực hiện lệnh admin!');
        }
    }
};