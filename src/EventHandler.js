// Simple logger thay thế npmlog
const log = {
    info: (prefix, message) => console.log(`[INFO] ${prefix}: ${message}`),
    warn: (prefix, message) => console.warn(`[WARN] ${prefix}: ${message}`),
    error: (prefix, message) => console.error(`[ERROR] ${prefix}: ${message}`),
    verbose: (prefix, message) => console.log(`[VERBOSE] ${prefix}: ${message}`)
};

class EventHandler {
    constructor(bot) {
        this.bot = bot;
        this.eventStats = new Map(); // Thống kê events
    }

    async handle(message) {
        try {
            // Bỏ qua tin nhắn từ chính bot (trừ khi cần thiết)
            if (message.senderID === this.bot.api.getCurrentUserID() && 
                !this.shouldProcessBotMessage(message)) {
                return;
            }
            
            // Xử lý tin nhắn riêng trước khi chạy events khác
            if (!message.isGroup && message.type === 'message' && message.body) {
                const canProceed = await this.handlePrivateChat(message);
                if (!canProceed) {
                    return false; // Dừng xử lý nếu bị restrict
                }
            }
            
            // Xử lý các event khác nhau theo type
            switch (message.type) {
                case 'message':
                    await this.handleMessage(message);
                    break;
                case 'event':
                    await this.handleEvent(message);
                    break;
                case 'message_reaction':
                    await this.handleReaction(message);
                    break;
                case 'message_reply':
                    await this.handleReply(message);
                    break;
                case 'message_unsend':
                    await this.handleUnsend(message);
                    break;
                case 'typ':
                    await this.handleTyping(message);
                    break;
                case 'read_receipt':
                    await this.handleReadReceipt(message);
                    break;
                case 'presence':
                    // Bỏ qua presence events (online/offline status)
                    break;
                default:
                    // Xử lý các loại message khác
                    await this.handleGeneric(message);
            }

            return true;
        } catch (error) {
            log.error('EVENT_HANDLER', 'Lỗi xử lý event:', error);
            return true;
        }
    }

    shouldProcessBotMessage(message) {
        // Chỉ xử lý tin nhắn từ bot trong một số trường hợp đặc biệt
        return message.type === 'message_reaction' || 
               message.type === 'message_unsend' ||
               message.type === 'event';
    }

    async handlePrivateChat(message) {
        try {
            // Kiểm tra có phải admin không
            const isAdmin = this.bot.isAdmin(message.senderID);
            
            if (!isAdmin && this.bot.config.privateChat && this.bot.config.privateChat.allowAdminOnly) {
                // Người dùng thường chat riêng - gửi tin nhắn chuyển hướng
                if (this.bot.config.privateChat.autoRedirectMessage) {
                    const redirectMessage = this.bot.config.privateChat.redirectMessage
                        .replace('{adminLink}', this.bot.config.adminFacebookLink || 'Admin Facebook');
                    
                    await this.bot.reply(redirectMessage, message);
                    
                    // Log để admin biết
                    log.info('PRIVATE_CHAT', `User ${message.senderID} tried to chat privately: ${message.body?.substring(0, 50)}...`);
                    
                    // Không xử lý command nếu không phải admin
                    return false;
                }
            }
            
            return true; // Cho phép xử lý tiếp
        } catch (error) {
            log.error('PRIVATE_CHAT', 'Lỗi xử lý private chat:', error);
            return true;
        }
    }

    async handleMessage(message) {
        try {
            // Chạy các event message
            await this.runEventsByType('message', message);
            
            // Chạy onChat events (như Goat Bot V2)
            await this.runEventsByType('chat', message);
            
            // Chạy events cho tất cả tin nhắn
            await this.runEventsByType('all', message);
            
        } catch (error) {
            log.error('MESSAGE_HANDLER', 'Lỗi xử lý message event:', error);
        }
    }

    async handleEvent(message) {
        try {
            // Xử lý các event như join/leave group
            log.info('EVENT', `Group event: ${message.logMessageType} in ${message.threadID}`);
            
            await this.runEventsByType('event', message);
            await this.runEventsByType('all', message);
            
        } catch (error) {
            log.error('EVENT_HANDLER', 'Lỗi xử lý group event:', error);
        }
    }

    async handleReaction(message) {
        try {
            // Xử lý reaction đặc biệt (như unsend khi react emoji cụ thể)
            await this.handleSpecialReactions(message);
            
            // Chạy events reaction
            await this.runEventsByType('reaction', message);
            await this.runEventsByType('all', message);
            
        } catch (error) {
            log.error('REACTION_HANDLER', 'Lỗi xử lý reaction:', error);
        }
    }

    async handleSpecialReactions(message) {
        try {
            // Tính năng unsend bằng reaction (như Goat Bot V2)
            const unsendEmojis = ['🚮', '😠', '😡', '🤬', '❌'];
            
            if (unsendEmojis.includes(message.reaction)) {
                // Kiểm tra quyền unsend
                const canUnsend = await this.checkUnsendPermission(message);
                
                if (canUnsend) {
                    try {
                        await this.bot.api.unsendMessage(message.messageID);
                        log.info('UNSEND', `Message ${message.messageID} đã được unsend bởi reaction`);
                    } catch (error) {
                        log.error('UNSEND', 'Lỗi unsend message:', error);
                    }
                }
            }
        } catch (error) {
            log.error('SPECIAL_REACTION', 'Lỗi xử lý special reaction:', error);
        }
    }

    async checkUnsendPermission(message) {
        try {
            // Admin bot luôn có quyền unsend
            if (this.bot.isAdmin(message.senderID)) {
                return true;
            }
            
            // Trong group, admin group có thể unsend
            if (message.isGroup) {
                const threadInfo = await this.bot.api.getThreadInfo(message.threadID);
                const isGroupAdmin = threadInfo.adminIDs.some(admin => admin.id === message.senderID);
                if (isGroupAdmin) {
                    return true;
                }
            }
            
            // Người gửi tin nhắn gốc có thể unsend tin nhắn của mình
            const originalMessage = await this.bot.api.getMessage(message.messageID);
            if (originalMessage && originalMessage.senderID === message.senderID) {
                return true;
            }
            
            return false;
        } catch (error) {
            log.error('UNSEND_PERMISSION', 'Lỗi kiểm tra quyền unsend:', error);
            return false;
        }
    }

    async handleReply(message) {
        try {
            await this.runEventsByType('reply', message);
            await this.runEventsByType('all', message);
        } catch (error) {
            log.error('REPLY_HANDLER', 'Lỗi xử lý reply:', error);
        }
    }

    async handleUnsend(message) {
        try {
            log.info('UNSEND', `Message ${message.messageID} đã được unsend`);
            await this.runEventsByType('unsend', message);
            await this.runEventsByType('all', message);
        } catch (error) {
            log.error('UNSEND_HANDLER', 'Lỗi xử lý unsend:', error);
        }
    }

    async handleTyping(message) {
        try {
            await this.runEventsByType('typing', message);
        } catch (error) {
            log.error('TYPING_HANDLER', 'Lỗi xử lý typing:', error);
        }
    }

    async handleReadReceipt(message) {
        try {
            await this.runEventsByType('read', message);
        } catch (error) {
            log.error('READ_HANDLER', 'Lỗi xử lý read receipt:', error);
        }
    }

    async handleGeneric(message) {
        try {
            // Xử lý các loại message khác
            await this.runEventsByType('all', message);
        } catch (error) {
            log.error('GENERIC_HANDLER', 'Lỗi xử lý generic event:', error);
        }
    }

    async runEventsByType(type, message) {
        const eventsToRun = [];
        
        // Tìm tất cả events phù hợp với type
        for (const [name, event] of this.bot.events) {
            if (event.type === type || event.type === 'all') {
                eventsToRun.push({ name, event });
            }
        }
        
        // Chạy các events song song để tăng performance
        const promises = eventsToRun.map(({ name, event }) => 
            this.runSingleEvent(name, event, message)
        );
        
        await Promise.allSettled(promises);
    }

    async runSingleEvent(name, event, message) {
        try {
            const senderID = message.senderID || message.userID || message.author;

            if (!message.threadID) {
                log.warn('EVENT', `Bỏ qua event ${name} vì thiếu threadID`);
                return;
            }

            const userData = senderID ? await this.bot.getUserData(senderID) : null;
            const threadData = await this.bot.getThreadData(message.threadID);

            if (!threadData) {
                log.warn('EVENT', `Bỏ qua event ${name} vì không lấy được thread data`);
                return;
            }
            
            // Kiểm tra điều kiện chạy event
            if (!await this.shouldRunEvent(event, message, userData, threadData)) {
                return;
            }
            
            const context = {
                api: this.bot.api,
                message,
                userData,
                threadData,
                bot: this.bot,
                reply: (msg) => this.bot.reply(msg, message),
                send: (msg) => this.bot.sendMessage(msg, message.threadID),
                react: (emoji) => this.bot.api.setMessageReaction(emoji, message.messageID),
                unsend: (messageID) => this.bot.api.unsendMessage(messageID || message.messageID)
            };
            
            await event.execute(context);
            
            // Cập nhật thống kê
            this.updateEventStats(name);
            
        } catch (error) {
            log.error('EVENT', `Lỗi chạy event ${name}:`, error);
        }
    }

    async shouldRunEvent(event, message, userData, threadData) {
        // Kiểm tra banned
        if (userData?.banned || threadData?.banned) {
            return false;
        }
        
        // Kiểm tra quyền admin nếu event yêu cầu
        if (event.adminOnly && !this.bot.isAdmin(message.senderID)) {
            return false;
        }
        
        // Kiểm tra group admin nếu event yêu cầu
        if (event.groupAdminOnly && message.isGroup) {
            try {
                const threadInfo = await this.bot.api.getThreadInfo(message.threadID);
                const isGroupAdmin = threadInfo.adminIDs.some(admin => admin.id === message.senderID);
                if (!isGroupAdmin && !this.bot.isAdmin(message.senderID)) {
                    return false;
                }
            } catch (error) {
                log.error('EVENT_PERMISSION', 'Lỗi kiểm tra quyền group admin:', error);
                return false;
            }
        }
        
        return true;
    }

    updateEventStats(eventName) {
        const current = this.eventStats.get(eventName) || 0;
        this.eventStats.set(eventName, current + 1);
    }

    getEventStats() {
        return Object.fromEntries(this.eventStats);
    }
}

module.exports = EventHandler;
