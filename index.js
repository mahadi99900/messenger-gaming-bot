const login = require("fca-unofficial");
const config = require("./config");

// আপনার সকল মডিউল এখানে নিয়ে আসা হলো
const handleConversationalMessage = require("./messages.js");
const handleGeneralCommand = require("./commands.js");
const handleGameCommand = require("./game.js");
const handleDownloaderCommand = require("./downloader.js");

console.log("বট চালু হচ্ছে...");

login({ appState: config.appstate }, (err, api) => {
    if (err) {
        console.error("লগইন ব্যর্থ হয়েছে! আপনার appstate মেয়াদোত্তীর্ণ বা ভুল হতে পারে।", err);
        return;
    }

    console.log("লগইন সফল হয়েছে! বট এখন বার্তা শোনার জন্য প্রস্তুত...");

    api.listenMqtt((err, event) => {
        if (err) {
            console.error("ত্রুটি:", err);
            return;
        }

        // অপ্রয়োজনীয় ইভেন্টগুলো বাদ দেওয়া হলো
        if (!event.body || (event.type !== "message" && event.type !== "message_reply") || event.senderID === api.getCurrentUserID()) {
            return;
        }

        try {
            // প্রথমে সাধারণ বার্তা চেক করা হচ্ছে (যেমন: hi, hello)
            if (handleConversationalMessage(api, event)) {
                return; // বার্তাটি 처리 হয়ে গেলে আর এগোনো হবে না
            }

            // এরপর কমান্ড চেক করা হচ্ছে
            if (event.body.startsWith(config.prefix)) {
                // সব কমান্ড হ্যান্ডলারকে পাঠানো হলো
                handleGeneralCommand(api, event, config.prefix);
                handleGameCommand(api, event, config.prefix);
                handleDownloaderCommand(api, event, config.prefix);
            }
        } catch (e) {
            console.error("বার্তা পরিচালনা করার সময় একটি ত্রুটি ঘটেছে:", e);
            api.sendMessage("একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।", event.threadID);
        }
    });
});