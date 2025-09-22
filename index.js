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
    console.log("সমাধান: অনুগ্রহ করে নিশ্চিত করুন যে appstate.json ফাইলটি সঠিক ফোল্ডারে আছে এবং এটি একটি বৈধ JSON অ্যারে।");
    process.exit(1);
}

// --- বট লগইন এবং ইভেন্ট লিসেনার ---
login({ appState: appstate }, (err, api) => {
    if (err) {
        if (err.error === 'login-approval') {
            console.error("লগইন ব্যর্থ! আপনার অ্যাকাউন্টে টু-ফ্যাক্টর অথেনটিকেশন চালু আছে। অনুগ্রহ করে টার্মিনালে কোড দিন।");
        } else {
            console.error("লগইন ব্যর্থ! আপনার appstate (কুকিজ) সম্ভবত এক্সপায়ার হয়ে গেছে বা ভুল আছে।", err);
        }
        return;
    }

    console.log(`"${config.BOTNAME}" হিসেবে সফলভাবে লগইন হয়েছে! বার্তা শোনার জন্য প্রস্তুত...`);

    api.listenMqtt((err, event) => {
        if (err) {
            console.error("বার্তা শুনতে একটি ত্রুটি ঘটেছে:", err);
            // কানেকশন সমস্যা হলে নিজে থেকে রিস্টার্ট করার চেষ্টা করতে পারে
            // তবে আপাতত শুধু লগ করা হচ্ছে
            return;
        }

        // ইভেন্ট ফিল্টারিং: শুধুমাত্র টেক্সট মেসেজ এবং নিজের মেসেজ নয়
        if (!event.body || (event.type !== "message" && event.type !== "message_reply") || event.senderID === api.getCurrentUserID()) {
            return;
        }

        try {
            // ১. সাধারণ বার্তা হ্যান্ডেল করা (যেমন: hi, hello)
            const conversationalMessageHandled = handleConversationalMessage(api, event);
            if (conversationalMessageHandled) {
                return; // যদি এটি একটি সাধারণ বার্তা হয়, তাহলে আর এগোনোর দরকার নেই
            }
            
            // ২. কমান্ড প্রিফিক্স চেক করা
            if (event.body.startsWith(config.PREFIX)) {
                // এখানে শুধুমাত্র কমান্ড মডিউলগুলোকেই কল করা হবে
                handleGeneralCommand(api, event, config);
                handleGameCommand(api, event, config);
                handleDownloaderCommand(api, event, config);
            }

        } catch (e) {
            console.error("বার্তা পরিচালনা করার সময় একটি গুরুতর ত্রুটি ঘটেছে:", e);
            api.sendMessage("একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। ডেভেলপার বিষয়টি খতিয়ে দেখছেন।", event.threadID);
        }
    });
});