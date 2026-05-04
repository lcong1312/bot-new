module.exports = {
    name: 'taixiu',
    aliases: ['tx'],
    description: 'Chơi tài xỉu (3 xúc xắc)',
    usage: 'taixiu <tài/xỉu> <số tiền | all>',
    cooldown: 5000,
    adminOnly: false,
    author: 'Lê Công',

    async execute({ message, args, reply, bot, userData, api }) {
        try {
            if (args.length < 2) {
                return await reply('❌ Vui lòng nhập đúng cú pháp!\n\nVí dụ:\n• taixiu tài 1000\n• taixiu xỉu 500\n\n📌 Tài: 11-17 điểm\n📌 Xỉu: 4-10 điểm');
            }

            const choice = args[0].toLowerCase();
            const isAllIn = args[1].toLowerCase() === 'all';

            // Validate choice
            if (choice !== 'tài' && choice !== 'xỉu' && choice !== 'tai' && choice !== 'xiu') {
                return await reply('❌ Vui lòng chọn "tài" hoặc "xỉu"!');
            }

            // Kiểm tra số dư trước
            const currentMoney = userData.money || 0;

            let betAmount;
            if (isAllIn) {
                betAmount = currentMoney;
            } else {
                betAmount = parseInt(args[1]);
                if (isNaN(betAmount) || betAmount <= 0) {
                    return await reply('❌ Số tiền cược phải là số nguyên dương hoặc "all"!');
                }
            }

            if (currentMoney < betAmount || betAmount <= 0) {
                return await reply(`❌ Số dư không đủ!\n💰 Số dư hiện tại: ${currentMoney}$\n💵 Số tiền cược: ${betAmount}$`);
            }

            // Giới hạn cược
            if (betAmount < 100) {
                return await reply('❌ Số tiền cược tối thiểu là 100$!');
            }

            if (!isAllIn && betAmount > 10000) {
                return await reply('❌ Số tiền cược tối đa là 10,000$! (Dùng "all" để cược tất cả)');
            }

            // Tung xúc xắc
            const dice1 = Math.floor(Math.random() * 6) + 1;
            const dice2 = Math.floor(Math.random() * 6) + 1;
            const dice3 = Math.floor(Math.random() * 6) + 1;
            const total = dice1 + dice2 + dice3;

            // Xác định kết quả
            const result = total >= 11 ? 'tài' : 'xỉu';
            const normalizedChoice = (choice === 'tai' ? 'tài' : choice === 'xiu' ? 'xỉu' : choice);
            const isWin = result === normalizedChoice;

            // Tính toán tiền thắng/thua
            const winAmount = isWin ? betAmount : -betAmount;
            const newMoney = currentMoney + winAmount;

            // Cập nhật số dư
            userData.money = newMoney;
            await bot.saveUserData(message.senderID, userData);

            // Tạo thông báo
            const diceEmoji = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
            const resultEmoji = isWin ? '🎉' : '😢';
            const resultText = isWin ? 'THẮNG' : 'THUA';

            const resultMsg = `🎲 KẾT QUẢ TÀI XỈU ${resultEmoji}\n\n` +
                            `🎯 Bạn chọn: ${normalizedChoice.toUpperCase()}\n` +
                            `🎲 Xúc xắc: ${diceEmoji[dice1-1]} ${diceEmoji[dice2-1]} ${diceEmoji[dice3-1]}\n` +
                            `📊 Tổng điểm: ${total} (${result.toUpperCase()})\n\n` +
                            `${isWin ? '🎉' : '💔'} Kết quả: ${resultText}\n` +
                            `💵 ${isWin ? '+' : ''}${winAmount}$\n` +
                            `💰 Số dư mới: ${newMoney}$`;

            await reply(resultMsg);

        } catch (error) {
            console.error('Error in taixiu command:', error);
            await reply('❌ Đã xảy ra lỗi khi chơi tài xỉu!');
        }
    }
};
