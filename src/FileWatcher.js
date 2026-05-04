const fs = require('fs');
const path = require('path');

// Simple logger thay thế npmlog
const log = {
    info: (prefix, message) => console.log(`[INFO] ${prefix}: ${message}`),
    warn: (prefix, message) => console.warn(`[WARN] ${prefix}: ${message}`),
    error: (prefix, message) => console.error(`[ERROR] ${prefix}: ${message}`),
    verbose: (prefix, message) => console.log(`[VERBOSE] ${prefix}: ${message}`)
};

class FileWatcher {
    constructor(bot) {
        this.bot = bot;
        this.watchers = new Map();
        this.debounceTimers = new Map();
        this.debounceDelay = 1000; // 1 giây debounce
    }

    // Bắt đầu watch các thư mục
    startWatching() {
        try {
            // Watch commands folder
            this.watchDirectory(
                path.join(__dirname, '../commands'),
                'commands',
                () => this.reloadCommands()
            );

            // Watch events folder
            this.watchDirectory(
                path.join(__dirname, '../events'),
                'events',
                () => this.reloadEvents()
            );

            // Watch config file
            this.watchFile(
                path.join(__dirname, '../config.json'),
                'config',
                () => this.reloadConfig()
            );

            log.info('WATCHER', 'File watcher đã khởi động');
        } catch (error) {
            log.error('WATCHER', 'Lỗi khởi động file watcher:', error);
        }
    }

    // Watch một thư mục
    watchDirectory(dirPath, name, callback) {
        try {
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }

            const watcher = fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
                if (!filename || !filename.endsWith('.js')) return;

                const filePath = path.join(dirPath, filename);
                log.info('WATCHER', `${name} file changed: ${filename} (${eventType})`);

                // Debounce để tránh reload nhiều lần
                this.debounce(`${name}-${filename}`, callback, this.debounceDelay);
            });

            this.watchers.set(name, watcher);
            log.info('WATCHER', `Đang watch ${name} folder: ${dirPath}`);
        } catch (error) {
            log.error('WATCHER', `Lỗi watch ${name} folder:`, error);
        }
    }

    // Watch một file
    watchFile(filePath, name, callback) {
        try {
            if (!fs.existsSync(filePath)) {
                log.warn('WATCHER', `File không tồn tại: ${filePath}`);
                return;
            }

            const watcher = fs.watch(filePath, (eventType) => {
                log.info('WATCHER', `${name} file changed (${eventType})`);
                this.debounce(`${name}-file`, callback, this.debounceDelay);
            });

            this.watchers.set(name, watcher);
            log.info('WATCHER', `Đang watch ${name} file: ${filePath}`);
        } catch (error) {
            log.error('WATCHER', `Lỗi watch ${name} file:`, error);
        }
    }

    // Debounce function để tránh gọi callback nhiều lần
    debounce(key, callback, delay) {
        // Clear timer cũ nếu có
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }

        // Set timer mới
        const timer = setTimeout(() => {
            callback();
            this.debounceTimers.delete(key);
        }, delay);

        this.debounceTimers.set(key, timer);
    }

    // Reload commands
    async reloadCommands() {
        try {
            log.info('RELOAD', 'Đang reload commands...');

            // Clear require cache cho commands
            this.clearRequireCache(path.join(__dirname, '../commands'));

            // Clear commands map
            this.bot.commands.clear();

            // Load lại commands
            await this.bot.loadCommands();

            log.info('RELOAD', `✅ Đã reload ${this.bot.commands.size} commands`);
        } catch (error) {
            log.error('RELOAD', 'Lỗi reload commands:', error);
        }
    }

    // Reload events
    async reloadEvents() {
        try {
            log.info('RELOAD', 'Đang reload events...');

            // Clear require cache cho events
            this.clearRequireCache(path.join(__dirname, '../events'));

            // Clear events map
            this.bot.events.clear();

            // Load lại events
            await this.bot.loadEvents();

            log.info('RELOAD', `✅ Đã reload ${this.bot.events.size} events`);
        } catch (error) {
            log.error('RELOAD', 'Lỗi reload events:', error);
        }
    }

    // Reload config
    async reloadConfig() {
        try {
            log.info('RELOAD', 'Đang reload config...');

            // Clear require cache cho config
            const configPath = path.join(__dirname, '../config.json');
            delete require.cache[require.resolve(configPath)];

            // Load config mới
            const newConfig = require(configPath);
            
            // Update bot config
            Object.assign(this.bot.config, newConfig);

            // Update timezone nếu có thay đổi
            if (newConfig.timezone) {
                this.bot.timeUtils = new (require('../utils/TimeUtils'))(newConfig.timezone);
            }

            log.info('RELOAD', '✅ Đã reload config');
        } catch (error) {
            log.error('RELOAD', 'Lỗi reload config:', error);
        }
    }

    // Clear require cache cho một thư mục
    clearRequireCache(dirPath) {
        try {
            const files = fs.readdirSync(dirPath);
            
            files.forEach(file => {
                if (file.endsWith('.js')) {
                    const filePath = path.join(dirPath, file);
                    delete require.cache[require.resolve(filePath)];
                }
            });
        } catch (error) {
            log.error('WATCHER', 'Lỗi clear require cache:', error);
        }
    }

    // Dừng tất cả watchers
    stopWatching() {
        try {
            this.watchers.forEach((watcher, name) => {
                watcher.close();
                log.info('WATCHER', `Đã dừng watch ${name}`);
            });

            this.watchers.clear();

            // Clear tất cả debounce timers
            this.debounceTimers.forEach(timer => clearTimeout(timer));
            this.debounceTimers.clear();

            log.info('WATCHER', 'Đã dừng tất cả file watchers');
        } catch (error) {
            log.error('WATCHER', 'Lỗi dừng file watchers:', error);
        }
    }

    // Lấy trạng thái watchers
    getStatus() {
        return {
            activeWatchers: Array.from(this.watchers.keys()),
            pendingReloads: Array.from(this.debounceTimers.keys()),
            totalWatchers: this.watchers.size
        };
    }

    // Reload thủ công một loại cụ thể
    async manualReload(type) {
        switch (type.toLowerCase()) {
            case 'commands':
            case 'cmd':
                await this.reloadCommands();
                break;
            case 'events':
            case 'event':
                await this.reloadEvents();
                break;
            case 'config':
                await this.reloadConfig();
                break;
            case 'all':
                await this.reloadCommands();
                await this.reloadEvents();
                await this.reloadConfig();
                break;
            default:
                throw new Error('Type không hợp lệ. Sử dụng: commands, events, config, all');
        }
    }
}

module.exports = FileWatcher;