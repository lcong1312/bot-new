const moment = require('moment-timezone');

class TimeUtils {
    constructor(timezone = 'Asia/Ho_Chi_Minh') {
        this.timezone = timezone;
        moment.tz.setDefault(this.timezone);
    }

    // Lấy thời gian hiện tại theo timezone
    now() {
        return moment().tz(this.timezone);
    }

    // Format thời gian theo định dạng Việt Nam
    format(date = null, format = 'DD/MM/YYYY HH:mm:ss') {
        const time = date ? moment(date).tz(this.timezone) : this.now();
        return time.format(format);
    }

    // Lấy thời gian hiện tại dạng string
    nowString(format = 'DD/MM/YYYY HH:mm:ss') {
        return this.now().format(format);
    }

    // Lấy ngày hiện tại
    today(format = 'DD/MM/YYYY') {
        return this.now().format(format);
    }

    // Lấy giờ hiện tại
    currentTime(format = 'HH:mm:ss') {
        return this.now().format(format);
    }

    // Chuyển đổi timestamp thành thời gian
    fromTimestamp(timestamp, format = 'DD/MM/YYYY HH:mm:ss') {
        return moment(timestamp).tz(this.timezone).format(format);
    }

    // Lấy timestamp hiện tại
    timestamp() {
        return this.now().valueOf();
    }

    // Tính khoảng cách thời gian
    timeAgo(date) {
        return moment(date).tz(this.timezone).fromNow();
    }

    // Kiểm tra có phải hôm nay không
    isToday(date) {
        return moment(date).tz(this.timezone).isSame(this.now(), 'day');
    }

    // Kiểm tra có phải hôm qua không
    isYesterday(date) {
        return moment(date).tz(this.timezone).isSame(this.now().subtract(1, 'day'), 'day');
    }

    // Lấy thời gian bắt đầu ngày
    startOfDay(date = null) {
        const time = date ? moment(date).tz(this.timezone) : this.now();
        return time.startOf('day');
    }

    // Lấy thời gian kết thúc ngày
    endOfDay(date = null) {
        const time = date ? moment(date).tz(this.timezone) : this.now();
        return time.endOf('day');
    }

    // Thêm thời gian
    add(amount, unit, date = null) {
        const time = date ? moment(date).tz(this.timezone) : this.now();
        return time.add(amount, unit);
    }

    // Trừ thời gian
    subtract(amount, unit, date = null) {
        const time = date ? moment(date).tz(this.timezone) : this.now();
        return time.subtract(amount, unit);
    }

    // So sánh thời gian
    isBefore(date1, date2) {
        return moment(date1).tz(this.timezone).isBefore(moment(date2).tz(this.timezone));
    }

    isAfter(date1, date2) {
        return moment(date1).tz(this.timezone).isAfter(moment(date2).tz(this.timezone));
    }

    isSame(date1, date2, unit = 'day') {
        return moment(date1).tz(this.timezone).isSame(moment(date2).tz(this.timezone), unit);
    }

    // Lấy thông tin chi tiết thời gian
    getTimeInfo(date = null) {
        const time = date ? moment(date).tz(this.timezone) : this.now();
        
        return {
            timestamp: time.valueOf(),
            formatted: time.format('DD/MM/YYYY HH:mm:ss'),
            date: time.format('DD/MM/YYYY'),
            time: time.format('HH:mm:ss'),
            dayOfWeek: time.format('dddd'),
            dayOfWeekVi: this.getDayOfWeekVi(time.day()),
            month: time.format('MMMM'),
            monthVi: this.getMonthVi(time.month()),
            year: time.year(),
            timezone: this.timezone,
            utcOffset: time.format('Z')
        };
    }

    // Chuyển đổi tên ngày sang tiếng Việt
    getDayOfWeekVi(dayIndex) {
        const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
        return days[dayIndex];
    }

    // Chuyển đổi tên tháng sang tiếng Việt
    getMonthVi(monthIndex) {
        const months = [
            'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
        ];
        return months[monthIndex];
    }

    // Format thời gian theo phong cách Việt Nam
    formatVi(date = null) {
        const time = date ? moment(date).tz(this.timezone) : this.now();
        const dayVi = this.getDayOfWeekVi(time.day());
        
        return `${dayVi}, ${time.format('DD/MM/YYYY')} lúc ${time.format('HH:mm:ss')}`;
    }

    // Lấy lời chào theo thời gian
    getGreeting() {
        const hour = this.now().hour();
        
        if (hour >= 5 && hour < 11) {
            return 'Chào buổi sáng';
        } else if (hour >= 11 && hour < 13) {
            return 'Chào buổi trưa';
        } else if (hour >= 13 && hour < 18) {
            return 'Chào buổi chiều';
        } else if (hour >= 18 && hour < 22) {
            return 'Chào buổi tối';
        } else {
            return 'Chào buổi đêm';
        }
    }

    // Kiểm tra giờ làm việc
    isWorkingHours() {
        const hour = this.now().hour();
        return hour >= 8 && hour < 18;
    }

    // Tính uptime
    getUptime(startTime) {
        const now = this.timestamp();
        const diff = now - startTime;
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        let uptime = '';
        if (days > 0) uptime += `${days} ngày `;
        if (hours > 0) uptime += `${hours} giờ `;
        if (minutes > 0) uptime += `${minutes} phút `;
        if (seconds > 0) uptime += `${seconds} giây`;
        
        return uptime.trim() || '0 giây';
    }
}

module.exports = TimeUtils;