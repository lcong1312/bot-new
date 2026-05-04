module.exports = {
    name: 'ping',
    aliases: ['p'],
    description: 'Kiểm tra độ trễ của bot',
    usage: 'ping',
    cooldown: 5000,
    adminOnly: false,
    category: 'system',
    author: 'Lê Công',
    version: '1.0',

    async execute({ message, reply }) {
        try {
            const startTime = Date.now();
            
            await reply('🏓 Pong!').then(() => {
                const endTime = Date.now();
                const ping = endTime - startTime;
                
                reply(`⚡ Độ trễ: ${ping}ms`);
            });
        } catch (error) {
            await reply('❌ Không thể kiểm tra ping!');
        }
    }
};