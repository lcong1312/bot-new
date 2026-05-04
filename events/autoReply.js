module.exports = {
    name: 'autoReply',
    type: 'message', // hoặc 'all' để lắng nghe tất cả
    description: 'Tự động trả lời một số từ khóa',
    adminOnly: false,

    async execute({ message, threadData, reply, react, bot }) {
        try {
            // Bỏ qua tin nhắn từ bot
            if (message.senderID === bot.api.getCurrentUserID()) return;
            
            // Bỏ qua nếu là command
            const prefix = threadData?.prefix || bot.config.prefix || '/';
            if (message.body?.startsWith(prefix)) return;
            
            const body = message.body?.toLowerCase() || '';
            
            // Ưu tiên reply khi có từ "bot"
            if (body.includes('bot')) {
                try {
                    await react('🤖');
                    
                    // Danh sách câu trả lời ngẫu nhiên kiểu chọc ghẹo
                    const botReplies = [
                        '🤖 Có gì cần giúp không?',
                        '🤖 Gọi tui à? Tui đây này!',
                        '🤖 Dạ, em nghe ạ! 👂',
                        '🤖 Ủa gọi ai đó? 👀',
                        '🤖 Tui đang bận ăn điện đây... �',
                        '🤖 Gọi bot à? Bot đẹp trai đây! 😎',
                        '🤖 Có tui đây, cần gì cứ nói! 💪',
                        '🤖 Dạ, bot nghe lệnh! 🫡',
                        '🤖 Ơ kìa, gọi tui hả? 😏',
                        '🤖 Bot đây, sẵn sàng phục vụ! ✨',
                        '🤖 Gọi tui mà không cho ăn à? 🍔',
                        '🤖 Tui đang ngủ đây... 😴 À không, tỉnh rồi!',
                        '🤖 Bot siêu cấp vip pro đây! 🌟',
                        '🤖 Gọi gì đó? Tui không nghe rõ... 👂',
                        '🤖 Ê ê, đừng có la tui nhé! 😤',
                        '🤖 Bot đây, có việc gì không? 🤔',
                        '🤖 Tui đang code đây, đừng làm phiền! �',
                        '🤖 Gọi bot à? Tui không phải Siri đâu nhé! 😂',
                        '🤖 Dạ, bot xin nghe! 🎧',
                        '🤖 Ủa, ai gọi tui vậy? 👻'
                    ];
                    
                    const randomReply = botReplies[Math.floor(Math.random() * botReplies.length)];
                    const delay = Math.random() * 2000 + 500;
                    
                    setTimeout(() => {
                        reply(randomReply).catch(err => {
                            console.error('Error sending bot reply:', err);
                        });
                    }, delay);
                } catch (error) {
                    console.error('Error in bot auto reply:', error);
                }
                return; // Dừng lại, không check các từ khác
            }
            
            // Auto reply cho các từ khóa khác
            const replies = {
                'hello': '� Xhin chào!',
                'hi': '👋 Hi bạn!',
                'chào': '� C hào bạn!',
                'help': `💡 Gõ ${prefix}help để xem danh sách lệnh`,
                'time': `⏰ Bây giờ là: ${bot.timeUtils.currentTime()}`,
                'date': `📅 Hôm nay là: ${bot.timeUtils.today()}`,
                'ping': '🏓 Pong!',
                'good morning': '🌅 Chào buổi sáng!',
                'good night': '🌙 Chúc ngủ ngon!',
                'thank': '😊 Không có gì!',
                'cảm ơn': '😊 Không có gì!',
                'thanks': '😊 You\'re welcome!'
            };
            
            // Kiểm tra từ khóa
            for (const [keyword, response] of Object.entries(replies)) {
                if (body.includes(keyword)) {
                    try {
                        // React trước
                        await react('👍');
                        
                        // Delay ngẫu nhiên để tự nhiên hơn
                        const delay = Math.random() * 2000 + 500; // 0.5-2.5s
                        setTimeout(() => {
                            reply(response).catch(err => {
                                console.error('Error sending reply:', err);
                            });
                        }, delay);
                    } catch (error) {
                        console.error('Error in auto reply:', error);
                    }
                    
                    break; // Chỉ reply 1 lần
                }
            }
            
            // Easter eggs
            try {
                if (body.includes('😂') || body.includes('haha') || body.includes('lol')) {
                    await react('😂');
                }
                
                if (body.includes('❤️') || body.includes('love') || body.includes('yêu')) {
                    await react('❤️');
                }
                
                if (body.includes('😢') || body.includes('sad') || body.includes('buồn')) {
                    await react('😢');
                }
            } catch (error) {
                console.error('Error in easter eggs:', error);
            }
            
        } catch (error) {
            console.error('AutoReply event error:', error);
        }
    }
};
