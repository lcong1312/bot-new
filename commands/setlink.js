const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: 'setlink',
    aliases: ['setadminlink', 'adminlink'],
    description: 'Cài đặt link Facebook của admin',
    usage: 'setlink <facebook_link>',
    cooldown: 0,
    adminOnly: true,
    author: 'Lê Công',

    async execute({ args, reply, bot }) {
        try {
            if (args.length === 0) {
                const currentLink = bot.config.adminFacebookLink || 'Chưa cài đặt';
                return await reply(`📋 Link admin hiện tại:\n${currentLink}\n\n💡 Sử dụng: setlink <facebook_link>`);
            }

            const newLink = args.join(' ');
            
            // Validate URL
            if (!newLink.includes('facebook.com') && !newLink.includes('fb.com') && !newLink.includes('m.me')) {
                return await reply('❌ Link không hợp lệ! Vui lòng sử dụng link Facebook.');
            }

            // Update config
            bot.config.adminFacebookLink = newLink;

            // Save to file
            const configPath = path.join(__dirname, '../config.json');
            await fs.writeJson(configPath, bot.config, { spaces: 2 });

            await reply(`✅ Đã cập nhật link admin:\n${newLink}\n\n📝 Tin nhắn chuyển hướng sẽ sử dụng link này.`);
        } catch (error) {
            await reply('❌ Không thể cập nhật link admin!');
        }
    }
};