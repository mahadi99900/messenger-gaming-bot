// index.js

const login = require("fca-unofficial");
const fs = require('fs');
const path = require('path');

// --- কনফিগারেশন এবং মডিউল লোড ---
const config = require("./config.json");
const handleConversationalMessage = require("./messages.js");
const handleGeneralCommand = require("./commands.js");
const handleGameCommand = require("./game.js");
const handleDownloaderCommand = require("./downloader.js");

console.log("বট চালু হচ্ছে...");

// appstate.json ফাইল থেকে কুকিজ লোড করা
let appstate;
try {
    appstate = JSON.parse(fs.readFileSync(path.join(__dirname, config.APPSTATEPATH), 'utf8'));
} catch (e) {
    console.error(`ত্রুটি: ${config.APPSTATEPATH} ফাইলটি খুঁজে পাওয়া যায়নি বা ফরম্যাট সঠিক নয়।`);
    process.exit(1);
}

// --- বট লগইন এবং ইভেন্ট লিসেনার ---
login({ appState: appstate }, (err, api) => {
    if (err) {
        console.error("লগইন ব্যর্থ! আপনার appstate (কুকিজ) সম্ভবত এক্সপায়ার হয়ে গেছে বা ভুল আছে।", err);
        return;
    }

    console.log(`"${config.BOTNAME}" হিসেবে সফলভাবে লগইন হয়েছে! বার্তা শোনার জন্য প্রস্তুত...`);

    api.listenMqtt((err, event) => {
        if (err) {
            console.error("বার্তা শুনতে একটি ত্রুটি ঘটেছে:", err);
            return;
        }

        if (!event.body || (event.type !== "message" && event.type !== "message_reply") || event.senderID === api.getCurrentUserID()) {
            return;
        }

        try {
            // সাধারণ বার্তা হ্যান্ডেল করা
            const conversationalMessageHandled = handleConversationalMessage(api, event);
            if (conversationalMessageHandled) {
                return;
            }
            
            // কমান্ড প্রিফিক্স চেক করা
            if (event.body.startsWith(config.PREFIX)) {
                // প্রতিটি মডিউলকে কল করা হবে
                handleGeneralCommand(api, event, config);
                handleGameCommand(api, event, config);
                handleDownloaderCommand(api, event, config);
            }

        } catch (e) {
            console.error("বার্তা পরিচালনা করার সময় একটি গুরুতর ত্রুটি ঘটেছে:", e);
            api.sendMessage("একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।", event.threadID);
        }
    });
});