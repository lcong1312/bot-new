function getAdminIDs(threadInfo) {
    return (threadInfo.adminIDs || []).map(admin => String(admin.id || admin));
}

function normalizeMentionID(id) {
    const normalizedID = String(id || '').replace(/^(fb)?id[:.]/, '');
    return /^\d+$/.test(normalizedID) ? normalizedID : null;
}

function getMentionIDs(mentions) {
    if (!mentions) return [];

    if (Array.isArray(mentions)) {
        return mentions
            .flatMap(mention => {
                if (!mention || typeof mention !== 'object') return [];
                const directID = normalizeMentionID(mention.id || mention.userID || mention.uid || mention.userFbId);
                if (directID) return [directID];
                return Object.keys(mention).map(normalizeMentionID).filter(Boolean);
            })
            .filter(Boolean);
    }

    if (typeof mentions === 'object') {
        return Object.keys(mentions).map(normalizeMentionID).filter(Boolean);
    }

    return [];
}

function normalizeName(text) {
    return String(text || '')
        .replace(/^@+/, '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function uniqueUsers(users) {
    const map = new Map();

    for (const user of users) {
        const id = String(user.id || user.userID || user.userFbId || '');
        if (!id) continue;

        map.set(id, {
            ...map.get(id),
            ...user,
            id
        });
    }

    return Array.from(map.values());
}

function getSearchTexts(user, threadInfo) {
    const nickname = threadInfo.nicknames?.[user.id];
    return [
        user.name,
        user.firstName,
        user.vanity,
        nickname
    ].filter(Boolean);
}

function getTokenMatches(users, threadInfo, targetName) {
    const targetTokens = targetName.split(' ').filter(Boolean);
    if (targetTokens.length === 0) return [];

    return users.filter(user => {
        return getSearchTexts(user, threadInfo).some(text => {
            const candidate = normalizeName(text);
            return targetTokens.every(token => candidate.includes(token));
        });
    });
}

function findUserByName(threadInfo, rawName, extraUsers = []) {
    const targetName = normalizeName(rawName);
    if (!targetName) return { user: null, matches: [] };

    const users = uniqueUsers([...(threadInfo.userInfo || []), ...extraUsers]);
    const exactMatches = users.filter(user => {
        return getSearchTexts(user, threadInfo).some(text => normalizeName(text) === targetName);
    });

    if (exactMatches.length === 1) {
        return { user: exactMatches[0], matches: exactMatches };
    }

    const containsMatches = users.filter(user => {
        return getSearchTexts(user, threadInfo).some(text => normalizeName(text).includes(targetName));
    });

    if (containsMatches.length === 1) {
        return { user: containsMatches[0], matches: containsMatches };
    }

    const tokenMatches = getTokenMatches(users, threadInfo, targetName);
    if (tokenMatches.length === 1) {
        return { user: tokenMatches[0], matches: tokenMatches };
    }

    return {
        user: null,
        matches: exactMatches.length > 0
            ? exactMatches
            : containsMatches.length > 0
                ? containsMatches
                : tokenMatches
    };
}

module.exports = {
    name: 'kick',
    aliases: ['remove'],
    description: 'Kick thành viên khỏi nhóm',
    usage: 'kick [@mention hoặc reply tin nhắn]',
    cooldown: 5000,
    adminOnly: true,
    author: 'Lê Công',

    async execute({ message, args, api, reply, bot }) {
        try {
            if (!message.isGroup) {
                return await reply('❌ Lệnh này chỉ dùng trong nhóm!');
            }

            // Kiểm tra bot có phải admin không
            const threadInfo = await api.getThreadInfo(message.threadID);
            const botID = api.getCurrentUserID();
            const adminIDs = getAdminIDs(threadInfo);
            const isAdmin = adminIDs.includes(String(botID));
            
            if (!isAdmin) {
                return await reply('❌ Bot cần quyền quản trị viên để kick thành viên!');
            }

            let targetID = null;
            let targetNameFromThread = null;
            const mentionIDs = getMentionIDs(message.mentions);

            // Nếu reply tin nhắn
            if (message.messageReply) {
                targetID = message.messageReply.senderID;
            }
            // Nếu mention
            else if (mentionIDs.length > 0) {
                targetID = mentionIDs[0];
            }
            // Nếu có UID
            else if (args[0] && !isNaN(args[0])) {
                targetID = args[0];
            }
            // Nếu mention không được API nhận diện, tìm theo tên trong nhóm
            else if (args.length > 0) {
                const rawName = args.join(' ');
                let lookupUsers = [];

                if (threadInfo.participantIDs?.length > 0) {
                    try {
                        const userInfo = await api.getUserInfo(threadInfo.participantIDs);
                        lookupUsers = Object.entries(userInfo || {}).map(([id, info]) => ({
                            id,
                            name: info.name,
                            firstName: info.firstName,
                            vanity: info.vanity
                        }));
                    } catch (error) {
                        console.error('Error loading participant info for kick:', error);
                    }
                }

                const { user, matches } = findUserByName(threadInfo, rawName, lookupUsers);

                if (user) {
                    targetID = user.id;
                    targetNameFromThread = user.name;
                } else if (matches.length > 1) {
                    const matchList = matches
                        .slice(0, 5)
                        .map((item, index) => `${index + 1}. ${item.name} (${item.id})`)
                        .join('\n');

                    const sentMsg = await reply(`❌ Tìm thấy nhiều người trùng tên, hãy reply số thứ tự để kick:\n${matchList}`);

                    if (sentMsg?.messageID) {
                        if (!bot.onReply) bot.onReply = new Map();
                        bot.onReply.set(sentMsg.messageID, {
                            commandName: 'kick',
                            messageID: sentMsg.messageID,
                            author: message.senderID,
                            threadID: message.threadID,
                            matches: matches.slice(0, 5).map(item => ({
                                id: item.id,
                                name: item.name
                            }))
                        });
                    }

                    return;
                }
            }
            else {
                return await reply('❌ Vui lòng mention hoặc reply tin nhắn của người cần kick!');
            }

            if (!targetID) {
                return await reply(`❌ Không tìm thấy thành viên cần kick với tên "${args.join(' ')}".\nHãy reply tin nhắn của người đó hoặc dùng UID để chắc chắn.`);
            }

            // Không cho kick bot
            if (String(targetID) === String(botID)) {
                return await reply('❌ Không thể tự kick bot!');
            }

            if (adminIDs.includes(String(targetID))) {
                return await reply('❌ Không thể kick quản trị viên nhóm. Hãy gỡ quyền quản trị viên của người đó trước.');
            }

            // Lấy thông tin user
            let userName = targetNameFromThread || 'Unknown';
            try {
                const userInfo = await api.getUserInfo(targetID);
                userName = userInfo[targetID]?.name || 'Unknown';
            } catch (error) {
                console.error('Error getting user info:', error);
            }

            // Kick user
            await api.removeUserFromGroup(targetID, message.threadID);
            await reply(`✅ Đã kick ${userName} khỏi nhóm!`);

        } catch (error) {
            console.error('Error in kick command:', error);
            const errorMessage = error.error || error.message || 'Không rõ lỗi';
            await reply(`❌ Không thể kick thành viên: ${errorMessage}`);
        }
    },

    async onReply({ message, reply, api, bot, replyData }) {
        try {
            if (String(message.senderID) !== String(replyData.author)) {
                return;
            }

            if (String(message.threadID) !== String(replyData.threadID)) {
                return;
            }

            const choice = parseInt(message.body, 10);
            const matches = replyData.matches || [];

            if (isNaN(choice) || choice < 1 || choice > matches.length) {
                return await reply(`❌ Lựa chọn không hợp lệ. Nhập số từ 1-${matches.length}.`);
            }

            const target = matches[choice - 1];
            const targetID = target.id;
            const threadInfo = await api.getThreadInfo(message.threadID);
            const botID = api.getCurrentUserID();
            const adminIDs = getAdminIDs(threadInfo);

            if (!adminIDs.includes(String(botID))) {
                return await reply('❌ Bot cần quyền quản trị viên để kick thành viên!');
            }

            if (String(targetID) === String(botID)) {
                return await reply('❌ Không thể tự kick bot!');
            }

            if (adminIDs.includes(String(targetID))) {
                return await reply('❌ Không thể kick quản trị viên nhóm. Hãy gỡ quyền quản trị viên của người đó trước.');
            }

            let userName = target.name || 'Unknown';
            try {
                const userInfo = await api.getUserInfo(targetID);
                userName = userInfo[targetID]?.name || userName;
            } catch (error) {
                console.error('Error getting user info:', error);
            }

            await api.removeUserFromGroup(targetID, message.threadID);
            await reply(`✅ Đã kick ${userName} khỏi nhóm!`);

            if (bot.onReply) {
                bot.onReply.delete(replyData.messageID);
            }
        } catch (error) {
            console.error('Error in kick onReply:', error);
            const errorMessage = error.error || error.message || 'Không rõ lỗi';
            await reply(`❌ Không thể kick thành viên: ${errorMessage}`);
        }
    }
};
