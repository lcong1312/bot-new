module.exports = {
    name: 'reaction',
    aliases: ['react', 'r'],
    description: 'Test thả cảm xúc vào tin nhắn',
    usage: 'reaction [emoji]',
    cooldown: 3000,
    adminOnly: true,
    author: 'Lê Công',

    async execute({ args, reply, message, api }) {
        try {
            const reaction = args[0] || '👍';
            
            // Thả cảm xúc vào tin nhắn của user
            try {
                await api.setMessageReaction(reaction, message.messageID);
                await reply(`✅ Đã thả cảm xúc ${reaction} vào tin nhắn của bạn!`);
            } catch (error) {
                // Fallback method
                await api.react(message.messageID, reaction);
                await reply(`🔄 Đã thử thả cảm xúc ${reaction} (fallback method)`);
            }
            
        } catch (error) {
            await reply(`❌ Không thể thả cảm xúc: ${error.message}`);
        }
    }
};