const axios = require("axios");
const moment = require("moment-timezone");
const Canvas = require("canvas");
const fs = require("fs-extra");
const path = require("path");

function convertFtoC(F) {
    return Math.floor((F - 32) / 1.8);
}

function formatHours(hours) {
    return moment(hours).tz("Asia/Ho_Chi_Minh").format("HH[h]mm[p]");
}

module.exports = {
    name: 'thoitiet',
    aliases: ['weather', 'tt'],
    description: 'Xem dự báo thời tiết hiện tại và 7 ngày sau',
    usage: 'thoitiet <địa điểm>',
    cooldown: 5000,
    adminOnly: false,
    author: 'NTKhang | Viết Công',

    async execute({ message, args, reply, api, bot }) {
        const apikey = "d7e795ae6a0d44aaa8abb1a0a7ac19e4";

        const area = args.join(" ");
        if (!area) {
            return await reply("Vui lòng nhập địa điểm");
        }

        let areaKey, dataWeather, areaName;

        try {
            const response = (await axios.get(`https://api.accuweather.com/locations/v1/cities/search.json?q=${encodeURIComponent(area)}&apikey=${apikey}&language=vi-vn`)).data;
            if (response.length == 0) {
                return await reply(`Không thể tìm thấy địa điểm: ${area}`);
            }
            const data = response[0];
            areaKey = data.Key;
            areaName = data.LocalizedName;
        }
        catch (err) {
            return await reply(`❌ Đã xảy ra lỗi: ${err.response?.data?.Message || err.message}`);
        }

        try {
            dataWeather = (await axios.get(`http://api.accuweather.com/forecasts/v1/daily/10day/${areaKey}?apikey=${apikey}&details=true&language=vi`)).data;
        }
        catch (err) {
            return await reply(`❌ Đã xảy ra lỗi: ${err.response?.data?.Message || err.message}`);
        }

        const dataWeatherDaily = dataWeather.DailyForecasts;
        const dataWeatherToday = dataWeatherDaily[0];
        
        const msg = `Thời tiết hôm nay: ${areaName}\n${dataWeather.Headline.Text}\n🌡 Nhiệt độ thấp nhất - cao nhất ${convertFtoC(dataWeatherToday.Temperature.Minimum.Value)}°C - ${convertFtoC(dataWeatherToday.Temperature.Maximum.Value)}°C\n🌡 Nhiệt độ cảm nhận được ${convertFtoC(dataWeatherToday.RealFeelTemperature.Minimum.Value)}°C - ${convertFtoC(dataWeatherToday.RealFeelTemperature.Maximum.Value)}°C\n🌅 Mặt trời mọc ${formatHours(dataWeatherToday.Sun.Rise)}\n🌄 Mặt trời lặn ${formatHours(dataWeatherToday.Sun.Set)}\n🌃 Mặt trăng mọc ${formatHours(dataWeatherToday.Moon.Rise)}\n🏙️ Mặt trăng lặn ${formatHours(dataWeatherToday.Moon.Set)}\n🌞 Ban ngày: ${dataWeatherToday.Day.LongPhrase}\n🌙 Ban đêm: ${dataWeatherToday.Night.LongPhrase}`;

        try {
            // Tạo canvas với background
            const bgPath = path.join(__dirname, 'assets', 'bgWeather.jpg');
            let bg;
            
            // Nếu không có background, tạo background đơn giản
            if (await fs.pathExists(bgPath)) {
                bg = await Canvas.loadImage(bgPath);
            } else {
                // Tạo background gradient đơn giản
                const canvas = Canvas.createCanvas(1080, 607);
                const ctx = canvas.getContext("2d");
                const gradient = ctx.createLinearGradient(0, 0, 0, 607);
                gradient.addColorStop(0, "#1e3c72");
                gradient.addColorStop(1, "#2a5298");
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 1080, 607);
                bg = canvas;
            }

            const { width, height } = bg;
            const canvas = Canvas.createCanvas(width, height);
            const ctx = canvas.getContext("2d");
            ctx.drawImage(bg, 0, 0, width, height);
            
            let X = 100;
            ctx.fillStyle = "#ffffff";
            const data = dataWeather.DailyForecasts.slice(0, 7);
            
            for (const item of data) {
                // Vẽ icon thời tiết đơn giản dựa trên mã icon
                const iconCode = item.Day.Icon;
                ctx.fillStyle = "#ffffff";
                
                // Vẽ icon dựa trên code
                if (iconCode >= 1 && iconCode <= 5) {
                    // Nắng
                    ctx.fillStyle = "#ffeb3b";
                    ctx.beginPath();
                    ctx.arc(X + 40, 250, 25, 0, Math.PI * 2);
                    ctx.fill();
                    // Tia nắng
                    for (let i = 0; i < 8; i++) {
                        const angle = (Math.PI * 2 * i) / 8;
                        ctx.beginPath();
                        ctx.moveTo(X + 40 + Math.cos(angle) * 30, 250 + Math.sin(angle) * 30);
                        ctx.lineTo(X + 40 + Math.cos(angle) * 40, 250 + Math.sin(angle) * 40);
                        ctx.strokeStyle = "#ffeb3b";
                        ctx.lineWidth = 3;
                        ctx.stroke();
                    }
                } else if (iconCode >= 6 && iconCode <= 11) {
                    // Có mây
                    ctx.fillStyle = "#90caf9";
                    ctx.beginPath();
                    ctx.arc(X + 30, 245, 15, 0, Math.PI * 2);
                    ctx.arc(X + 45, 240, 18, 0, Math.PI * 2);
                    ctx.arc(X + 60, 245, 15, 0, Math.PI * 2);
                    ctx.fill();
                } else if (iconCode >= 12 && iconCode <= 18) {
                    // Mưa
                    ctx.fillStyle = "#64b5f6";
                    ctx.beginPath();
                    ctx.arc(X + 30, 235, 15, 0, Math.PI * 2);
                    ctx.arc(X + 45, 230, 18, 0, Math.PI * 2);
                    ctx.arc(X + 60, 235, 15, 0, Math.PI * 2);
                    ctx.fill();
                    // Giọt mưa
                    ctx.fillStyle = "#42a5f5";
                    for (let i = 0; i < 3; i++) {
                        ctx.beginPath();
                        ctx.arc(X + 30 + i * 15, 260 + (i % 2) * 5, 3, 0, Math.PI * 2);
                        ctx.fill();
                    }
                } else {
                    // Mặc định - mây
                    ctx.fillStyle = "#b0bec5";
                    ctx.beginPath();
                    ctx.arc(X + 30, 245, 15, 0, Math.PI * 2);
                    ctx.arc(X + 45, 240, 18, 0, Math.PI * 2);
                    ctx.arc(X + 60, 245, 15, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.fillStyle = "#ffffff";
                ctx.font = "30px Arial";
                const maxC = `${convertFtoC(item.Temperature.Maximum.Value)}°C `;
                ctx.fillText(maxC, X, 366);

                ctx.font = "30px Arial";
                const minC = String(`${convertFtoC(item.Temperature.Minimum.Value)}°C`);
                const day = moment(item.Date).format("DD");
                ctx.fillText(minC, X, 445);
                ctx.fillText(day, X + 20, 140);

                X += 135;
            }

            const cacheDir = path.join(__dirname, '../cache');
            await fs.ensureDir(cacheDir);
            const pathSaveImg = path.join(cacheDir, `weather_${areaKey}.jpg`);
            await fs.writeFile(pathSaveImg, canvas.toBuffer());

            await api.sendMessage({
                body: msg,
                attachment: fs.createReadStream(pathSaveImg)
            }, message.threadID, () => fs.unlinkSync(pathSaveImg));

        } catch (canvasErr) {
            console.error('Error creating canvas:', canvasErr);
            // Nếu không tạo được canvas, gửi text thôi
            await reply(msg);
        }
    }
};
