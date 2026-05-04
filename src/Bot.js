const fs = require('fs-extra');
const path = require('path');

// Simple logger thay thế npmlog
const log = {
    info: (prefix, message) => console.log(`[INFO] ${prefix}: ${message}`),
    warn: (prefix, message) => console.warn(`[WARN] ${prefix}: ${message}`),
    error: (prefix, message) => console.error(`[ERROR] ${prefix}: ${message}`),
    verbose: (prefix, message) => console.log(`[VERBOSE] ${prefix}: ${message}`)
};
const Database = require('./Database');
const TimeUtils = require('../utils/TimeUtils');
const FileWatcher = require('./FileWatcher');

class Bot {
    constructor(api, config) {
        this.api = api;
        this.config = config;
        this.users = new Map();
        this.threads = new Map();
        this.commands = new Map();
        this.events = new Map();
        this.database = new Database(config);
        this.timeUtils = new TimeUtils(config.timezone || 'Asia/Ho_Chi_Minh');
        this.fileWatcher = new FileWatcher(this);
        this.startTime = Date.now();
        
        this.databaseReady = this.initializeDatabase();
        this.loadCommands();
        this.loadEvents();
        this.startFileWatcher();
    }

    async initializeDatabase() {
        try {
            if (this.config.database.type === 'mongodb') {
                await this.database.connect();
                log.info('DATABASE', 'MongoDB đã được khởi tạo');
            } else {
                // Fallback to JSON if needed
                await fs.ensureDir(this.config.database.path);
                await fs.ensureDir(path.join(this.config.database.path, 'users'));
                await fs.ensureDir(path.join(this.config.database.path, 'threads'));
                log.info('DATABASE', 'JSON Database đã được khởi tạo');
            }
        } catch (error) {
            log.error('DATABASE', 'Lỗi khởi tạo database:', error);
        }
    }

    async loadCommands() {
        try {
            const commandsPath = path.join(__dirname, '../commands');
            await fs.ensureDir(commandsPath);
            
            const files = await fs.readdir(commandsPath);
            const jsFiles = files.filter(file => file.endsWith('.js'));
            
            for (const file of jsFiles) {
                try {
                    const command = require(path.join(commandsPath, file));
                    if (command.name) {
                        this.commands.set(command.name, command);
                        log.info('COMMAND', `Đã load command: ${command.name}`);
                    }
                } catch (error) {
                    log.error('COMMAND', `Lỗi load command ${file}:`, error);
                }
            }
            
            log.info('COMMAND', `Đã load ${this.commands.size} commands`);
        } catch (error) {
            log.error('COMMAND', 'Lỗi load commands:', error);
        }
    }

    async loadEvents() {
        try {
            const eventsPath = path.join(__dirname, '../events');
            await fs.ensureDir(eventsPath);
            
            const files = await fs.readdir(eventsPath);
            const jsFiles = files.filter(file => file.endsWith('.js'));
            
            for (const file of jsFiles) {
                try {
                    const event = require(path.join(eventsPath, file));
                    if (event.name) {
                        this.events.set(event.name, event);
                        log.info('EVENT', `Đã load event: ${event.name}`);
                    }
                } catch (error) {
                    log.error('EVENT', `Lỗi load event ${file}:`, error);
                }
            }
            
            log.info('EVENT', `Đã load ${this.events.size} events`);
        } catch (error) {
            log.error('EVENT', 'Lỗi load events:', error);
        }
    }

    async getUserData(userID) {
        if (!userID) {
            log.warn('USER_DATA', 'Không thể load user data vì userID trống');
            return null;
        }

        if (this.users.has(userID)) {
            return this.users.get(userID);
        }

        try {
            await this.databaseReady;

            let userData;
            
            if (this.config.database.type === 'mongodb') {
                userData = await this.database.getUserData(userID);
            } else {
                // Fallback to JSON
                const userPath = path.join(this.config.database.path, 'users', `${userID}.json`);
                if (await fs.pathExists(userPath)) {
                    userData = await fs.readJson(userPath);
                } else {
                    userData = {
                        id: userID,
                        name: '',
                        exp: 0,
                        money: 1000,
                        lastActive: Date.now(),
                        banned: false
                    };
                    await this.saveUserData(userID, userData);
                }
            }
            
            this.users.set(userID, userData);
            return userData;
        } catch (error) {
            log.error('USER_DATA', `Lỗi load user data ${userID}:`, error);
            return null;
        }
    }

    async saveUserData(userID, userData) {
        if (!userID || !userData) {
            log.warn('USER_DATA', 'Không thể save user data vì thiếu userID hoặc userData');
            return;
        }

        try {
            await this.databaseReady;

            if (this.config.database.type === 'mongodb') {
                await this.database.saveUserData(userID, userData);
            } else {
                // Fallback to JSON
                const userPath = path.join(this.config.database.path, 'users', `${userID}.json`);
                await fs.writeJson(userPath, userData, { spaces: 2 });
            }
            
            this.users.set(userID, userData);
        } catch (error) {
            log.error('USER_DATA', `Lỗi save user data ${userID}:`, error);
        }
    }

    async getThreadData(threadID) {
        if (!threadID) {
            log.warn('THREAD_DATA', 'Không thể load thread data vì threadID trống');
            return null;
        }

        if (this.threads.has(threadID)) {
            return this.threads.get(threadID);
        }

        try {
            await this.databaseReady;

            let threadData;
            
            if (this.config.database.type === 'mongodb') {
                threadData = await this.database.getThreadData(threadID);
            } else {
                // Fallback to JSON
                const threadPath = path.join(this.config.database.path, 'threads', `${threadID}.json`);
                if (await fs.pathExists(threadPath)) {
                    threadData = await fs.readJson(threadPath);
                } else {
                    threadData = {
                        id: threadID,
                        name: '',
                        prefix: this.config.prefix,
                        banned: false,
                        settings: {}
                    };
                    await this.saveThreadData(threadID, threadData);
                }
            }
            
            this.threads.set(threadID, threadData);
            return threadData;
        } catch (error) {
            log.error('THREAD_DATA', `Lỗi load thread data ${threadID}:`, error);
            return null;
        }
    }

    async saveThreadData(threadID, threadData) {
        if (!threadID || !threadData) {
            log.warn('THREAD_DATA', 'Không thể save thread data vì thiếu threadID hoặc threadData');
            return;
        }

        try {
            await this.databaseReady;

            if (this.config.database.type === 'mongodb') {
                await this.database.saveThreadData(threadID, threadData);
            } else {
                // Fallback to JSON
                const threadPath = path.join(this.config.database.path, 'threads', `${threadID}.json`);
                await fs.writeJson(threadPath, threadData, { spaces: 2 });
            }
            
            this.threads.set(threadID, threadData);
        } catch (error) {
            log.error('THREAD_DATA', `Lỗi save thread data ${threadID}:`, error);
        }
    }

    isAdmin(userID) {
        return this.config.adminIDs.includes(userID);
    }

    async sendMessage(message, threadID, messageID = null) {
        try {
            return await new Promise((resolve, reject) => {
                this.api.sendMessage(message, threadID, (error, info) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve(info);
                }, messageID);
            });
        } catch (error) {
            log.error('SEND_MESSAGE', 'Lỗi gửi tin nhặn:', error.message);
            
            // Retry mechanism như Goat Bot V2
            if (error.message && error.message.includes('Not logged in')) {
                throw new Error('LOGIN_REQUIRED');
            }
            
            throw error;
        }
    }

    async reply(message, event) {
        return await this.sendMessage(message, event.threadID, event.messageID);
    }

    async react(emoji, messageID) {
        try {
            return await this.api.setMessageReaction(emoji, messageID);
        } catch (error) {
            log.error('REACT', 'Lỗi react tin nhắn:', error);
            throw error;
        }
    }

    async unsend(messageID) {
        try {
            return await this.api.unsendMessage(messageID);
        } catch (error) {
            log.error('UNSEND', 'Lỗi unsend tin nhắn:', error);
            throw error;
        }
    }

    async getThreadInfo(threadID) {
        try {
            return await this.api.getThreadInfo(threadID);
        } catch (error) {
            log.error('THREAD_INFO', 'Lỗi lấy thông tin thread:', error);
            throw error;
        }
    }

    async getUserInfo(userID) {
        try {
            return await this.api.getUserInfo(userID);
        } catch (error) {
            log.error('USER_INFO', 'Lỗi lấy thông tin user:', error);
            throw error;
        }
    }

    startFileWatcher() {
        try {
            if (this.config.autoReload && this.config.autoReload.enabled) {
                this.fileWatcher.startWatching();
                log.info('BOT', 'File watcher đã được khởi động');
            } else {
                log.info('BOT', 'Auto-reload bị tắt trong config');
            }
        } catch (error) {
            log.error('BOT', 'Lỗi khởi động file watcher:', error);
        }
    }

    stopFileWatcher() {
        try {
            this.fileWatcher.stopWatching();
            log.info('BOT', 'File watcher đã được dừng');
        } catch (error) {
            log.error('BOT', 'Lỗi dừng file watcher:', error);
        }
    }

    async manualReload(type) {
        return await this.fileWatcher.manualReload(type);
    }

    getWatcherStatus() {
        return this.fileWatcher.getStatus();
    }
}

module.exports = Bot;
