// require('dotenv').config();
// const TelegramBot = require('node-telegram-bot-api');

// const token = process.env.CV_BOT_TOKEN; // Use your new token here
// const bot = new TelegramBot(token, { polling: true });

// // This object will temporarily store user data while they are answering questions
// const userStates = {};

// console.log("--- CV BUILDER BOT IS LIVE ---");

// bot.on('message', async (msg) => {
//     const chatId = msg.chat.id;
//     const text = msg.text;

//     // 1. START COMMAND
//     if (text === '/start') {
//         userStates[chatId] = { step: 'NAME' };
//         return bot.sendMessage(chatId, "Welcome! Let's build your professional summary. What is your **Full Name**?");
//     }

//     // If the user hasn't started, ignore other messages
//     if (!userStates[chatId]) return;

//     const currentState = userStates[chatId];

//     // 2. CONVERSATIONAL LOGIC
//     switch (currentState.step) {
//         case 'NAME':
//             userStates[chatId].name = text;
//             userStates[chatId].step = 'ROLE';
//             bot.sendMessage(chatId, `Nice to meet you, ${text}! What is your **Desired Job Title** (e.g., Receptionist, Developer)?`);
//             break;

//         case 'ROLE':
//             userStates[chatId].role = text;
//             userStates[chatId].step = 'SKILLS';
//             bot.sendMessage(chatId, "Great. List your **Top 3 Skills** (separated by commas):");
//             break;

//         case 'SKILLS':
//             userStates[chatId].skills = text;
//             userStates[chatId].step = 'EXPERIENCE';
//             bot.sendMessage(chatId, "Briefly describe your **Work Experience** (Company and Years):");
//             break;

//         case 'EXPERIENCE':
//             userStates[chatId].experience = text;
//             userStates[chatId].step = 'CONFIRM';
            
//             // Generate the final text preview
//             const summary = generateSummary(userStates[chatId]);
//             bot.sendMessage(chatId, `✅ **Information Collected!**\n\n${summary}\n\nDoes this look correct? (Type 'Yes' to finalize or '/start' to restart)`);
//             break;

//         case 'CONFIRM':
//             if (text.toLowerCase() === 'yes') {
//                 const finalCV = generateSummary(userStates[chatId]);
//                 await bot.sendMessage(chatId, "🌟 **Your Professional CV Summary is Ready!**");
//                 await bot.sendMessage(chatId, finalCV);
//                 await bot.sendMessage(chatId, "👆 **Copy the text above** and forward it to our @Registration_Bot to apply!");
//                 delete userStates[chatId]; // Clear state after finishing
//             }
//             break;
//     }
// });

// // Helper function to format the text
// function generateSummary(data) {
//     return `
// 📋 **PROFESSIONAL RESUME SUMMARY**
// ━━━━━━━━━━━━━━━━━━━━
// 👤 **NAME:** ${data.name}
// 💼 **ROLE:** ${data.role}

// 🛠 **SKILLS:**
// ${data.skills.split(',').map(s => `• ${s.trim()}`).join('\n')}

// 🏢 **EXPERIENCE:**
// ${data.experience}

// ━━━━━━━━━━━━━━━━━━━━
// _Generated via CV Builder Bot_`;
// }







// require('dotenv').config();
// const TelegramBot = require('node-telegram-bot-api');
// const Tesseract = require('tesseract.js');
// const nlp = require('compromise');

// const token = process.env.CV_BOT_TOKEN;
// const bot = new TelegramBot(token, { polling: true });

// // State storage to track user progress
// const userStates = {};

// console.log("--- CV BUILDER ACTIVE (LOCAL NLP + OCR) ---");

// // --- HELPER: LOCAL TEXT SUMMARIZER ---
// function summarizeLocally(rawText) {
//     // Remove weird OCR noise but keep English and Ethiopic characters
//     let cleanText = rawText.replace(/[^a-zA-Z0-9\s,.፡-፥]/g, ' ').replace(/\s+/g, ' ');

//     // Use Compromise NLP for English parts
//     let doc = nlp(cleanText);
    
//     // Extract key entities
//     let orgs = doc.organizations().out('array');
//     let places = doc.places().out('array');
//     let verbs = doc.verbs().toInfinitive().unique().out('array');

//     let summary = "📍 **Experience Highlights / የስራ ልምድ ማጠቃለያ:**\n";
    
//     if (orgs.length > 0) {
//         summary += `• Organizations: ${orgs.slice(0, 2).join(', ')}\n`;
//     }
    
//     if (verbs.length > 0) {
//         // Filter out very common small verbs
//         const keyActions = verbs.filter(v => v.length > 3).slice(0, 3);
//         if (keyActions.length > 0) {
//             summary += `• Responsibilities: ${keyActions.join(', ')}\n`;
//         }
//     }

//     // Fallback: If NLP finds nothing (common with Amharic-heavy text), 
//     // we take the first 150 characters cleanly.
//     if (summary.length < 60) {
//         summary = "📍 **Experience Summary:**\n" + cleanText.substring(0, 150) + "...";
//     }

//     return summary;
// }

// // --- MAIN BOT LOGIC ---
// bot.on('message', async (msg) => {
//     const chatId = msg.chat.id;
//     const text = msg.text;

//     // 1. START COMMAND
//     if (text === '/start') {
//         userStates[chatId] = { step: 'NAME' };
//         return bot.sendMessage(chatId, 
//             "👋 Welcome! Let's build your short CV.\nእንኳን ደህና መጡ! አጭር የሲቪ ማጠቃለያ እንስራ።\n\n" +
//             "What is your **Full Name**?\nሙሉ ስምዎ ማን ነው?");
//     }

//     // 2. PHOTO HANDLER (OCR + NLP)
//     if (msg.photo) {
//         const fileId = msg.photo[msg.photo.length - 1].file_id;
//         try {
//             bot.sendMessage(chatId, "🧐 Reading and summarizing... / እያነበብኩ እና እያሳጠርኩ ነው...");
//             const fileLink = await bot.getFileLink(fileId);
            
//             const { data: { text: rawExtracted } } = await Tesseract.recognize(fileLink, 'eng+amh');

//             if (rawExtracted.trim().length > 10) {
//                 const shortSummary = summarizeLocally(rawExtracted);
                
//                 userStates[chatId] = { 
//                     ...userStates[chatId], 
//                     tempExperience: shortSummary, 
//                     step: 'CONFIRM_OCR' 
//                 };
                
//                 return bot.sendMessage(chatId, 
//                     `${shortSummary}\n\n` +
//                     `Should I use this summary? / በዚህ ማጠቃለያ ልቀጥል? (Yes/No ወይም አዎ/አይደለም)`);
//             } else {
//                 return bot.sendMessage(chatId, "❌ Text too short or blurry. / ጽሁፉ በጣም አጭር ነው ወይም አይነበብም።");
//             }
//         } catch (e) {
//             console.error(e);
//             return bot.sendMessage(chatId, "⚠️ Error processing image.");
//         }
//     }

//     // 3. CONVERSATION STEPS
//     if (!userStates[chatId]) return;
//     const state = userStates[chatId];

//     switch (state.step) {
//         case 'NAME':
//             state.name = text;
//             state.step = 'ROLE';
//             bot.sendMessage(chatId, "What is your **Job Title**?\nየስራ መደብዎ ምንድን ነው?");
//             break;

//         case 'ROLE':
//             state.role = text;
//             state.step = 'SKILLS';
//             bot.sendMessage(chatId, "List **3 Skills** (comma separated):\n3 ዋና ክህሎቶችዎን ይጥቀሱ (በኮማ በመለየት):");
//             break;

//         case 'SKILLS':
//             state.skills = text;
//             state.step = 'EXPERIENCE';
//             bot.sendMessage(chatId, "Describe your **Experience** (or send a photo of your CV):\nየስራ ልምድዎን ይጥቀሱ (ወይም የሲቪዎን ፎቶ ይላኩ):");
//             break;

//         case 'EXPERIENCE':
//             state.experience = text;
//             finalizeCV(chatId);
//             break;

//         case 'CONFIRM_OCR':
//             if (text.toLowerCase() === 'yes' || text === 'አዎ') {
//                 state.experience = state.tempExperience;
//                 finalizeCV(chatId);
//             } else {
//                 state.step = 'EXPERIENCE';
//                 bot.sendMessage(chatId, "Okay, please type your experience manually:\nእሺ፤ እባክዎ የስራ ልምድዎን በጽሁፍ ያስገቡ:");
//             }
//             break;

//         case 'FINALIZE':
//             if (text.toLowerCase() === 'yes' || text === 'አዎ') {
//                 const finalOutput = generateDisplay(state);
//                 bot.sendMessage(chatId, "🌟 **YOUR CV IS READY! / ሲቪዎ ተዘጋጅቷል!**");
//                 bot.sendMessage(chatId, finalOutput);
//                 bot.sendMessage(chatId, "👆 **Copy & Forward** this to @Registration_Bot.\nይህንን ኮፒ አድርገው ለ @Registration_Bot ይላኩ።");
//                 delete userStates[chatId];
//             }
//             break;
//     }
// });

// // Helper to move to the final review stage
// function finalizeCV(chatId) {
//     const state = userStates[chatId];
//     const review = generateDisplay(state);
//     state.step = 'FINALIZE';
//     bot.sendMessage(chatId, `✅ **REVIEW / ክለሳ:**\n\n${review}\n\nIs this correct? / ትክክል ነው? (Yes/No)`);
// }

// // Helper to format the display text
// function generateDisplay(data) {
//     return `
// 📋 **RESUME SUMMARY / የሲቪ ማጠቃለያ**
// ━━━━━━━━━━━━━━━━━━━━
// 👤 **NAME:** ${data.name || '---'}
// 💼 **ROLE:** ${data.role || '---'}

// 🛠 **SKILLS / ክህሎቶች:**
// ${data.skills ? data.skills.split(',').map(s => `• ${s.trim()}`).join('\n') : '---'}

// 🏢 **EXPERIENCE / የስራ ልምድ:**
// ${data.experience || '---'}
// ━━━━━━━━━━━━━━━━━━━━`;
// }








// require('dotenv').config();
// const TelegramBot = require('node-telegram-bot-api');
// const Tesseract = require('tesseract.js');
// const nlp = require('compromise');

// const token = process.env.CV_BOT_TOKEN;
// const bot = new TelegramBot(token, { polling: true });

// // State storage
// const userStates = {};

// console.log("--- CV BUILDER: FINAL STICKY MENU VERSION ---");

// // --- HELPER: SEND WITH MENU ---
// function sendWithMenu(chatId, threadId, text) {
//     return bot.sendMessage(chatId, text, {
//         message_thread_id: threadId,
//         parse_mode: 'Markdown',
//         reply_markup: {
//             keyboard: [
//                 [{ text: '📝 Start CV Builder / ሲቪ ማዘጋጃ ጀምር' }],
//                 [{ text: '❓ Help / እርዳታ' }]
//             ],
//             resize_keyboard: true,
//             one_time_keyboard: false,
//             selective: true // Shows only to the person interacting
//         }
//     });
// }

// // --- HELPER: REGULAR SEND ---
// function send(chatId, threadId, text, options = {}) {
//     return bot.sendMessage(chatId, text, {
//         ...options,
//         message_thread_id: threadId,
//         parse_mode: 'Markdown'
//     });
// }

// // --- MAIN BOT LOGIC ---
// bot.on('message', async (msg) => {
//     const chatId = msg.chat.id;
//     const threadId = msg.message_thread_id;
//     const text = msg.text;

//     if (!text && !msg.photo) return;

//     // 1. COMMANDS & MENU BUTTONS
//     if (text === '/start' || text === 'hi' || text === 'Hi') {
//         return sendWithMenu(chatId, threadId, 
//             "👋 Welcome! Use the menu below to start your CV generation.\n" +
//             "እንኳን ደህና መጡ! ሲቪዎን ለማዘጋጀት ከታች ያለውን ምርጫ ይጠቀሙ።");
//     }

//     if (text === '📝 Start CV Builder / ሲቪ ማዘጋጃ ጀምር') {
//         userStates[chatId] = { step: 'NAME' };
//         return send(chatId, threadId, "Great! Let's start.\n\nWhat is your **Full Name**?\nሙሉ ስምዎ ማን ነው?");
//     }

//     if (text === '❓ Help / እርዳታ') {
//         return send(chatId, threadId, "This bot helps you extract and summarize your experience from a photo or text.\nClick 'Start' to begin.");
//     }

//     // 2. PHOTO HANDLER
//     if (msg.photo && userStates[chatId]) {
//         const fileId = msg.photo[msg.photo.length - 1].file_id;
//         try {
//             send(chatId, threadId, "🧐 Reading & Summarizing... / እያነበብኩ ነው...");
//             const fileLink = await bot.getFileLink(fileId);
//             const { data: { text: rawExtracted } } = await Tesseract.recognize(fileLink, 'eng+amh');

//             if (rawExtracted.trim().length > 10) {
//                 const shortSummary = summarizeLocally(rawExtracted);
//                 userStates[chatId] = { ...userStates[chatId], tempExperience: shortSummary, step: 'CONFIRM_OCR' };
//                 return send(chatId, threadId, `${shortSummary}\n\nShould I use this? / በዚህ ልቀጥል? (Yes/No)`);
//             } else {
//                 return send(chatId, threadId, "❌ Could not read text. Please type it.");
//             }
//         } catch (e) {
//             return send(chatId, threadId, "⚠️ Error processing image.");
//         }
//     }

//     // 3. STATE MACHINE
//     const state = userStates[chatId];
//     if (!state) return;

//     switch (state.step) {
//         case 'NAME':
//             state.name = text;
//             state.step = 'ROLE';
//             send(chatId, threadId, "What is your **Job Title**?\nየስራ መደብዎ ምንድን ነው?");
//             break;

//         case 'ROLE':
//             state.role = text;
//             state.step = 'SKILLS';
//             send(chatId, threadId, "List **3 Skills** (comma separated):\n3 ዋና ክህሎቶችዎን ይጥቀሱ:");
//             break;

//         case 'SKILLS':
//             state.skills = text;
//             state.step = 'EXPERIENCE';
//             send(chatId, threadId, "Describe your **Experience** (or send a photo of your CV):");
//             break;

//         case 'EXPERIENCE':
//             state.experience = text;
//             finalizeCV(chatId, threadId);
//             break;

//         case 'CONFIRM_OCR':
//             if (text.toLowerCase() === 'yes' || text === 'አዎ') {
//                 state.experience = state.tempExperience;
//                 finalizeCV(chatId, threadId);
//             } else {
//                 state.step = 'EXPERIENCE';
//                 send(chatId, threadId, "Okay, please type your experience manually:");
//             }
//             break;

//         case 'FINALIZE':
//             if (text.toLowerCase() === 'yes' || text === 'አዎ') {
//                 send(chatId, threadId, "🌟 **FINAL CV SUMMARY:**\n" + generateDisplay(state));
//                 send(chatId, threadId, "👆 Copy & Forward this to @Registration_Bot.");
//                 delete userStates[chatId];
//             }
//             break;
//     }
// });

// // --- HELPERS ---
// function finalizeCV(chatId, threadId) {
//     const state = userStates[chatId];
//     const review = generateDisplay(state);
//     state.step = 'FINALIZE';
//     send(chatId, threadId, `✅ **REVIEW:**\n\n${review}\n\nIs this correct? (Yes/No)`);
// }

// function generateDisplay(data) {
//     return `
// 📋 **RESUME SUMMARY**
// ━━━━━━━━━━━━━━━━━━━━
// 👤 **NAME:** ${data.name || '---'}
// 💼 **ROLE:** ${data.role || '---'}
// 🛠 **SKILLS:** ${data.skills || '---'}
// 🏢 **EXPERIENCE:** ${data.experience || '---'}
// ━━━━━━━━━━━━━━━━━━━━`;
// }

// function summarizeLocally(rawText) {
//     let cleanText = rawText.replace(/[^a-zA-Z0-9\s,.፡-፥]/g, ' ').replace(/\s+/g, ' ');
//     let doc = nlp(cleanText);
//     let orgs = doc.organizations().out('array');
//     let summary = "📍 **Experience Highlights:**\n";
//     if (orgs.length > 0) summary += `• Worked at: ${orgs.slice(0, 2).join(', ')}\n`;
//     if (summary.length < 60) summary = "📍 **Summary:**\n" + cleanText.substring(0, 150) + "...";
//     return summary;
// }






// Add express for health checks (keeping bot alive 24/7)
const express = require('express');
const app = express();

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const Tesseract = require('tesseract.js');
const nlp = require('compromise');

const token = process.env.CV_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// --- CONFIGURATION - UPDATE WITH YOUR REAL IDs ---
const CV_TOPIC_ID = 101; // Your actual CV Topic ID from the log
const ADMIN_GROUP_ID = -1003812062744; // Your actual Admin Group ID from the log
const ADMIN_USERNAME = "AZARIAS"; // Your username

const userStates = {};

console.log("--- CV BUILDER: AMHARIC + ADMIN HELP MODE ---");

// --- HEALTH CHECK ENDPOINTS FOR RENDER KEEP-ALIVE ---
app.get('/health', (req, res) => {
    res.status(200).send('Bot is alive and running 24/7!');
});

app.get('/', (req, res) => {
    res.status(200).send('CV Telegram Bot is running!');
});

// --- BILINGUAL TRANSLATIONS ---
const translations = {
    welcome: "👋 Welcome to CV Builder!\n\n👋 እንኳን ወደ ሲቪ ገንቢ በደህና መጡ!",
    nameRequest: "What is your **Full Name**?\nሙሉ ስምዎ ማን ነው?",
    roleRequest: "What is your **Job Title**?\nየስራ መደብዎ ምንድን ነው?",
    skillsRequest: "List your **top 3 Skills** (comma separated):\n**3 ዋና ክህሎቶችዎን** ይጥቀሱ (በነጠላ ሰረዝ ይለዩ):",
    experienceRequest: "Type your **Work Experience** or send a photo of your CV:\nየስራ **ልምድዎን** ይጥቀሱ ወይም የሲቪዎን ፎቶ ይላኩ:",
    readingCV: "🧐 Reading your CV... / ሲቪዎን እያነበብኩ ነው...",
    confirmOCR: "Should I use this extracted information?\nበዚህ የተወጣው መረጃ ልጠቀም? (Yes/አዎ / No/አይደለም)",
    reviewPrompt: "✅ **REVIEW YOUR CV / ሲቪዎን ይከልሱ:**\n\nIs this correct?\nይህ ትክክል ነው? (Yes/አዎ / No/አይደለም)",
    finalPrompt: "🌟 **FINAL CV SUMMARY / የመጨረሻ ሲቪ ማጠቃለያ:**\n\n",
    copyInstruction: "👆 **Copy this text** and forward it to @Registration_Bot\n\n👆 ይህን **ጽሁፍ ቅዳ** ለ @Registration_Bot ይላኩ።",
    helpSent: "✅ Your help request has been sent to admins. You can also message @",
    helpSentAm: "\n\n✅ ጥያቄዎ ለአስተዳዳሪዎች ተልኳል። በተጨማሪም በ @",
    adminAlert: "🆘 **HELP REQUESTED!**\n\n",
    wrongTopic: "⚠️ Please use the **CV Generation** topic to build your CV.\n\n⚠️ ሲቪ ለመስራት እባክዎ 'CV Generation' የሚለውን ክፍል ይጠቀሙ።",
    thankYou: "Thank you for using CV Builder! Start a new CV anytime with the button below.\n\nሲቪ ገንቢን ስለተጠቀሙ እናመሰግናለን! ከታች ባለው ቁልፍ በማንኛውም ጊዜ አዲስ ሲቪ መጀመር ይችላሉ።"
};

// --- HELPER: BILINGUAL MENU ---
function sendMainMenu(chatId, topicId = null) {
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
    
    if (topicId) {
        options.message_thread_id = topicId;
    }
    
    return bot.sendMessage(chatId, translations.welcome, options);
}

function send(chatId, threadId, text, options = {}) {
    const sendOptions = {
        ...options,
        parse_mode: 'Markdown'
    };
    
    if (threadId) {
        sendOptions.message_thread_id = threadId;
    }
    
    return bot.sendMessage(chatId, text, sendOptions);
}

// --- AUTO START BOT AND SEND MENU TO CV TOPIC ---
async function initializeBot() {
    try {
        console.log(`🚀 Starting bot...`);
        console.log(`📌 CV Topic ID: ${CV_TOPIC_ID}`);
        console.log(`📌 Admin Group ID: ${ADMIN_GROUP_ID}`);
        
        // Send welcome message with buttons to CV topic
        await sendMainMenu(CV_TOPIC_ID, CV_TOPIC_ID);
        console.log(`✅ Welcome menu sent to CV Topic ID: ${CV_TOPIC_ID}`);
        
        // Send startup notification to admin group
        await bot.sendMessage(ADMIN_GROUP_ID, 
            `🤖 **CV Builder Bot Started!**\n\n` +
            `✅ Bot is active and waiting for users\n` +
            `📊 CV Topic ID: ${CV_TOPIC_ID}\n` +
            `🆘 Help requests will appear here`
        );
        console.log(`✅ Admin notification sent`);
        
    } catch (error) {
        console.error("❌ Error initializing bot:", error);
        console.log("\n💡 Make sure the bot is admin in the group and topic!");
    }
}

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const threadId = msg.message_thread_id;
    const text = msg.text;
    const firstName = msg.from.first_name;
    const userId = msg.from.id;

    // Terminal log to help find IDs
    console.log(`\n📨 New message:`);
    console.log(`   Chat ID: ${chatId}`);
    console.log(`   Topic ID: ${threadId}`);
    console.log(`   From: ${firstName} (${userId})`);
    console.log(`   Text: ${text || 'photo or other content'}`);

    // --- HANDLE /start COMMAND ---
    if (text === '/start') {
        // If user is in the CV topic or main group
        if (threadId === CV_TOPIC_ID) {
            await sendMainMenu(chatId, threadId);
        } else if (chatId === ADMIN_GROUP_ID && !threadId) {
            // In main group without topic
            await bot.sendMessage(chatId, "👋 Welcome! Please use the CV Generation topic to build your CV.");
        } else {
            // Wrong topic or private chat
            await send(chatId, threadId, translations.wrongTopic);
        }
        return;
    }

    // --- ONLY PROCESS MESSAGES FROM CV TOPIC ---
    if (threadId !== CV_TOPIC_ID) {
        console.log(`⏭️ Ignoring message - not in CV topic (Topic ID: ${threadId}, Expected: ${CV_TOPIC_ID})`);
        // Send reminder to use correct topic
        if (text && !text.startsWith('/')) {
            await send(chatId, threadId, "⚠️ Please use the **CV Generation** topic to build your CV.\n\n⚠️ እባክዎ ሲቪ ለመስራት 'CV Generation' የሚለውን ክፍል ይጠቀሙ።");
        }
        return;
    }

    // --- MENU BUTTON HANDLERS (Only in CV topic) ---
    if (text === '📝 Start CV Builder') {
        userStates[userId] = { step: 'NAME' };
        await send(chatId, threadId, translations.nameRequest);
        return;
    }

    if (text === '❓ Request Help') {
        // Notify the user
        await send(chatId, threadId, `${translations.helpSent}${ADMIN_USERNAME}${translations.helpSentAm}${ADMIN_USERNAME}`);
        
        // Notify the Admin Group
        await bot.sendMessage(ADMIN_GROUP_ID, 
            `${translations.adminAlert}` +
            `👤 User: ${firstName}\n` +
            `🆔 User ID: ${userId}\n` +
            `📍 Topic: CV Generation\n` +
            `💬 Username: @${msg.from.username || 'N/A'}\n\n` +
            `Use: /reply ${userId} [your message] to respond`
        );
        return;
    }

    // --- PHOTO HANDLER FOR OCR ---
    if (msg.photo && userStates[userId]) {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        try {
            await send(chatId, threadId, translations.readingCV);
            const fileLink = await bot.getFileLink(fileId);
            const { data: { text: extracted } } = await Tesseract.recognize(fileLink, 'eng+amh');
            
            if (extracted && extracted.trim().length > 10) {
                const short = summarizeLocally(extracted);
                userStates[userId].tempExperience = short;
                userStates[userId].step = 'CONFIRM_OCR';
                await send(chatId, threadId, `${short}\n\n${translations.confirmOCR}`);
            } else {
                await send(chatId, threadId, "❌ Could not read text clearly. Please type manually.\n\n❌ ጽሁፉን በግልጽ ማንበብ አልቻልኩም። እባክዎ በጽሁፍ ያስገቡ።");
                userStates[userId].step = 'EXPERIENCE';
            }
        } catch (e) { 
            console.error("OCR Error:", e);
            await send(chatId, threadId, "❌ Error reading image. Please type manually.\n\n❌ ምስሉን በማንበብ ላይ ስህተት። እባክዎ በጽሁፍ ያስገቡ።");
            userStates[userId].step = 'EXPERIENCE';
        }
        return;
    }

    // --- CONVERSATION STEPS ---
    const state = userStates[userId];
    if (!state) {
        // User hasn't started CV building, show menu
        if (text && !text.startsWith('/')) {
            await sendMainMenu(chatId, threadId);
        }
        return;
    }

    if (!text) {
        await send(chatId, threadId, "Please respond with text.\n\nእባክዎ በጽሁፍ ይመልሱ።");
        return;
    }

    switch (state.step) {
        case 'NAME':
            if (text.length < 3) {
                await send(chatId, threadId, "Please enter a valid name (at least 3 characters).\n\nእባክዎ ትክክለኛ ስም ያስገቡ (ቢያንስ 3 ፊደላት)።");
                return;
            }
            state.fullName = text;
            state.step = 'ROLE';
            await send(chatId, threadId, translations.roleRequest);
            break;
            
        case 'ROLE':
            if (text.length < 2) {
                await send(chatId, threadId, "Please enter a valid job title.\n\nእባክዎ ትክክለኛ የስራ መደብ ያስገቡ።");
                return;
            }
            state.jobRole = text;
            state.step = 'SKILLS';
            await send(chatId, threadId, translations.skillsRequest);
            break;
            
        case 'SKILLS':
            if (text.length < 5) {
                await send(chatId, threadId, "Please list at least one skill.\n\nእባክዎ ቢያንስ አንድ ክህሎት ይጥቀሱ።");
                return;
            }
            state.skillsList = text;
            state.step = 'EXPERIENCE';
            await send(chatId, threadId, translations.experienceRequest);
            break;
            
        case 'EXPERIENCE':
            if (text.length < 10) {
                await send(chatId, threadId, "Please provide more details (at least 10 characters).\n\nእባክዎ ተጨማሪ መረጃ ይስጡ (ቢያንስ 10 ፊደላት)።");
                return;
            }
            state.workExperience = text;
            await finalizeCV(chatId, threadId, userId);
            break;
            
        case 'CONFIRM_OCR':
            if (text.toLowerCase().includes('yes') || text === 'አዎ') {
                state.workExperience = state.tempExperience;
                await finalizeCV(chatId, threadId, userId);
            } else if (text.toLowerCase().includes('no') || text === 'አይደለም') {
                state.step = 'EXPERIENCE';
                await send(chatId, threadId, "Please type your experience manually:\n\nእባክዎ የስራ ልምድዎን በጽሁፍ ያስገቡ:");
            } else {
                await send(chatId, threadId, `Please answer with "Yes/አዎ" or "No/አይደለም"\n\n${translations.confirmOCR}`);
            }
            break;
            
        case 'FINALIZE':
            if (text.toLowerCase().includes('yes') || text === 'አዎ') {
                const finalCV = generateDisplay(state);
                await send(chatId, threadId, `${translations.finalPrompt}\n${finalCV}`);
                await send(chatId, threadId, translations.copyInstruction);
                await send(chatId, threadId, translations.thankYou);
                await sendMainMenu(chatId, threadId); // Show menu again
                delete userStates[userId];
            } else if (text.toLowerCase().includes('no') || text === 'አይደለም') {
                await send(chatId, threadId, "Let's start over! Click the Start button below.\n\nእንደገና እንጀምር! ከታች ያለውን የጀምር ቁልፍ ይጫኑ።");
                delete userStates[userId];
                await sendMainMenu(chatId, threadId);
            } else {
                await send(chatId, threadId, `Please answer with "Yes/አዎ" or "No/አይደለም"\n\n${translations.reviewPrompt}\n${generateDisplay(state)}`);
            }
            break;
    }
});

async function finalizeCV(chatId, threadId, userId) {
    const state = userStates[userId];
    if (!state) return;
    
    state.step = 'FINALIZE';
    await send(chatId, threadId, `${translations.reviewPrompt}\n${generateDisplay(state)}`);
}

function generateDisplay(data) {
    return `👤 **NAME / ስም:** ${data.fullName}\n` +
           `💼 **ROLE / ሚና:** ${data.jobRole}\n` +
           `🛠 **SKILLS / ክህሎቶች:** ${data.skillsList}\n` +
           `🏢 **EXPERIENCE / ልምድ:** ${data.workExperience}`;
}

function summarizeLocally(rawText) {
    let clean = rawText.replace(/[^a-zA-Z0-9\s\u1200-\u137F.,፡-፥]/g, ' ')
                      .replace(/\s+/g, ' ')
                      .trim();
    
    let summary = clean.substring(0, 200);
    if (clean.length > 200) summary += "...";
    
    return "📋 **Extracted Summary / የተወጣው ማጠቃለያ:**\n" + summary;
}

// --- ADMIN REPLY COMMAND ---
bot.onText(/\/reply (\d+) (.+)/, async (msg, match) => {
    const adminChatId = msg.chat.id;
    const userId = parseInt(match[1]);
    const replyMessage = match[2];
    
    if (adminChatId !== ADMIN_GROUP_ID) {
        await bot.sendMessage(adminChatId, "❌ This command can only be used in the admin group.");
        return;
    }
    
    try {
        await bot.sendMessage(userId, 
            `📩 **Message from Admin:**\n\n${replyMessage}\n\n` +
            `You can continue your CV building by clicking the Start button below.`
        );
        await bot.sendMessage(adminChatId, `✅ Reply sent to user ${userId}`);
    } catch (error) {
        await bot.sendMessage(adminChatId, `❌ Failed to send message to user ${userId}. They may have blocked the bot.`);
    }
});

// --- SHOW MENU COMMAND ---
bot.onText(/\/menu/, async (msg) => {
    const chatId = msg.chat.id;
    const threadId = msg.message_thread_id;
    
    if (threadId === CV_TOPIC_ID) {
        await sendMainMenu(chatId, threadId);
        await bot.sendMessage(chatId, "✅ Menu sent!", { message_thread_id: threadId });
    } else {
        await bot.sendMessage(chatId, "❌ Please use this command in the CV Generation topic.");
    }
});

// --- DEBUG COMMAND TO CHECK TOPIC ID ---
bot.onText(/\/topicid/, async (msg) => {
    const threadId = msg.message_thread_id;
    await bot.sendMessage(msg.chat.id, 
        `📌 Current Topic ID: ${threadId || 'No topic (main group)'}\n\n` +
        `Expected CV Topic ID: ${CV_TOPIC_ID}\n\n` +
        `To fix buttons, make sure you're in the topic with ID ${CV_TOPIC_ID}`
    );
});

// --- START THE EXPRESS SERVER FOR HEALTH CHECKS ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Health check server running on port ${PORT}`);
    console.log(`✅ Bot is ready to receive messages!`);
});
