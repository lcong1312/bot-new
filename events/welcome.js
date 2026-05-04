const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: 'welcome',
    type: 'event',
    description: 'Chào mừng thành viên mới và chào tạm biệt',
    adminOnly: false,

    async execute({ message, send, bot }) {
        try {
            // Chỉ xử lý trong group
            if (!message.isGroup) return;
            
            const threadData = await bot.getThreadData(message.threadID);
            
            // Kiểm tra settings
            if (threadData.settings?.welcome === false) return;
            
            switch (message.logMessageType) {
                case 'log:subscribe':
                    // Thành viên mới join
                    for (const userID of message.logMessageData.addedParticipants) {
                        try {
                            const userInfo = await bot.getUserInfo(userID.userFbId);
                            const userName = userInfo[userID.userFbId]?.name || 'Thành viên mới';
                            
                            const welcomeMsg = `🎉 Chào mừng ${userName} đã tham gia nhóm!
                            
👋 Xin chào! Chúc bạn có những trải nghiệm vui vẻ tại đây.
💡 Gõ ${threadData.prefix || bot.config.prefix}help để xem danh sách lệnh.

🎊 Chúc mừng thành viên thứ ${message.participantIDs?.length || '?'} của nhóm!`;
                            
                            // Tải avatar
                            try {
                                const avatarUrl = `https://graph.facebook.com/${userID.userFbId}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
                                
                                const cacheDir = path.join(__dirname, '../cache');
                                await fs.ensureDir(cacheDir);
                                
                                const avatarPath = path.join(cacheDir, `welcome_${userID.userFbId}.jpg`);
                                
                                const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
                                await fs.writeFile(avatarPath, response.data);
                                
                                await send({
                                    body: welcomeMsg,
                                    attachment: fs.createReadStream(avatarPath)
                                });
                                
                                // Xóa file sau khi gửi
                                setTimeout(() => {
                                    fs.unlink(avatarPath).catch(err => console.error('Error deleting avatar:', err));
                                }, 5000);
                                
                            } catch (error) {
                                console.error('Error loading welcome avatar:', error);
                                await send(welcomeMsg);
                            }
                            
                            // Tạo user data cho thành viên mới
                            await bot.getUserData(userID.userFbId);
                            
                        } catch (error) {
                            console.error('Welcome error for user:', userID, error);
                        }
                    }
                    break;
                    
                case 'log:unsubscribe':
                    // Thành viên rời nhóm
                    if (threadData.settings?.goodbye !== false) {
                        const leftUser = message.logMessageData.leftParticipantFbId;
                        
                        try {
                            const userInfo = await bot.getUserInfo(leftUser);
                            const userName = userInfo[leftUser]?.name || 'Thành viên';
                            
                            const goodbyeMsg = `👋 ${userName} đã rời khỏi nhóm.
                            
😢 Chúc bạn mọi điều tốt lành!
👥 Nhóm còn lại ${message.participantIDs?.length || '?'} thành viên.`;
                            
                            // Tải avatar
                            try {
                                const avatarUrl = `https://graph.facebook.com/${leftUser}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
                                
                                const cacheDir = path.join(__dirname, '../cache');
                                await fs.ensureDir(cacheDir);
                                
                                const avatarPath = path.join(cacheDir, `goodbye_${leftUser}.jpg`);
                                
                                const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
                                await fs.writeFile(avatarPath, response.data);
                                
                                await send({
                                    body: goodbyeMsg,
                                    attachment: fs.createReadStream(avatarPath)
                                });
                                
                                // Xóa file sau khi gửi
                                setTimeout(() => {
                                    fs.unlink(avatarPath).catch(err => console.error('Error deleting avatar:', err));
                                }, 5000);
                                
                            } catch (error) {
                                console.error('Error loading goodbye avatar:', error);
                                await send(goodbyeMsg);
                            }
                            
                        } catch (error) {
                            console.error('Goodbye error:', error);
                            await send('👋 Một thành viên đã rời khỏi nhóm.');
                        }
                    }
                    break;
                    
                case 'log:thread-name':
                    // Đổi tên nhóm
                    const newName = message.logMessageData.name;
                    await send(`📝 Tên nhóm đã được đổi thành: "${newName}"`);
                    
                    // Cập nhật thread data
                    threadData.name = newName;
                    await bot.saveThreadData(message.threadID, threadData);
                    break;
                    
                case 'log:thread-image':
                    // Đổi ảnh nhóm
                    await send('🖼️ Ảnh nhóm đã được thay đổi!');
                    break;
                    
                case 'log:thread-color':
                    // Đổi màu chat
                    await send('🎨 Màu sắc cuộc trò chuyện đã được thay đổi!');
                    break;
                    
                case 'log:user-nickname':
                    // Đổi nickname
                    const participant = message.logMessageData.participant_id;
                    const nickname = message.logMessageData.nickname;
                    
                    try {
                        const userInfo = await bot.getUserInfo(participant);
                        const userName = userInfo[participant]?.name || 'Thành viên';
                        
                        if (nickname) {
                            await send(`✏️ ${userName} đã đổi nickname thành: "${nickname}"`);
                        } else {
                            await send(`✏️ ${userName} đã xóa nickname`);
                        }
                    } catch (error) {
                        console.error('Nickname change error:', error);
                    }
                    break;
                    
                default:
                    // Log các loại event khác để debug
                    console.log('Unknown group event:', message.logMessageType);
            }
            
        } catch (error) {
            console.error('Welcome event error:', error);
        }
    }
};