module.exports = {
    name: 'admintest',
    aliases: ['atest'],
    description: 'Test lệnh chỉ admin có thể dùng',
    usage: 'admintest',
    cooldown: 3000,
    adminOnly: true,
    author: 'Lê Công',

    async execute({ reply, message, bot }) {
        try {
            const isPrivate = !message.isGroup;
            const timeInfo = bot.timeUtils.formatVi();
            
            const testMsg = `👑 ADMIN TEST THÀNH CÔNG\n\n` +
                          `• User ID: ${message.senderID}\n` +
                          `• Chat type: ${isPrivate ? '💬 Private' : '👥 Group'}\n` +
                          `• Thread ID: ${message.threadID}\n` +
                          `• Thời gian: ${timeInfo}\n` +
                          `• Admin status: ✅ Confirmed\n\n` +
                          `🎉 Bạn có thể chat riêng với bot!`;
            
            await reply(testMsg);
        } catch (error) {
            await reply('❌ Lỗi test admin!');
        }
    }
};