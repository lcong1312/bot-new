module.exports = {
    name: 'listadmin',
    aliases: ['adminlist', 'admins'],
    description: 'Xem danh sách admin của bot',
    usage: 'listadmin',
    cooldown: 5000,
    adminOnly: false,
    author: 'Lê Công',

    async execute({ reply, bot, api }) {
        try {
            if (bot.config.adminIDs.length === 0) {
                return await reply('📋 Chưa có admin nào được cấu hình!');
            }

            let adminList = '👑 DANH SÁCH ADMIN\n\n';
            
            for (let i = 0; i < bot.config.adminIDs.length; i++) {
                const adminID = bot.config.adminIDs[i];
                
                // Lấy thông tin admin
                let adminInfo;
                try {
                    const info = await api.getUserInfo(adminID);
                    adminInfo = info[adminID];
                } catch (error) {
                    adminInfo = { name: 'Unknown User' };
                }

                adminList += `${i + 1}. ${adminInfo.name || 'Unknown'}\n`;
                adminList += `   ID: ${adminID}\n\n`;
            }

            adminList += `📊 Tổng cộng: ${bot.config.adminIDs.length} admin`;

            await reply(adminList);
        } catch (error) {
            await reply('❌ Không thể lấy danh sách admin!');
        }
    }
};