# 🤖 Messenger Bot - New Version

Bot Messenger được viết lại hoàn toàn với nhiều tính năng mạnh mẽ và hiện đại.

## ✨ Tính năng nổi bật

### 🎮 Commands (Lệnh)
- **Economy System** - Hệ thống kinh tế với tiền và kinh nghiệm
- **Games** - Tài xỉu, chẵn lẻ
- **Music** - Tìm kiếm và tải nhạc từ YouTube
- **Weather** - Xem thông tin thời tiết
- **Admin Tools** - Quản lý user, kick, ban, reload
- **Auto Reply** - Tự động trả lời từ khóa

### 🎪 Events (Sự kiện)
- **Welcome/Goodbye** - Chào mừng thành viên mới với avatar
- **Anti-Out** - Tự động add lại thành viên out
- **Auto Reply** - Phản hồi thông minh với emoji

### 🛡️ Bảo mật & Quản lý
- Phân quyền admin/user
- Ban/unban user
- Private chat control
- Cooldown system

## 📦 Cài đặt

### Yêu cầu
- Node.js >= 18.0.0
- npm hoặc yarn

### Bước 1: Clone repository
```bash
git clone https://github.com/lcong1312/bot-new.git
cd bot-new
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

### Bước 3: Cấu hình

#### 3.1. Tạo file `account.json`
```json
{
  "appState": [
    // Paste appState (cookie) của bạn vào đây
  ]
}
```

**Cách lấy appState:**
1. Cài extension [EditThisCookie](https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg)
2. Đăng nhập Facebook
3. Click icon EditThisCookie → Export
4. Paste vào `account.json`

Hoặc xem hướng dẫn chi tiết trong file `GET_APPSTATE.md`

#### 3.2. Cấu hình `config.json`
```json
{
  "prefix": "/",
  "name": "Bot Name",
  "adminIDs": ["YOUR_FACEBOOK_ID"],
  "timezone": "Asia/Ho_Chi_Minh"
}
```

**Lấy Facebook ID:**
- Vào profile Facebook → Copy số trong URL
- Hoặc dùng tool: https://findids.net/

### Bước 4: Chạy bot
```bash
npm start
```

## 📋 Danh sách lệnh

### 💰 Economy
| Lệnh | Mô tả | Quyền |
|------|-------|-------|
| `/balance` | Xem số dư | User |
| `/daily` | Điểm danh nhận thưởng | User |
| `/pay` | Cộng/trừ tiền | Admin |

### 🎲 Games
| Lệnh | Mô tả | Cược |
|------|-------|------|
| `/taixiu` | Tài xỉu (3 xúc xắc) | 100-10,000$ |
| `/chanle` | Chẵn lẻ (2 xúc xắc) | 100-10,000$ |

### 🎵 Media
| Lệnh | Mô tả |
|------|-------|
| `/sing` | Tìm và tải nhạc YouTube |

### 🌤️ Tiện ích
| Lệnh | Mô tả |
|------|-------|
| `/thoitiet` | Xem thời tiết |
| `/time` | Xem thời gian |
| `/profile` | Xem profile với avatar |

### 👥 Quản lý
| Lệnh | Mô tả | Quyền |
|------|-------|-------|
| `/kick` | Kick thành viên | Admin |
| `/antiout` | Bật/tắt chống out | Admin |
| `/admin` | Các lệnh admin | Admin |
| `/reload` | Reload commands/events | Admin |

### ℹ️ Thông tin
| Lệnh | Mô tả |
|------|-------|
| `/help` | Danh sách lệnh |
| `/info` | Thông tin bot |
| `/ping` | Kiểm tra độ trễ |

## 🎯 Tính năng đặc biệt

### 💰 Daily System
- Điểm danh mỗi ngày nhận 1,000-20,000$
- Nhận 10-60 EXP
- Streak bonus khi điểm danh liên tục
- Tối đa +5,000$ và +100 EXP từ streak

### 🎲 Game System
- Tài xỉu: Đoán tổng 3 xúc xắc (Tài: 11-17, Xỉu: 4-10)
- Chẵn lẻ: Đoán tổng 2 xúc xắc
- Thắng được x2 tiền cược

### 🎵 Music System
- Tìm kiếm nhạc trên YouTube
- Hiển thị 5 kết quả
- Reply số để tải MP3
- Tự động xóa file sau khi gửi

### 🛡️ Anti-Out System
- Tự động add lại thành viên bị kick
- Không add lại nếu tự rời
- Cần bot có quyền admin

## 🔧 Cấu trúc thư mục

```
new-messenger-bot/
├── commands/          # Các lệnh
├── events/           # Các sự kiện
├── src/              # Source code chính
│   ├── Bot.js
│   ├── CommandHandler.js
│   └── EventHandler.js
├── utils/            # Tiện ích
├── database/         # Database (JSON)
├── cache/            # File tạm
├── config.json       # Cấu hình
├── account.json      # Thông tin đăng nhập
└── index.js          # File chính
```

## 🚀 Development

### Thêm command mới
Tạo file trong `commands/`:
```javascript
module.exports = {
    name: 'test',
    aliases: ['t'],
    description: 'Test command',
    usage: 'test',
    cooldown: 5000,
    adminOnly: false,
    author: 'Your Name',
    
    async execute({ message, args, reply, bot, api }) {
        await reply('Hello World!');
    }
};
```

### Thêm event mới
Tạo file trong `events/`:
```javascript
module.exports = {
    name: 'test',
    type: 'message',
    description: 'Test event',
    
    async execute({ message, bot, api }) {
        // Handle event
    }
};
```

## 📝 Changelog

### Version 1.0.0
- ✅ Hệ thống command và event hoàn chỉnh
- ✅ Economy system với daily, games
- ✅ Music player từ YouTube
- ✅ Weather command
- ✅ Anti-out system
- ✅ Welcome/goodbye với avatar
- ✅ Auto reply thông minh

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Hãy tạo Pull Request hoặc Issue.

## 📄 License

MIT License - Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 👨‍💻 Tác giả

**Lê Công**
- GitHub: [@lcong1312](https://github.com/lcong1312)

## ⚠️ Lưu ý

- **KHÔNG** chia sẻ file `account.json` hoặc `credentials.json`
- **KHÔNG** commit các file nhạy cảm lên GitHub
- Sử dụng tài khoản phụ để chạy bot
- Tuân thủ Terms of Service của Facebook

## 🆘 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra [Issues](https://github.com/lcong1312/bot-new/issues)
2. Tạo Issue mới với mô tả chi tiết
3. Xem file `GET_APPSTATE.md` để biết cách lấy cookie

## 🎉 Credits

- Dựa trên kinh nghiệm từ Goat Bot V2
- Sử dụng [fca-unofficial](https://github.com/VangBanLaNhat/fca-unofficial) cho Facebook API
- Music API by Arafat

---

⭐ Nếu thấy hữu ích, hãy cho repo một star nhé! ⭐
