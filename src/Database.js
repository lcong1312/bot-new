const mongoose = require('mongoose');

// Simple logger thay thế npmlog
const log = {
    info: (prefix, message, ...args) => console.log(`[INFO] ${prefix}: ${message}`, ...args),
    warn: (prefix, message, ...args) => console.warn(`[WARN] ${prefix}: ${message}`, ...args),
    error: (prefix, message, ...args) => console.error(`[ERROR] ${prefix}: ${message}`, ...args),
    verbose: (prefix, message, ...args) => console.log(`[VERBOSE] ${prefix}: ${message}`, ...args)
};

// User Schema
const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, default: '' },
    exp: { type: Number, default: 0 },
    money: { type: Number, default: 1000 },
    lastActive: { type: Date, default: Date.now },
    banned: { type: Boolean, default: false },
    joinDate: { type: Date, default: Date.now },
    level: { type: Number, default: 1 },
    achievements: [{ type: String }],
    settings: {
        language: { type: String, default: 'vi' },
        notifications: { type: Boolean, default: true }
    },
    lastDaily: { type: Number, default: 0 },
    dailyStreak: { type: Number, default: 0 },
    totalDailyCount: { type: Number, default: 0 }
}, {
    timestamps: true,
    strict: false
});

// Thread Schema
const threadSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, default: '' },
    prefix: { type: String, default: '!' },
    banned: { type: Boolean, default: false },
    settings: {
        welcome: { type: Boolean, default: true },
        goodbye: { type: Boolean, default: true },
        autoReply: { type: Boolean, default: true },
        antiSpam: { type: Boolean, default: false },
        language: { type: String, default: 'vi' }
    },
    admins: [{ type: String }],
    members: [{ type: String }],
    stats: {
        totalMessages: { type: Number, default: 0 },
        activeUsers: { type: Number, default: 0 }
    },
    antiOut: {
        enabled: { type: Boolean, default: false }
    }
}, {
    timestamps: true,
    strict: false
});

// Models
const User = mongoose.model('User', userSchema);
const Thread = mongoose.model('Thread', threadSchema);

class Database {
    constructor(config) {
        this.config = config;
        this.isConnected = false;
        this.User = User;
        this.Thread = Thread;
    }

    async connect() {
        try {
            if (this.config.database.type !== 'mongodb') {
                throw new Error('Database type không phải MongoDB');
            }

            await mongoose.connect(this.config.database.uri, {
                dbName: this.config.database.name,
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });

            this.isConnected = true;
            log.info('DATABASE', 'Kết nối MongoDB thành công!');

            // Event listeners
            mongoose.connection.on('error', (error) => {
                log.error('DATABASE', 'MongoDB error:', error);
            });

            mongoose.connection.on('disconnected', () => {
                log.warn('DATABASE', 'MongoDB disconnected');
                this.isConnected = false;
            });

            mongoose.connection.on('reconnected', () => {
                log.info('DATABASE', 'MongoDB reconnected');
                this.isConnected = true;
            });

        } catch (error) {
            log.error('DATABASE', 'Lỗi kết nối MongoDB:', error);
            throw error;
        }
    }

    async disconnect() {
        try {
            await mongoose.disconnect();
            this.isConnected = false;
            log.info('DATABASE', 'Đã ngắt kết nối MongoDB');
        } catch (error) {
            log.error('DATABASE', 'Lỗi ngắt kết nối MongoDB:', error);
        }
    }

    // User methods
    async getUserData(userID) {
        if (!userID) {
            log.warn('DATABASE', 'Bỏ qua lấy user data vì userID trống');
            return null;
        }

        try {
            const user = await User.findOneAndUpdate(
                { id: userID },
                {
                    $setOnInsert: {
                        id: userID,
                        name: '',
                        exp: 0,
                        money: 1000,
                        lastActive: new Date(),
                        banned: false,
                        joinDate: new Date(),
                        level: 1,
                        achievements: []
                    }
                },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true
                }
            );

            if (user.createdAt && user.updatedAt && user.createdAt.getTime() === user.updatedAt.getTime()) {
                log.info('DATABASE', `Tạo user mới: ${userID}`);
            }

            return user.toObject();
        } catch (error) {
            log.error('DATABASE', `Lỗi lấy user data ${userID}:`, error);
            return null;
        }
    }

    async saveUserData(userID, userData) {
        try {
            await User.findOneAndUpdate(
                { id: userID },
                { $set: { ...userData, lastActive: new Date() } },
                { 
                    upsert: true,
                    new: true,
                    strict: false
                }
            );
            
            log.info('DATABASE', `Lưu user data: ${userID}`);
        } catch (error) {
            log.error('DATABASE', `Lỗi lưu user data ${userID}:`, error);
        }
    }

    async getAllUsers() {
        try {
            return await User.find({}).sort({ lastActive: -1 });
        } catch (error) {
            log.error('DATABASE', 'Lỗi lấy tất cả users:', error);
            return [];
        }
    }

    async getUserStats() {
        try {
            const totalUsers = await User.countDocuments();
            const activeUsers = await User.countDocuments({ 
                lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
            });
            const bannedUsers = await User.countDocuments({ banned: true });

            return {
                total: totalUsers,
                active: activeUsers,
                banned: bannedUsers
            };
        } catch (error) {
            log.error('DATABASE', 'Lỗi lấy user stats:', error);
            return { total: 0, active: 0, banned: 0 };
        }
    }

    // Thread methods
    async getThreadData(threadID) {
        if (!threadID) {
            log.warn('DATABASE', 'Bỏ qua lấy thread data vì threadID trống');
            return null;
        }

        try {
            const thread = await Thread.findOneAndUpdate(
                { id: threadID },
                {
                    $setOnInsert: {
                        id: threadID,
                        name: '',
                        prefix: this.config.prefix || '!',
                        banned: false,
                        settings: {
                            welcome: true,
                            goodbye: true,
                            autoReply: true,
                            antiSpam: false,
                            language: 'vi'
                        },
                        admins: [],
                        members: []
                    }
                },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true
                }
            );

            if (thread.createdAt && thread.updatedAt && thread.createdAt.getTime() === thread.updatedAt.getTime()) {
                log.info('DATABASE', `Tạo thread mới: ${threadID}`);
            }

            return thread.toObject();
        } catch (error) {
            log.error('DATABASE', `Lỗi lấy thread data ${threadID}:`, error);
            return null;
        }
    }

    async saveThreadData(threadID, threadData) {
        try {
            await Thread.findOneAndUpdate(
                { id: threadID },
                { $set: threadData },
                { 
                    upsert: true,
                    new: true,
                    strict: false
                }
            );
            
            log.info('DATABASE', `Lưu thread data: ${threadID}`);
        } catch (error) {
            log.error('DATABASE', `Lỗi lưu thread data ${threadID}:`, error);
        }
    }

    async getAllThreads() {
        try {
            return await Thread.find({}).sort({ updatedAt: -1 });
        } catch (error) {
            log.error('DATABASE', 'Lỗi lấy tất cả threads:', error);
            return [];
        }
    }

    async getThreadStats() {
        try {
            const totalThreads = await Thread.countDocuments();
            const activeThreads = await Thread.countDocuments({ 
                updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
            });
            const bannedThreads = await Thread.countDocuments({ banned: true });

            return {
                total: totalThreads,
                active: activeThreads,
                banned: bannedThreads
            };
        } catch (error) {
            log.error('DATABASE', 'Lỗi lấy thread stats:', error);
            return { total: 0, active: 0, banned: 0 };
        }
    }

    // Utility methods
    async cleanupOldData(options = {}) {
        try {
            const {
                olderThanDays = 30,
                deleteAll = false,
                keepAdminIDs = []
            } = options;

            let userFilter = {};
            let threadFilter = {};

            if (!deleteAll) {
                const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

                userFilter = {
                    lastActive: { $lt: cutoff },
                    banned: false
                };

                threadFilter = {
                    updatedAt: { $lt: cutoff },
                    banned: false
                };
            }

            if (keepAdminIDs.length > 0) {
                userFilter.id = { $nin: keepAdminIDs };
                threadFilter.id = { $nin: keepAdminIDs };
            }

            const [userResult, threadResult] = await Promise.all([
                User.deleteMany(userFilter),
                Thread.deleteMany(threadFilter)
            ]);

            log.info('DATABASE', `Đã xóa ${userResult.deletedCount} users và ${threadResult.deletedCount} threads`);

            return {
                deletedUsers: userResult.deletedCount,
                deletedThreads: threadResult.deletedCount,
                olderThanDays,
                deleteAll
            };
        } catch (error) {
            log.error('DATABASE', 'Lỗi cleanup data:', error);
            return {
                deletedUsers: 0,
                deletedThreads: 0,
                error: error.message
            };
        }
    }

    async backup() {
        try {
            const users = await this.getAllUsers();
            const threads = await this.getAllThreads();
            
            const backupData = {
                timestamp: new Date(),
                users: users,
                threads: threads
            };

            return backupData;
        } catch (error) {
            log.error('DATABASE', 'Lỗi backup:', error);
            return null;
        }
    }

    // Health check
    isHealthy() {
        return this.isConnected && mongoose.connection.readyState === 1;
    }

    getConnectionInfo() {
        return {
            connected: this.isConnected,
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            name: mongoose.connection.name
        };
    }
}

module.exports = Database;
