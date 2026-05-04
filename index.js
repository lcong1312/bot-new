const login = require('./fb-chat-api');

// Simple logger thay thế npmlog
const log = {
    info: (prefix, message) => console.log(`[INFO] ${prefix}: ${message}`),
    warn: (prefix, message) => console.warn(`[WARN] ${prefix}: ${message}`),
    error: (prefix, message) => console.error(`[ERROR] ${prefix}: ${message}`),
    verbose: (prefix, message) => console.log(`[VERBOSE] ${prefix}: ${message}`)
};

// Import các module chính
const Bot = require('./src/Bot');
const CommandHandler = require('./src/CommandHandler');
const EventHandler = require('./src/EventHandler');

class MessengerBot {
    constructor() {
        this.config = this.loadConfig();
        this.account = this.loadAccount();
        this.bot = null;
        this.api = null;
        this.commandHandler = null;
        this.eventHandler = null;
        this.listening = null; // Store listening handle
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.processedMessages = new Set();
    }

    loadConfig() {
        try {
            return require('./config.json');
        } catch (error) {
            log.error('CONFIG', 'Không thể load config.json');
            process.exit(1);
        }
    }

    loadAccount() {
        try {
            // Thử load credentials trước (email/password + 2FA)
            const fs = require('fs');
            if (fs.existsSync('./credentials.json')) {
                return require('./credentials.json');
            }
            // Fallback sang account.json (appState)
            return require('./account.json');
        } catch (error) {
            log.error('ACCOUNT', 'Không thể load credentials.json hoặc account.json');
            process.exit(1);
        }
    }

    async start() {
        try {
            log.info('BOT', 'Đang khởi động bot...');
            
            // Đăng nhập Facebook
            await this.loginFacebook();
            
            // Khởi tạo các handler
            this.initializeHandlers();
            
            // Bắt đầu lắng nghe tin nhắn
            this.startListening();
            
            log.info('BOT', 'Bot đã khởi động thành công!');
        } catch (error) {
            log.error('BOT', 'Lỗi khởi động bot:', error.message);
            log.error('BOT', 'Stack trace:', error.stack);
            process.exit(1);
        }
    }

    async loginFacebook() {
        try {
            log.info('LOGIN', 'Đang đăng nhập Facebook...');
            
            return new Promise((resolve, reject) => {
                if (!this.account.appState) {
                    reject(new Error('Không có appState! Vui lòng cập nhật account.json'));
                    return;
                }
                
                // Login với appState (cookie)
                log.info('LOGIN', 'Đăng nhập bằng appState...');
                
                login({ appState: this.account.appState }, this.config.options || {}, (err, api) => {
                    if (err) {
                        log.error('LOGIN', 'Lỗi đăng nhập:', err);
                        log.warn('LOGIN', 'AppState có thể đã hết hạn. Vui lòng lấy cookie mới!');
                        return reject(err);
                    }
                    
                    this.api = api;
                    log.info('LOGIN', `Đăng nhập thành công! User ID: ${api.getCurrentUserID()}`);
                    resolve(api);
                });
            });
        } catch (error) {
            log.error('LOGIN', 'Lỗi đăng nhập Facebook:', error.message);
            throw error;
        }
    }

    initializeHandlers() {
        this.bot = new Bot(this.api, this.config);
        this.bot.onReply = new Map(); // Khởi tạo onReply Map
        this.commandHandler = new CommandHandler(this.bot);
        this.eventHandler = new EventHandler(this.bot);
    }

    startListening() {
        // Log khởi động như Goat Bot V2
        const timestamp = new Date().toLocaleTimeString('vi-VN', { hour12: false });
        const date = new Date().toLocaleDateString('vi-VN');
        console.log(`[Lê Công]             ${timestamp} ${date}  BOT_STARTED: Đã khởi động bot thành công, sẵn sàng nhận tin nhắn từ người dùng`);
        
        // Callback để xử lý tin nhắn
        const listenCallback = (err, event) => {
            if (err) {
                this.handleListenError(err);
                return;
            }

            // Xử lý tin nhắn
            this.handleMessage(event);
        };

        // Khởi tạo listening với error handling
        try {
            // Sử dụng listenMqtt nếu có, nếu không dùng listen
            if (this.api.listenMqtt) {
                this.listening = this.api.listenMqtt(listenCallback);
                log.info('LISTEN', 'Đã bắt đầu lắng nghe tin nhắn (listenMqtt)');
            } else {
                this.listening = this.api.listen(listenCallback);
                log.info('LISTEN', 'Đã bắt đầu lắng nghe tin nhắn (listen)');
            }
        } catch (error) {
            log.error('LISTEN', 'Lỗi khởi tạo listening:', error);
            setTimeout(() => this.startListening(), 5000); // Retry sau 5s
        }
    }

    handleListenError(err) {
        log.error('LISTEN', 'Lỗi khi lắng nghe tin nhắn:', err);
        
        // Xử lý các loại lỗi khác nhau như Goat Bot V2
        if (err.error === "Not logged in" || err.error === "Not logged in.") {
            log.error('LOGIN', 'Mất kết nối, cần đăng nhập lại');
            this.reconnect();
        } else if (err === "Connection closed." || err === "Connection closed by user.") {
            log.info('LISTEN', 'Kết nối đã đóng');
            return;
        } else {
            log.error('LISTEN', 'Lỗi không xác định:', err);
            // Retry sau 10s
            setTimeout(() => this.startListening(), 10000);
        }
    }

    async reconnect() {
        try {
            log.info('RECONNECT', 'Đang thử kết nối lại...');
            
            // Dừng listening cũ
            if (this.listening && typeof this.listening.stopListening === 'function') {
                this.listening.stopListening();
            }
            
            // Đăng nhập lại
            await this.loginFacebook();
            
            // Khởi tạo lại handlers
            this.initializeHandlers();
            
            // Bắt đầu lắng nghe lại
            this.startListening();
            
            log.info('RECONNECT', 'Kết nối lại thành công');
        } catch (error) {
            log.error('RECONNECT', 'Lỗi kết nối lại:', error);
            // Retry sau 30s
            setTimeout(() => this.reconnect(), 30000);
        }
    }

    async handleMessage(event) {
        try {
            // Reset reconnect attempts khi nhận được tin nhắn thành công
            this.reconnectAttempts = 0;
            
            // Bỏ qua tin nhắn từ chính bot
            const senderID = event.senderID || event.userID || event.author;
            if (senderID === this.api.getCurrentUserID() && event.type === 'message') {
                return;
            }

            // Deduplication: bỏ qua message đã xử lý
            if (event.messageID) {
                if (this.processedMessages.has(event.messageID)) {
                    return;
                }
                this.processedMessages.add(event.messageID);
                // Tự dọn sau 60s
                setTimeout(() => this.processedMessages.delete(event.messageID), 60000);
            }
            
            // Log tin nhắn để debug (chỉ log message type, không log presence/typing/read_receipt)
            if (this.config.logEvents !== false && 
                event.type !== 'presence' && 
                event.type !== 'typ' && 
                event.type !== 'read_receipt') {
                // Tạo bản sao để log
                const logEvent = {
                    type: event.type,
                    senderID: senderID,
                    body: event.body || '',
                    threadID: event.threadID,
                    messageID: event.messageID,
                    attachments: event.attachments || [],
                    mentions: event.mentions || {},
                    timestamp: event.timestamp || Date.now(),
                    isGroup: event.isGroup,
                    participantIDs: event.participantIDs ? `Array(${event.participantIDs.length})` : undefined
                };
                
                // Format log giống bot cũ
                const logStr = JSON.stringify(logEvent, null, 2);
                const lines = logStr.split('\n');
                const formattedLog = lines.map((line, i) => {
                    if (i === 0) return line;
                    return '  ' + line;
                }).join('\n');
                
                console.log(`[Lê Công]           ${formattedLog}`);
            }
            
            // Xử lý events trước
            const canProceed = await this.eventHandler.handle(event);
            if (canProceed === false) {
                return;
            }
            
            // Kiểm tra onReply trước (nếu là reply tin nhắn)
            if (event.type === 'message_reply' && event.messageReply) {
                const replyMessageID = event.messageReply.messageID;
                
                // Kiểm tra có onReply data không
                if (this.bot.onReply && this.bot.onReply.has(replyMessageID)) {
                    const replyData = this.bot.onReply.get(replyMessageID);
                    const command = this.bot.commands.get(replyData.commandName);
                    
                    if (command && command.onReply) {
                        try {
                            const context = {
                                api: this.api,
                                message: event,
                                event: event,
                                bot: this.bot,
                                reply: (msg) => this.bot.reply(msg, event),
                                send: (msg) => this.bot.sendMessage(msg, event.threadID),
                                replyData: replyData
                            };
                            
                            await command.onReply(context);
                            return; // Đã xử lý onReply, không cần xử lý command nữa
                        } catch (error) {
                            log.error('HANDLE', 'Lỗi xử lý onReply:', error);
                        }
                    }
                }
            }
            
            // Xử lý commands sau (chỉ với tin nhắn text)
            if (event.type === 'message' && event.body) {
                await this.commandHandler.handle(event);
            }
        } catch (error) {
            log.error('HANDLE', 'Lỗi xử lý tin nhắn:', error);
            
            // Nếu lỗi nghiêm trọng, thử reconnect
            if (error.message && error.message.includes('Not logged in')) {
                this.reconnect();
            }
        }
    }

    // Thêm method để test bot manually
    async testCommand(command) {
        try {
            log.info('TEST', `Testing command: ${command}`);
            
            // Tạo test message
            const testMessage = {
                type: 'message',
                messageID: 'test_' + Date.now(),
                threadID: this.api.getCurrentUserID(),
                senderID: this.api.getCurrentUserID(),
                body: command,
                timestamp: Date.now(),
                attachments: [],
                mentions: {},
                isGroup: false
            };
            
            // Xử lý message
            await this.handleMessage(testMessage);
            
            log.info('TEST', 'Command test completed');
            return testMessage;
        } catch (error) {
            log.error('TEST', 'Error testing command:', error);
            throw error;
        }
    }
}

// Khởi động bot
const bot = new MessengerBot();
bot.start().catch(error => {
    log.error('MAIN', 'Lỗi khởi động:', error);
    process.exit(1);
});

// Expose bot instance globally để có thể test
global.messengerBot = bot;

// Thêm method test qua console
global.testBot = async (command) => {
    if (bot && bot.testCommand) {
        return await bot.testCommand(command);
    } else {
        console.log('Bot chưa sẵn sàng. Vui lòng đợi bot khởi động xong.');
    }
};

// Xử lý thoát chương trình
process.on('SIGINT', () => {
    log.info('BOT', 'Đang thoát bot...');
    
    // Dừng file watcher
    if (bot && bot.stopFileWatcher) {
        bot.stopFileWatcher();
    }
    
    // Ngắt kết nối database
    if (bot && bot.database && bot.database.disconnect) {
        bot.database.disconnect();
    }
    
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    log.error('UNHANDLED', 'Unhandled Rejection at:', promise, 'reason:', reason);
});
