module.exports = {
    name: 'help',
    aliases: ['h', 'cmd'],
    description: 'Xem cách sử dụng lệnh',
    usage: 'help [tên lệnh | số trang]',
    cooldown: 5000,
    adminOnly: false,
    category: 'info',
    author: 'Lê Công',

    async execute({ args, bot, reply, event }) {
        try {
            const prefix = bot.config.prefix || '/';
            const commandName = (args[0] || '').toLowerCase();
            const command = bot.commands.get(commandName) || 
                          Array.from(bot.commands.values()).find(cmd => 
                              cmd.aliases && cmd.aliases.includes(commandName)
                          );

            // ———————————————— LIST ALL COMMAND ——————————————— //
            if (!command && !args[0] || !isNaN(args[0])) {
                const commands = Array.from(bot.commands.values());
                const isAdmin = bot.config.adminIDs.includes(event.senderID);
                
                // Phân loại commands
                const adminCommands = [];
                const userCommands = [];
                
                commands.forEach(cmd => {
                    if (cmd.adminOnly) {
                        adminCommands.push(cmd.name);
                    } else {
                        userCommands.push(cmd.name);
                    }
                });

                // Tạo message
                let msg = `╭─────────────⦿\n`;
                msg += `│ 📋 𝗧𝗼̂̉𝗻𝗴 𝘀𝗼̂́ 𝗹𝗲̣̂𝗻𝗵: ${commands.length}\n`;
                msg += `╰─────────────⦿\n\n`;
                
                // Admin commands (hiện trước, chỉ cho admin)
                if (isAdmin && adminCommands.length > 0) {
                    msg += `╭──⦿【 🔧 ADMIN 】\n`;
                    msg += `│ ${adminCommands.sort().map(name => `${prefix}${name}`).join('\n│ ')}\n`;
                    msg += `╰────────⦿\n\n`;
                }
                
                // User commands (hiện sau)
                msg += `╭──⦿【 👥 USER 】\n`;
                msg += `│ ${userCommands.sort().map(name => `${prefix}${name}`).join('\n│ ')}\n`;
                msg += `╰────────⦿\n\n`;
                
                msg += `╭─────────────⦿\n`;
                msg += `│ 💡 Gõ ${prefix}help <tên lệnh>\n`;
                msg += `│ để xem chi tiết lệnh\n`;
                msg += `╰─────────────⦿`;
                
                await reply(msg);
            }
            // ————————————————— COMMAND NOT FOUND ————————————————— //
            else if (!command && args[0]) {
                return await reply(`❌ Lệnh "${args[0]}" không tồn tại`);
            }
            // ————————————————— INFO COMMAND ————————————————— //
            else {
                const aliasesString = command.aliases ? command.aliases.join(', ') : 'Không có';
                const roleText = command.adminOnly ? '2 (Admin bot)' : '0 (Tất cả người dùng)';
                const author = command.author || 'Unknown';
                const description = command.description || 'Không có mô tả';
                const usage = (command.usage || command.name)
                    .replace(/\{prefix\}|\{p\}/g, prefix)
                    .replace(/\{name\}|\{n\}/g, command.name)
                    .replace(/\{pn\}/g, prefix + command.name);

                const infoMsg = `⦿────── TÊN ──────⦿
✪ ${command.name}
✪▫THÔNG TIN▫
✪ Mô tả: ${description}
✪ Tên khác: ${aliasesString}
✪ Phiên bản: ${command.version || '1.0'}
✪ Quyền hạn: ${roleText}
✪ Thời gian chờ: ${(command.cooldown || 1000) / 1000}s
✪ Tác giả: ${author}
✪▫CÁCH DÙNG▫
» ${usage}
⦿─────────────────⦿`;

                await reply(infoMsg);
            }
        } catch (error) {
            console.error('Error in help command:', error);
            await reply('❌ Đã xảy ra lỗi khi hiển thị help!');
        }
    }
};