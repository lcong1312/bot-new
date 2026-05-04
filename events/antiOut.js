module.exports = {
    name: 'antiOut',
    type: 'event',
    description: 'Tự động add lại thành viên bị kick (chống out)',
    adminOnly: false,

    async execute({ message, api, bot }) {
        try {
            // Kiểm tra message có tồn tại không
            if (!message) return;

            // Chỉ xử lý event log:unsubscribe (người rời nhóm)
            if (message.logMessageType !== 'log:unsubscribe') return;

            // Chỉ xử lý trong nhóm (threadID nhóm là số lớn, không phải user-to-user)
            if (!message.threadID) return;

            const { threadID, logMessageData, author } = message;
            console.log('[ANTI-OUT] DEBUG event:', JSON.stringify({ threadID, logMessageData, author }));

            // Lấy thông tin thread
            const threadData = await bot.getThreadData(threadID);
            console.log('[ANTI-OUT] DEBUG threadData.antiOut:', JSON.stringify(threadData?.antiOut));

            // Kiểm tra có bật chống out không
            if (!threadData.antiOut || !threadData.antiOut.enabled) {
                console.log('[ANTI-OUT] Chống out chưa bật hoặc disabled, return');
                return;
            }

            // Lấy danh sách người bị kick
            const leftParticipants = logMessageData?.leftParticipantFbId;
            console.log('[ANTI-OUT] DEBUG leftParticipants:', leftParticipants);

            if (!leftParticipants) {
                console.log('[ANTI-OUT] Không lấy được leftParticipantFbId, return');
                return;
            }

            // Kiểm tra bot có phải admin không
            const threadInfo = await api.getThreadInfo(threadID);
            const botID = api.getCurrentUserID();
            console.log('[ANTI-OUT] DEBUG botID:', botID, '| adminIDs:', JSON.stringify(threadInfo.adminIDs?.slice(0, 3)));
            const isAdmin = (threadInfo.adminIDs || []).some(admin => String(admin.id || admin) === String(botID));
            
            if (!isAdmin) {
                console.log('[ANTI-OUT] Bot không có quyền admin, không thể add lại');
                return;
            }

            // Lấy thông tin người bị kick
            let userName = 'Unknown';
            try {
                const userInfo = await api.getUserInfo(leftParticipants);
                userName = userInfo[leftParticipants]?.name || 'Unknown';
            } catch (error) {
                console.error('Error getting user info:', error);
            }

            // Delay 2 giây trước khi add lại
            setTimeout(async () => {
                try {
                    await api.addUserToGroup(leftParticipants, threadID);
                    
                    // Gửi thông báo
                    await api.sendMessage(
                        `⚠️ CHỐNG OUT\n\n` +
                        `👤 ${userName} đã rời nhóm\n` +
                        `🔄 Bot đã tự động add lại vào nhóm\n` +
                        `💡 Tắt chống out: /antiout off`,
                        threadID
                    );
                    
                    console.log(`[ANTI-OUT] Đã add lại ${userName} vào nhóm ${threadID}`);
                } catch (error) {
                    console.error('[ANTI-OUT] Lỗi khi add lại user:', error);
                    
                    // Thông báo lỗi
                    await api.sendMessage(
                        `❌ Không thể add lại ${userName}\n` +
                        `Có thể user đã chặn bot hoặc không cho phép được thêm vào nhóm.`,
                        threadID
                    );
                }
            }, 2000);

        } catch (error) {
            console.error('Error in antiOut event:', error);
        }
    }
};
