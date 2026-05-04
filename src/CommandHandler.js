// Simple logger thay thế npmlog
const log = {
    info: (prefix, message) => console.log(`[INFO] ${prefix}: ${message}`),
    warn: (prefix, message) => console.warn(`[WARN] ${prefix}: ${message}`),
    error: (prefix, message) => console.error(`[ERROR] ${prefix}: ${message}`),
    verbose: (prefix, message) => console.log(`[VERBOSE] ${prefix}: ${message}`)
};

class CommandHandler {
    constructor(bot) {
        this.bot = bot;
        this.cooldowns = new Map(); // Lưu cooldown như Goat Bot V2
        this.commandStats = new Map(); // Thống kê command usage
    }

    async handle(event) {
        try {
            // Chuẩn hóa event object (bot cũ dùng event, không phải message)
            const message = event; // Alias để dễ đọc code
            const senderID = event.senderID || event.userID || event.author;
            const threadID = event.threadID;
            const body = event.body;
            
            if (!body || !threadID || !senderID) {
                return;
            }
            
            // Kiểm tra private chat restrictions trước
            if (!event.isGroup) {
                const canProceed = await this.checkPrivateChat(event);
                if (!canProceed) return;
            }
            
            const threadData = await this.bot.getThreadData(threadID);
            const userData = await this.bot.getUserData(senderID);
            
            if (!threadData || !userData) {
                log.warn('COMMAND_HANDLER', 'Could not get thread or user data');
                return;
            }
            
            // Kiểm tra banned (như Goat Bot V2)
            if (await this.checkBanned(userData, threadData, event)) {
                return;
            }
            
            const prefix = threadData.prefix || this.bot.config.prefix;
            
            // Kiểm tra prefix
            if (!body.startsWith(prefix)) {
                return;
            }
            
            const args = body.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();
            
            // Tìm command (bao gồm aliases)
            const command = this.findCommand(commandName);
            
            if (!command) {
                // Gửi thông báo command không tồn tại (như Goat Bot V2)
                if (!this.bot.config.hideCommandNotFound) {
                    await this.bot.reply(
                        `❌ Lệnh "${commandName}" không tồn tại. Gõ ${prefix}help để xem danh sách lệnh.`, 
                        event
                    );
                }
                return;
            }
            
            // Kiểm tra quyền admin
            if (command.adminOnly && !this.bot.isAdmin(senderID)) {
                return await this.bot.reply('❌ Chỉ admin mới có thể sử dụng lệnh này!', event);
            }
            
            // Kiểm tra quyền group admin (như Goat Bot V2)
            if (command.groupAdminOnly && event.isGroup) {
                try {
                    const threadInfo = await this.bot.api.getThreadInfo(threadID);
                    const isGroupAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);
                    if (!isGroupAdmin && !this.bot.isAdmin(senderID)) {
                        return await this.bot.reply('❌ Chỉ quản trị viên nhóm mới có thể sử dụng lệnh này!', event);
                    }
                } catch (error) {
                    log.error('COMMAND_HANDLER', 'Lỗi kiểm tra group admin:', error);
                }
            }
            
            // Kiểm tra cooldown
            if (await this.checkCooldown(command, senderID, event)) {
                return;
            }
            
            // Tạo context cho command (giống Goat Bot V2)
            const context = {
                api: this.bot.api,
                message: event,
                event: event, // Thêm event để tương thích
                args,
                userData,
                threadData,
                bot: this.bot,
                reply: (msg) => this.bot.reply(msg, event),
                send: (msg) => this.bot.sendMessage(msg, threadID),
                react: (emoji) => this.bot.api.setMessageReaction(emoji, event.messageID),
                unsend: (messageID) => this.bot.api.unsendMessage(messageID || event.messageID),
                // Thêm các utility functions
                prefix,
                commandName: command.name,
                getLang: (key, ...args) => this.getLang(key, threadData.lang || 'vi', ...args)
            };
            
            // Log command execution (như Goat Bot V2)
            const timestamp = new Date().toLocaleTimeString('vi-VN', { hour12: false });
            const date = new Date().toLocaleDateString('vi-VN');
            console.log(`[Lê Công]             ${timestamp} ${date}  CALL COMMAND: ${command.name} | ${userData.name || 'Unknown'} | ${senderID} | ${threadID} |`);
            
            // Thực thi command
            await command.execute(context);
            
            // Cập nhật thống kê
            this.updateStats(command.name, senderID);
            
            // Cập nhật exp cho user
            userData.exp = (userData.exp || 0) + 1;
            userData.lastActive = this.bot.timeUtils.timestamp();
            await this.bot.saveUserData(senderID, userData);
            
        } catch (error) {
            log.error('COMMAND_HANDLER', 'Lỗi xử lý command:', error);
            try {
                await this.bot.reply('❌ Đã xảy ra lỗi khi thực thi lệnh!', event);
            } catch (replyError) {
                log.error('COMMAND_HANDLER', 'Không thể gửi thông báo lỗi:', replyError);
            }
        }
    }

    async checkPrivateChat(event) {
        try {
            // Kiểm tra private chat restrictions
            const senderID = event.senderID || event.userID || event.author;
            if (this.bot.config.privateChat.allowAdminOnly && !this.bot.isAdmin(senderID)) {
                const redirectMsg = this.bot.config.privateChat.redirectMessage
                    .replace('{adminLink}', this.bot.config.adminFacebookLink || 'Admin');
                await this.bot.reply(redirectMsg, event);
                return false;
            }
            return true;
        } catch (error) {
            log.error('PRIVATE_CHAT', 'Lỗi kiểm tra private chat:', error);
            return true;
        }
    }

    async checkBanned(userData, threadData, event) {
        // Kiểm tra user banned
        if (userData.banned) {
            const banInfo = typeof userData.banned === 'object' ? userData.banned : { reason: 'Vi phạm quy định' };
            await this.bot.reply(
                `🚫 Bạn đã bị cấm sử dụng bot!\n📝 Lý do: ${banInfo.reason}\n⏰ Thời gian: ${banInfo.date || 'Không xác định'}`,
                event
            );
            return true;
        }
        
        // Kiểm tra thread banned
        if (threadData.banned) {
            const banInfo = typeof threadData.banned === 'object' ? threadData.banned : { reason: 'Vi phạm quy định' };
            await this.bot.reply(
                `🚫 Nhóm này đã bị cấm sử dụng bot!\n📝 Lý do: ${banInfo.reason}\n⏰ Thời gian: ${banInfo.date || 'Không xác định'}`,
                event
            );
            return true;
        }
        
        return false;
    }

    findCommand(commandName) {
        // Tìm command chính
        let command = this.bot.commands.get(commandName);
        
        // Tìm trong aliases
        if (!command) {
            for (const [name, cmd] of this.bot.commands) {
                if (cmd.aliases && cmd.aliases.includes(commandName)) {
                    command = cmd;
                    break;
                }
            }
        }
        
        return command;
    }

    async checkCooldown(command, userID, event) {
        if (!command.cooldown) return false;
        
        const now = Date.now();
        const cooldownKey = `${command.name}_${userID}`;
        
        if (this.cooldowns.has(cooldownKey)) {
            const expirationTime = this.cooldowns.get(cooldownKey) + command.cooldown;
            if (now < expirationTime) {
                const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
                await this.bot.reply(
                    `⏰ Bạn đang trong thời gian chờ, vui lòng thử lại sau ${timeLeft}s`,
                    event
                );
                return true;
            }
        }
        
        this.cooldowns.set(cooldownKey, now);
        return false;
    }

    updateStats(commandName, userID) {
        const key = `${commandName}_${userID}`;
        const current = this.commandStats.get(key) || 0;
        this.commandStats.set(key, current + 1);
    }

    getLang(key, lang = 'vi', ...args) {
        // Simple language system
        const langs = {
            vi: {
                commandNotFound: 'Lệnh không tồn tại',
                noPermission: 'Bạn không có quyền',
                cooldown: 'Đang trong thời gian chờ'
            },
            en: {
                commandNotFound: 'Command not found',
                noPermission: 'No permission',
                cooldown: 'On cooldown'
            }
        };
        
        let text = langs[lang]?.[key] || langs.vi[key] || key;
        
        // Replace placeholders
        args.forEach((arg, index) => {
            text = text.replace(`{${index}}`, arg);
        });
        
        return text;
    }
}

module.exports = CommandHandler;