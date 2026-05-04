const axios = require('axios');

const API_URL = 'https://token-plan-sgp.xiaomimimo.com/anthropic/v1/messages';
const API_TOKEN = 'tp-sgl3pmfgg7nss9ujk9qyg8ggmsebhm43cn19cwe0gm8ji9xe';
const MODEL = 'mimo-v2.5-pro';

function getResponseText(data) {
    if (!data) return '';

    if (typeof data === 'string') {
        return data;
    }

    if (Array.isArray(data.content)) {
        return data.content
            .map(item => {
                if (typeof item === 'string') return item;
                return item?.text || '';
            })
            .filter(Boolean)
            .join('\n')
            .trim();
    }

    return data.text || data.message || data.reply || data.response || '';
}

module.exports = {
    name: 'ai',
    aliases: ['ask', 'gpt'],
    description: 'Hỏi AI và nhận câu trả lời.',
    usage: 'AI <nội dung>',
    cooldown: 5000,
    adminOnly: false,
    category: 'ai',
    author: 'Lê Công',

    async execute({ args, reply }) {
        const text = args.join(' ').trim();

        if (!text) {
            return await reply('❌ Vui lòng nhập nội dung cần hỏi AI.\nVí dụ: /AI Hãy viết cho tôi 1 bài văn nghị luận 200 chữ về giới trẻ hiện nay');
        }

        try {
            const response = await axios.post(
                API_URL,
                {
                    model: MODEL,
                    messages: [
                        {
                            role: 'user',
                            content: `Hãy trả lời bằng tiếng Việt.\n\n${text}`
                        }
                    ]
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${API_TOKEN}`
                    },
                    timeout: 60000
                }
            );

            const answer = getResponseText(response.data);

            if (!answer) {
                return await reply('❌ AI không trả về nội dung phản hồi.');
            }

            await reply(answer);
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message
                || error.response?.data?.message
                || error.message;

            await reply(`❌ Không thể gọi AI: ${errorMessage}`);
        }
    }
};
