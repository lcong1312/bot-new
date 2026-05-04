// Dữ liệu cho auto reply và reactions
module.exports = {
    // Tin nhắn reply ngẫu nhiên
    randomReplies: [
        "😄 Haha thú vị đấy!",
        "🤔 Hmm, để tôi nghĩ xem...",
        "👍 Đồng ý với bạn!",
        "😊 Cảm ơn bạn đã chia sẻ!",
        "🎉 Tuyệt vời!",
        "😮 Wow, thật không ngờ!",
        "💯 Chính xác!",
        "🔥 Hay quá!",
        "❤️ Yêu thích!",
        "😂 Buồn cười ghê!",
        "🌟 Tuyệt vời!",
        "👏 Giỏi lắm!",
        "🚀 Xuất sắc!",
        "💪 Mạnh mẽ!",
        "🎯 Chính xác!",
        "⚡ Nhanh như chớp!",
        "🌈 Đẹp tuyệt!",
        "🎊 Chúc mừng!",
        "🤝 Đồng cảm với bạn!",
        "💡 Ý tưởng hay!",
        "🎵 Nghe hay đấy!",
        "📚 Học hỏi được nhiều!",
        "🌸 Dễ thương quá!",
        "🍀 May mắn nhé!",
        "⭐ Xuất sắc!",
        "🎈 Vui vẻ!",
        "🌺 Tươi đẹp!",
        "🎭 Thú vị!",
        "🏆 Chiến thắng!",
        "🎪 Sôi động!"
    ],

    // Reactions ngẫu nhiên
    randomReactions: [
        "👍", // Like
        "❤️", // Love
        "😂", // Haha
        "😮", // Wow
        "😢", // Sad
        "😡", // Angry
        "👏", // Clap
        "🔥", // Fire
        "💯", // 100
        "⚡", // Lightning
        "🎉", // Party
        "🌟", // Star
        "💪", // Strong
        "🚀", // Rocket
        "❤️‍🔥", // Heart on fire
        "🥰", // Love face
        "😍", // Heart eyes
        "🤩", // Star eyes
        "😎", // Cool
        "🤗", // Hug
        "😊", // Happy
        "😄", // Smile
        "🙌", // Hands up
        "👌", // OK
        "✨", // Sparkles
        "💖", // Pink heart
        "💝", // Gift heart
        "🎯", // Target
        "🏅", // Medal
        "🎊" // Confetti
    ],

    // Từ khóa trigger auto reply
    triggerKeywords: [
        "bot"
    ],

    // Tin nhắn reply theo từ khóa
    keywordReplies: {
        "chào": ["👋 Chào bạn!", "😊 Xin chào!", "🌟 Hello!"],
        "cảm ơn": ["😊 Không có gì!", "❤️ Luôn sẵn sàng giúp!", "🤗 Rất vui được giúp!"],
        "tốt": ["👍 Đúng rồi!", "💯 Tuyệt vời!", "⭐ Xuất sắc!"],
        "buồn": ["🤗 Đừng buồn nhé!", "💪 Mọi thứ sẽ ổn thôi!", "🌈 Hãy tích cực lên!"],
        "vui": ["🎉 Vui quá!", "😄 Haha tuyệt!", "🌟 Tuyệt vời!"],
        "yêu": ["❤️ Aww!", "💖 Dễ thương!", "🥰 Sweet!"],
        "haha": ["😂 Buồn cười ghê!", "🤣 Hài quá!", "😄 Vui nhộn!"],
        "wow": ["😮 Thật không?", "🤩 Amazing!", "⚡ Tuyệt vời!"],
        "ok": ["👌 Okie!", "✅ Roger!", "👍 Được rồi!"],
        "không": ["🤔 Sao vậy?", "😅 Hiểu rồi!", "👌 No problem!"]
    },

    // Cảm xúc theo thời gian
    timeBasedReactions: {
        morning: ["☀️", "🌅", "🌻", "☕", "🥐"],
        afternoon: ["🌞", "🌤️", "🍽️", "💼", "📚"],
        evening: ["🌆", "🌙", "⭐", "🍽️", "🎵"],
        night: ["🌙", "⭐", "😴", "🌃", "💤"]
    },

    // Cảm xúc theo ngày trong tuần
    weekdayReactions: {
        monday: ["💪", "🚀", "☕", "📅", "🎯"],
        tuesday: ["⚡", "🔥", "💯", "📈", "🎪"],
        wednesday: ["🐪", "⚡", "💪", "🎯", "🌟"],
        thursday: ["🎉", "🚀", "💯", "⭐", "🔥"],
        friday: ["🎊", "🍻", "🎉", "🌈", "🎵"],
        saturday: ["🎈", "🎪", "🌺", "🎭", "🎨"],
        sunday: ["😴", "🌸", "☕", "📚", "🎵"]
    }
};