module.exports = {
    name: 'goodbye',
    type: 'event',
    description: 'Chào tạm biệt thành viên rời nhóm',

    async execute({ message, send, api }) {
        try {
            if (message.logMessageType === 'log:unsubscribe') {
                // Có người leave group
                const leftParticipantFbId = message.logMessageData.leftParticipantFbId;
                
                // Lấy thông tin user
                let userInfo;
                try {
                    const info = await api.getUserInfo(leftParticipantFbId);
                    userInfo = info[leftParticipantFbId];
                } catch (error) {
                    userInfo = { name: 'Một thành viên' };
                }
                
                const goodbyeMessage = `👋 ${userInfo.name} đã rời khỏi nhóm.\n\n` +
                                     `🌟 Chúc bạn luôn vui vẻ và hạnh phúc!`;
                
                await send(goodbyeMessage);
            }
        } catch (error) {
            console.error('Lỗi goodbye event:', error);
        }
    }
};