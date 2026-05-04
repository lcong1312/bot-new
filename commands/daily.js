module.exports = {
    name: 'daily',
    aliases: ['diemdanh', '출석', 'checkin'],
    description: 'Điểm danh hàng ngày để nhận thưởng',
    usage: 'daily',
    cooldown: 3000,
    adminOnly: false,
    author: 'Lê Công',

    async execute({ message, reply, bot, userData }) {
        try {
            const now = Date.now();
            const oneDayMs = 24 * 60 * 60 * 1000; // 24 giờ tính bằng milliseconds
            
            // Kiểm tra lần điểm danh cuối
            const lastDaily = userData.lastDaily || 0;
            const timeSinceLastDaily = now - lastDaily;
            
            // Kiểm tra đã điểm danh hôm nay chưa
            if (timeSinceLastDaily < oneDayMs) {
                const timeLeft = oneDayMs - timeSinceLastDaily;
                const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
                const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                
                return await reply(
                    `⏰ BẠN ĐÃ ĐIỂM DANH HÔM NAY RỒI!\n\n` +
                    `⏳ Thời gian còn lại: ${hoursLeft} giờ ${minutesLeft} phút\n` +
                    `💡 Quay lại vào ngày mai để nhận thưởng!`
                );
            }
            
            // Tính streak (chuỗi ngày liên tiếp)
            let streak = userData.dailyStreak || 0;
            const lastDailyDate = new Date(lastDaily).toDateString();
            const yesterdayDate = new Date(now - oneDayMs).toDateString();
            
            if (lastDailyDate === yesterdayDate) {
                // Điểm danh liên tiếp
                streak += 1;
            } else if (timeSinceLastDaily >= oneDayMs) {
                // Bỏ lỡ ngày, reset streak
                streak = 1;
            }
            
            // Tính thưởng
            const baseMoney = Math.floor(Math.random() * 19001) + 1000; // 1000-20000
            const streakBonus = Math.min(streak * 100, 5000); // Tối đa +5000 từ streak
            const totalMoney = baseMoney + streakBonus;
            
            const baseExp = Math.floor(Math.random() * 50) + 10; // 10-60 exp
            const streakExpBonus = Math.min(streak * 5, 100); // Tối đa +100 exp từ streak
            const totalExp = baseExp + streakExpBonus;
            
            // Cập nhật dữ liệu user
            userData.money = (userData.money || 0) + totalMoney;
            userData.exp = (userData.exp || 0) + totalExp;
            userData.lastDaily = now;
            userData.dailyStreak = streak;
            userData.totalDailyCount = (userData.totalDailyCount || 0) + 1;
            
            await bot.saveUserData(message.senderID, userData);
            
            // Tạo thông báo
            let streakEmoji = '🔥';
            if (streak >= 30) streakEmoji = '🏆';
            else if (streak >= 14) streakEmoji = '💎';
            else if (streak >= 7) streakEmoji = '⭐';
            
            const dailyMsg = 
                `✅ ĐIỂM DANH THÀNH CÔNG!\n\n` +
                `💰 Tiền thưởng: +${baseMoney.toLocaleString()}$\n` +
                (streakBonus > 0 ? `${streakEmoji} Streak bonus: +${streakBonus.toLocaleString()}$\n` : '') +
                `💵 Tổng nhận: ${totalMoney.toLocaleString()}$\n\n` +
                `⭐ Kinh nghiệm: +${baseExp} EXP\n` +
                (streakExpBonus > 0 ? `${streakEmoji} Streak bonus: +${streakExpBonus} EXP\n` : '') +
                `📊 Tổng EXP: +${totalExp} EXP\n\n` +
                `${streakEmoji} Chuỗi điểm danh: ${streak} ngày\n` +
                `📈 Tổng số lần: ${userData.totalDailyCount} lần\n` +
                `💰 Số dư mới: ${userData.money.toLocaleString()}$\n` +
                `⭐ Tổng EXP: ${userData.exp.toLocaleString()}\n\n` +
                `💡 Điểm danh liên tục để nhận thêm bonus!`;
            
            await reply(dailyMsg);
            
        } catch (error) {
            console.error('Error in daily command:', error);
            await reply('❌ Đã xảy ra lỗi khi điểm danh!');
        }
    }
};
