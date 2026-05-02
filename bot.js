const express = require('express');
const app = express();
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const Tesseract = require('tesseract.js');

const token = process.env.CV_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// --- CONFIGURATION ---
const ADMIN_USERNAME = "Misterx61";
const userStates = {};

console.log("--- CV BUILDER: PRIVATE CHAT MODE ---");
console.log("✅ Bot works in private chat only");

// Health check endpoints
app.get('/health', (req, res) => res.status(200).send('Bot is alive'));
app.get('/', (req, res) => res.status(200).send('CV Telegram Bot is running!'));

const translations = {
    welcome: "👋 Welcome to CV Builder!\n\n👋 እንኳን ወደ ሲቪ ገንቢ በደህና መጡ!\n\nUse the buttons below to build your CV.",
    nameRequest: "What is your **Full Name**?\nሙሉ ስምዎ ማን ነው?",
    roleRequest: "What is your **Job Title**?\nየስራ መደብዎ ምንድን ነው?",
    skillsRequest: "List your **top 3 Skills** (comma separated):\n**3 ዋና ክህሎቶችዎን** ይጥቀሱ (በነጠላ ሰረዝ ይለዩ):",
    experienceRequest: "Type your **Work Experience** (or send a photo of your CV):\nየስራ **ልምድዎን** ይጥቀሱ (ወይም የሲቪዎን ፎቶ ይላኩ):",
    readingCV: "🧐 Reading your CV... / ሲቪዎን እያነበብኩ ነው...",
    confirmOCR: "Should I use this extracted information?\nበዚህ የተወጣው መረጃ ልጠቀም? (Yes/አዎ / No/አይደለም)",
    reviewPrompt: "✅ **REVIEW YOUR CV / ሲቪዎን ይከልሱ:**\n\nIs this correct?\nይህ ትክክል ነው? (Yes/አዎ / No/አይደለም)",
    finalPrompt: "🌟 **FINAL CV SUMMARY / የመጨረሻ ሲቪ ማጠቃለያ:**\n\n",
    copyInstruction: "👆 **Copy this text** and forward it to @Registration_Bot\n\n👆 ይህን **ጽሁፍ ቅዳ** ለ @Registration_Bot ይላኩ።",
    helpSent: "✅ Your help request has been sent to admins. You will be contacted soon.\n\n✅ ጥያቄዎ ለአስተዳዳሪዎች ተልኳል። በቅርቡ ይገናኛሉ።",
    adminAlert: "🆘 **HELP REQUESTED!**\n\n",
    thankYou: "Thank you for using CV Builder! Start a new CV anytime with /start\n\nሲቪ ገንቢን ስለተጠቀሙ እናመሰግናለን! በማንኛውም ጊዜ አዲስ ሲቪ ለመጀመር /start ይጠቀሙ።"
};

function sendMainMenu(chatId) {
    const options = {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [
                [{ text: '📝 Start CV Builder' }],
                [{ text: '❓ Request Help' }]
            ],
            resize_keyboard: true,
            persistent: true
        }
    };
    bot.sendMessage(chatId, translations.welcome, options);
}

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const firstName = msg.from.first_name;
    const userId = msg.from.id;
    const chatType = msg.chat.type;

    if (chatType !== 'private') {
        if (text === '/start') {
            const botInfo = await bot.getMe();
            bot.sendMessage(chatId, `🤖 Please message me directly: https://t.me/${botInfo.username}`);
        }
        return;
    }

    console.log(`📨 Private chat | User: ${firstName} (${userId}) | Text: ${text || 'photo'}`);

    if (text === '/start') {
        sendMainMenu(chatId);
        return;
    }

    if (text === '📝 Start CV Builder') {
        userStates[userId] = { step: 'NAME' };
        bot.sendMessage(chatId, translations.nameRequest, { parse_mode: 'Markdown' });
        return;
    }

    if (text === '❓ Request Help') {
        bot.sendMessage(chatId, translations.helpSent, { parse_mode: 'Markdown' });
        bot.sendMessage(Misterx61, 
            `${translations.adminAlert}👤 User: ${firstName}\n🆔 ID: ${userId}\n💬 @${msg.from.username || 'N/A'}`
        ).catch(() => console.log("Admin notification sent"));
        return;
    }

    if (msg.photo && userStates[userId]) {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        try {
            bot.sendMessage(chatId, translations.readingCV);
            const fileLink = await bot.getFileLink(fileId);
            const { data: { text: extracted } } = await Tesseract.recognize(fileLink, 'eng+amh');
            
            if (extracted && extracted.trim().length > 10) {
                const short = "📋 **Extracted Summary:**\n" + extracted.substring(0, 200) + "...";
                userStates[userId].tempExperience = extracted;
                userStates[userId].step = 'CONFIRM_OCR';
                bot.sendMessage(chatId, `${short}\n\n${translations.confirmOCR}`, { parse_mode: 'Markdown' });
            } else {
                bot.sendMessage(chatId, "❌ Could not read text clearly. Please type manually.");
                userStates[userId].step = 'EXPERIENCE';
            }
        } catch (e) { 
            console.error("OCR Error:", e);
            bot.sendMessage(chatId, "❌ Error reading image. Please type manually.");
            userStates[userId].step = 'EXPERIENCE';
        }
        return;
    }

    const state = userStates[userId];
    if (!state) return;

    if (!text) {
        bot.sendMessage(chatId, "Please respond with text.");
        return;
    }

    switch (state.step) {
        case 'NAME':
            if (text.length < 2) {
                bot.sendMessage(chatId, "Please enter a valid name (at least 2 characters).");
                return;
            }
            state.fullName = text;
            state.step = 'ROLE';
            bot.sendMessage(chatId, translations.roleRequest, { parse_mode: 'Markdown' });
            break;

        case 'ROLE':
            if (text.length < 2) {
                bot.sendMessage(chatId, "Please enter a valid job title.");
                return;
            }
            state.jobRole = text;
            state.step = 'SKILLS';
            bot.sendMessage(chatId, translations.skillsRequest, { parse_mode: 'Markdown' });
            break;

        case 'SKILLS':
            if (text.length < 3) {
                bot.sendMessage(chatId, "Please list at least one skill.");
                return;
            }
            state.skillsList = text;
            state.step = 'EXPERIENCE';
            bot.sendMessage(chatId, translations.experienceRequest, { parse_mode: 'Markdown' });
            break;

        case 'EXPERIENCE':
            if (text.length < 5) {
                bot.sendMessage(chatId, "Please provide more details (at least 5 characters).");
                return;
            }
            state.workExperience = text;
            state.step = 'FINALIZE';
            const cvPreview = `👤 **Name:** ${state.fullName}\n💼 **Role:** ${state.jobRole}\n🛠 **Skills:** ${state.skillsList}\n🏢 **Experience:** ${state.workExperience}`;
            bot.sendMessage(chatId, `${translations.reviewPrompt}\n${cvPreview}`, { parse_mode: 'Markdown' });
            break;

        case 'CONFIRM_OCR':
            if (text.toLowerCase().includes('yes') || text === 'አዎ') {
                state.workExperience = state.tempExperience;
                state.step = 'FINALIZE';
                const cvPreview = `👤 **Name:** ${state.fullName}\n💼 **Role:** ${state.jobRole}\n🛠 **Skills:** ${state.skillsList}\n🏢 **Experience:** ${state.workExperience}`;
                bot.sendMessage(chatId, `${translations.reviewPrompt}\n${cvPreview}`, { parse_mode: 'Markdown' });
            } else {
                delete userStates[userId];
                bot.sendMessage(chatId, "Let's start over! Type /start");
            }
            break;

        case 'FINALIZE':
            if (text.toLowerCase().includes('yes') || text === 'አዎ') {
                const finalCV = `👤 **Name:** ${state.fullName}\n💼 **Role:** ${state.jobRole}\n🛠 **Skills:** ${state.skillsList}\n🏢 **Experience:** ${state.workExperience}`;
                await bot.sendMessage(chatId, `${translations.finalPrompt}\n${finalCV}`, { parse_mode: 'Markdown' });
                await bot.sendMessage(chatId, translations.copyInstruction, { parse_mode: 'Markdown' });
                await bot.sendMessage(chatId, translations.thankYou, { parse_mode: 'Markdown' });
                delete userStates[userId];
                sendMainMenu(chatId);
            } else if (text.toLowerCase().includes('no') || text === 'አይደለም') {
                delete userStates[userId];
                bot.sendMessage(chatId, "Let's start over! Type /start");
                sendMainMenu(chatId);
            } else {
                bot.sendMessage(chatId, `Please answer with "Yes/አዎ" or "No/አይደለም"`);
            }
            break;
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    const botInfo = await bot.getMe();
    console.log(`✅ Server on port ${PORT}`);
    console.log(`✅ Bot is ready!`);
    console.log(`✅ Bot username: @${botInfo.username}`);
    console.log(`✅ Share this link: https://t.me/${botInfo.username}`);
});