module.exports = {
    name: 'antiout',
    aliases: ['chongout', 'antikick'],
    description: 'Bật/tắt chống out (tự động add lại khi bị kick)',
    usage: 'antiout [on/off/status]',
    cooldown: 3000,
    adminOnly: true,
    author: 'Lê Công',

    async execute({ args, reply, bot, message }) {
        try {
            const threadData = await bot.getThreadData(message.threadID);
            
            if (!threadData.antiOut) {
                threadData.antiOut = { enabled: false };
            }

            if (args.length === 0 || args[0].toLowerCase() === 'status') {
                const status = threadData.antiOut.enabled ? '🟢 BẬT' : '🔴 TẮT';
                return await reply(`⚙️ TRẠNG THÁI CHỐNG OUT\n\n• Trạng thái: ${status}\n\n💡 Sử dụng:\n• antiout on - Bật chống out\n• antiout off - Tắt chống out`);
            }

            const action = args[0].toLowerCase();

            switch (action) {
                case 'on':
                case 'enable':
                case 'bat':
                    threadData.antiOut.enabled = true;
                    await bot.saveThreadData(message.threadID, threadData);
                    await reply('✅ Đã BẬT chống out!\n\n⚠️ Khi có thành viên bị kick, bot sẽ tự động add lại vào nhóm.');
                    break;

                case 'off':
                case 'disable':
                case 'tat':
                    threadData.antiOut.enabled = false;
                    await bot.saveThreadData(message.threadID, threadData);
                    await reply('❌ Đã TẮT chống out!');
                    break;

                default:
                    await reply('❌ Action không hợp lệ! Sử dụng: on, off, status');
            }

        } catch (error) {
            console.error('Error in antiout command:', error);
            await reply('❌ Đã xảy ra lỗi khi cài đặt chống out!');
        }
    }
};
