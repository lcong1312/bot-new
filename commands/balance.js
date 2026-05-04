module.exports = {
    name: 'balance',
    aliases: ['bal', 'money', 'sodu'],
    description: 'Xem số dư của bạn hoặc người khác',
    usage: 'balance [@mention hoặc để trống]',
    cooldown: 3000,
    adminOnly: false,
    author: 'Lê Công',

    async execute({ message, args, reply, bot, api, userData }) {
        try {
            let targetID = message.senderID;
            let targetData = userData;

            // Nếu có mention
            if (message.mentions && Object.keys(message.mentions).length > 0) {
                targetID = Object.keys(message.mentions)[0].replace(/^(fb)?id[:.]/, '');
                targetData = await bot.getUserData(targetID);
            }
            // Nếu có UID
            else if (args[0] && !isNaN(args[0])) {
                targetID = args[0];
                targetData = await bot.getUserData(targetID);
            }

            if (!targetData) {
                return await reply('❌ Không tìm thấy thông tin người dùng!');
            }

            // Lấy tên user
            let userName = targetData.name || 'Unknown';
            try {
                const userInfo = await api.getUserInfo(targetID);
                userName = userInfo[targetID]?.name || userName;
            } catch (error) {
                console.error('Error getting user info:', error);
            }

            const money = targetData.money || 0;
            const exp = targetData.exp || 0;

            const balanceMsg = `💰 SỐ DƯ\n\n` +
                             `👤 Tên: ${userName}\n` +
                             `💵 Số dư: ${money.toLocaleString()}$\n` +
                             `⭐ Kinh nghiệm: ${exp.toLocaleString()} EXP`;

            await reply(balanceMsg);

        } catch (error) {
            console.error('Error in balance command:', error);
            await reply('❌ Không thể lấy thông tin số dư!');
        }
    }
};
