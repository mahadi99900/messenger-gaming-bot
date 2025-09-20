// index.js

// --- Core Dependencies ---
const login = require("fca-unofficial");
const fs = require('fs'); // ফাইল সিস্টেম মডিউল
const path = require('path'); // পাথ মডিউল

// --- Bot Configuration ---
const BOT_PREFIX = "/";
const ADMIN_ID = "YOUR_FACEBOOK_USER_ID_HERE"; // এখানে আপনার আইডি দিন (ঐচ্ছিক)

// --- Module Imports ---
const handleConversationalMessage = require("./messages.js");
const handleGeneralCommand = require("./commands.js");
const handleGameCommand = require("./game.js");
const handleDownloaderCommand = require("./downloader.js");

// --- Bot Initialization ---
console.log("বট চালু হচ্ছে...");

// appstate.json ফাইল থেকে কুকিজ লোড করা
let appstate;
const appstatePath = path.join(__dirname, 'appstate.json');

if (fs.existsSync(appstatePath)) {
    try {
        appstate = JSON.parse(fs.readFileSync(appstatePath, 'utf8'));
    } catch (e) {
        console.error("ত্রুটি: appstate.json ফাইলটি সঠিকভাবে ফরম্যাট করা নেই।", e);
        process.exit(1);
    }
} else {
    console.error("ত্রুটি: appstate.json ফাইলটি খুঁজে পাওয়া যায়নি!");
    console.error("অনুগ্রহ করে প্রোজেক্ট ফোল্ডারে appstate.json নামে একটি ফাইল তৈরি করুন এবং আপনার কুকিজ পেস্ট করুন।");
    process.exit(1);
}

login({ appState: appstate }, (err, api) => {
    if (err) {
        console.error("লগইন ব্যর্থ! আপনার appstate (কুকিজ) সম্ভবত এক্সপায়ার হয়ে গেছে বা ভুল আছে।", err);
        return;
    }

    console.log(`সফলভাবে লগইন হয়েছে! বট আইডি: ${api.getCurrentUserID()}. বার্তা শোনার জন্য প্রস্তুত...`);

    api.listenMqtt((err, event) => {
        if (err) {
            console.error("বার্তা শুনতে একটি ত্রুটি ঘটেছে:", err);
            return;
        }

        if (!event.body || (event.type !== "message" && event.type !== "message_reply") || event.senderID === api.getCurrentUserID()) {
            return;
        }

        try {
            console.log(`বার্তা এসেছে: ${event.senderID} থেকে, থ্রেড: ${event.threadID}`);

            const conversationalMessageHandled = handleConversationalMessage(api, event);
            if (conversationalMessageHandled) {
                return;
            }

            if (event.body.startsWith(BOT_PREFIX)) {
                handleGeneralCommand(api, event, BOT_PREFIX);
                handleGameCommand(api, event, BOT_PREFIX);
                handleDownloaderCommand(api, event, BOT_PREFIX);
            }

        } catch (e) {
            console.error("বার্তা পরিচালনা করার সময় একটি গুরুতর ত্রুটি ঘটেছে:", e);
            api.sendMessage("একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।", event.threadID);
        }
    });
});