module.exports = {
    name: 'dev',
    aliases: ['developer', 'debug'],
    description: 'Các lệnh dành cho developer',
    usage: 'dev [watcher/cache/memory/test]',
    cooldown: 3000,
    adminOnly: true,
    author: 'Lê Công',

    async execute({ args, bot, reply }) {
        try {
            if (args.length === 0) {
                const devHelp = `👨‍💻 LỆNH DEVELOPER\n\n` +
                              `• dev watcher - Trạng thái file watcher\n` +
                              `• dev cache - Thông tin cache\n` +
                              `• dev memory - Thông tin memory\n` +
                              `• dev test - Test auto reload\n` +
                              `• dev clear - Clear cache\n` +
                              `• dev autoreply - Test auto reply system`;
                
                return await reply(devHelp);
            }

            const action = args[0].toLowerCase();
            
            switch (action) {
                case 'watcher':
                    const watcherStatus = bot.getWatcherStatus();
                    const watcherInfo = `📁 FILE WATCHER\n\n` +
                                      `• Status: ${watcherStatus.totalWatchers > 0 ? '🟢 Active' : '🔴 Inactive'}\n` +
                                      `• Watchers: ${watcherStatus.totalWatchers}\n` +
                                      `• Watching: ${watcherStatus.activeWatchers.join(', ') || 'None'}\n` +
                                      `• Pending: ${watcherStatus.pendingReloads.length}\n` +
                                      `• Debounce: 1000ms`;
                    
                    await reply(watcherInfo);
                    break;

                case 'cache':
                    const cacheInfo = `💾 CACHE INFO\n\n` +
                                    `• Users in cache: ${bot.users.size}\n` +
                                    `• Threads in cache: ${bot.threads.size}\n` +
                                    `• Commands loaded: ${bot.commands.size}\n` +
                                    `• Events loaded: ${bot.events.size}\n` +
                                    `• Database type: ${bot.config.database.type}`;
                    
                    await reply(cacheInfo);
                    break;

                case 'memory':
                    const memUsage = process.memoryUsage();
                    const memInfo = `🧠 MEMORY USAGE\n\n` +
                                  `• RSS: ${Math.round(memUsage.rss / 1024 / 1024)}MB\n` +
                                  `• Heap Used: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB\n` +
                                  `• Heap Total: ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB\n` +
                                  `• External: ${Math.round(memUsage.external / 1024 / 1024)}MB\n` +
                                  `• Array Buffers: ${Math.round(memUsage.arrayBuffers / 1024 / 1024)}MB`;
                    
                    await reply(memInfo);
                    break;

                case 'test':
                    await reply('🧪 Testing auto-reload...\nThử chỉnh sửa một command file để test!');
                    break;

                case 'clear':
                    // Clear cache
                    bot.users.clear();
                    bot.threads.clear();
                    
                    // Force garbage collection if available
                    if (global.gc) {
                        global.gc();
                    }
                    
                    await reply('🗑️ Đã clear cache và force garbage collection');
                    break;

                case 'autoreply':
                case 'ar':
                    const arStatus = bot.config.autoReply.enabled ? '🟢 ON' : '🔴 OFF';
                    const arInfo = `🤖 AUTO REPLY SYSTEM\n\n` +
                                 `• Status: ${arStatus}\n` +
                                 `• Random Reply: ${bot.config.autoReply.randomReply ? '✅' : '❌'} (${bot.config.autoReply.replyChance}%)\n` +
                                 `• Auto Reaction: ${bot.config.autoReply.autoReaction ? '✅' : '❌'} (${bot.config.autoReply.reactionChance}%)\n` +
                                 `• Cooldown: ${bot.config.autoReply.cooldown}ms\n\n` +
                                 `💡 Gửi tin nhắn bình thường để test!`;
                    
                    await reply(arInfo);
                    break;

                default:
                    await reply('❌ Action không hợp lệ! Sử dụng: watcher, cache, memory, test, clear, autoreply');
            }
        } catch (error) {
            await reply(`❌ Lỗi dev command: ${error.message}`);
        }
    }
};