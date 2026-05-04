module.exports = {
    name: 'echo',
    aliases: ['say', 'repeat'],
    description: 'Lặp lại tin nhắn bạn gửi',
    usage: 'echo <tin nhắn>',
    cooldown: 2000,
    adminOnly: false,
    author: 'Lê Công',

    async execute({ args, reply }) {
        try {
            if (args.length === 0) {
                return await reply('❌ Vui lòng nhập tin nhắn cần lặp lại!');
            }

            const message = args.join(' ');
            
            // Kiểm tra tin nhắn không được quá dài
            if (message.length > 1000) {
                return await reply('❌ Tin nhắn quá dài! Tối đa 1000 ký tự.');
            }

            // Kiểm tra không chứa từ ngữ nhạy cảm (có thể mở rộng)
            const bannedWords = ['spam', 'hack', 'virus'];
            const lowerMessage = message.toLowerCase();
            
            for (const word of bannedWords) {
                if (lowerMessage.includes(word)) {
                    return await reply('❌ Tin nhắn chứa từ ngữ không được phép!');
                }
            }

            await reply(`🔊 ${message}`);
        } catch (error) {
            await reply('❌ Không thể lặp lại tin nhắn!');
        }
    }
};