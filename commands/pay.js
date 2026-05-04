module.exports = {
    name: 'pay',
    aliases: ['cong', 'congtien', 'addmoney'],
    description: 'Cộng/trừ tiền cho người dùng',
    usage: 'pay [@mention | userID] <số tiền>',
    cooldown: 3000,
    adminOnly: true,
    author: 'Lê Công',

    async execute({ message, args, reply, bot, api }) {
        try {
            let targetID;
            let amountIndex = 1;

            // Kiểm tra có mention không
            if (message.mentions && Object.keys(message.mentions).length > 0) {
                targetID = Object.keys(message.mentions)[0].replace(/^(fb)?id[:.]/, '');
                amountIndex = args.length - 1;
            }
            // Kiểm tra có UID không
            else if (args[0] && !isNaN(args[0]) && args[1]) {
                targetID = args[0];
                amountIndex = 1;
            }
            // Chỉ có số tiền -> cộng cho bản thân
            else if (args[0] && !isNaN(args[0])) {
                targetID = message.senderID;
                amountIndex = 0;
            }
            else {
                return await reply('❌ Vui lòng nhập đúng cú pháp!\n\nVí dụ:\n• pay @mention 1000\n• pay 100095121630849 1000\n• pay 1000 (cộng cho bản thân)');
            }

            // Lấy số tiền
            const amount = parseInt(args[amountIndex]);

            if (isNaN(amount) || amount === 0) {
                return await reply('❌ Số tiền phải là số nguyên khác 0!');
            }

            // Lấy dữ liệu user
            const userData = await bot.getUserData(targetID);
            if (!userData) {
                return await reply(`❌ Không tìm thấy người dùng với ID: ${targetID}`);
            }

            // Tính toán số dư mới
            const currentMoney = userData.money || 0;
            const newMoney = currentMoney + amount;

            // Không cho phép số dư âm
            if (newMoney < 0) {
                return await reply(`❌ Không thể trừ! Số dư hiện tại: ${currentMoney}$, số tiền cần trừ: ${Math.abs(amount)}$`);
            }

            // Cập nhật số dư
            userData.money = newMoney;
            await bot.saveUserData(targetID, userData);

            // Lấy tên user
            let userName = userData.name || 'Unknown';
            try {
                const userInfo = await api.getUserInfo(targetID);
                userName = userInfo[targetID]?.name || userName;
            } catch (error) {
                console.error('Error getting user info:', error);
            }

            // Tạo thông báo
            const action = amount > 0 ? 'cộng' : 'trừ';
            const preposition = amount > 0 ? 'cho' : 'của';
            const absAmount = Math.abs(amount);

            const message_text = `✅ Đã ${action} ${absAmount}$ ${preposition} ${userName}\n💰 Số dư mới: ${newMoney}$`;
            await reply(message_text);

        } catch (error) {
            console.error('Error in pay command:', error);
            await reply('❌ Đã xảy ra lỗi khi xử lý giao dịch!');
        }
    }
};
