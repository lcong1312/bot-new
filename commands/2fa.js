const speakeasy = require('speakeasy');

module.exports = {
    name: '2fa',
    aliases: ['totp', 'otp', 'code'],
    description: 'Lấy mã 2FA/Google Authenticator',
    usage: '2fa',
    cooldown: 3000,
    adminOnly: true,
    category: 'admin',
    author: 'Lê Công',

    async execute({ reply, bot }) {
        try {
            // Secret key của bạn (đã format lại)
            const secret = 'HWACAA277Q7THFU5V65WGCMIYX4HAREO';
            
            // Tạo mã 2FA
            const token = speakeasy.totp({
                secret: secret,
                encoding: 'base32'
            });
            
            // Tính thời gian còn lại (mã mới mỗi 30s)
            const remaining = 30 - Math.floor((Date.now() / 1000) % 30);
            
            const message = `🔐 MÃ 2FA\n\n` +
                          `📱 Mã: ${token}\n` +
                          `⏱️ Còn lại: ${remaining}s\n` +
                          `⏰ Thời gian: ${bot.timeUtils.currentTime()}\n\n` +
                          `💡 Mã sẽ đổi sau ${remaining} giây`;
            
            await reply(message);
        } catch (error) {
            console.error('Error generating 2FA:', error);
            await reply('❌ Không thể tạo mã 2FA!');
        }
    }
};
