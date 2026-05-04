module.exports = {
    name: 'reload',
    aliases: ['rl', 'refresh'],
    description: 'Reload commands, events hoặc config',
    usage: 'reload [commands/events/config/all]',
    cooldown: 5000,
    adminOnly: true,
    author: 'Lê Công',

    async execute({ args, bot, reply }) {
        try {
            const type = args[0] || 'all';
            
            await reply(`🔄 Đang reload ${type}...`);
            
            const startTime = Date.now();
            await bot.manualReload(type);
            const endTime = Date.now();
            
            const reloadTime = endTime - startTime;
            
            let resultMessage = `✅ RELOAD THÀNH CÔNG\n\n`;
            resultMessage += `• Type: ${type}\n`;
            resultMessage += `• Thời gian: ${reloadTime}ms\n`;
            
            if (type === 'commands' || type === 'all') {
                resultMessage += `• Commands: ${bot.commands.size}\n`;
            }
            
            if (type === 'events' || type === 'all') {
                resultMessage += `• Events: ${bot.events.size}\n`;
            }
            
            if (type === 'config' || type === 'all') {
                resultMessage += `• Config: Updated\n`;
            }
            
            resultMessage += `• Timestamp: ${bot.timeUtils.formatVi()}`;
            
            await reply(resultMessage);
        } catch (error) {
            await reply(`❌ Lỗi reload: ${error.message}`);
        }
    }
};