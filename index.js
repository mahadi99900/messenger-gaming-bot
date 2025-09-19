const login = require("facebook-chat-api");
const config = require("./config");

// Importing all of our modules
const handleConversationalMessage = require("./messages.js");
const handleGeneralCommand = require("./commands.js");
const handleGameCommand = require("./game.js");
const handleDownloaderCommand = require("./downloader.js");

function convertCookie(rawCookie) {
    const appState = [];
    const cookiePairs = rawCookie.trim().split(';');

    for (const pair of cookiePairs) {
        if (pair.includes('=')) {
            const [key, ...valueParts] = pair.trim().split('=');
            const value = valueParts.join('=');
            appState.push({
                key: key,
                value: value,
                domain: "facebook.com",
                path: "/",
                httpOnly: false,
                secure: true,
                expires: null
            });
        }
    }
    return appState;
}

console.log("Starting bot...");

try {
    if (!config.rawCookie || config.rawCookie.includes("আপনার কুকি স্ট্রিংটি এখানে পেস্ট করুন")) {
        throw new Error("Raw cookie string is missing or not updated in config.js.");
    }

    console.log("Converting raw cookie to appstate format...");
    const appState = convertCookie(config.rawCookie);
    const credentials = { appState: appState };

    login(credentials, (err, api) => {
        if (err) {
            console.error("Login failed! Please check if your cookie is valid and not expired.", err);
            return;
        }

        console.log("Login successful! Bot is now listening for messages...");

        api.listenMqtt((err, event) => {
            if (err) {
                console.error("Listener error:", err);
                return;
            }

            if (event.type !== "message" && event.type !== "message_reply") return;
            if (event.senderID === api.getCurrentUserID()) return;

            try {
                if (handleConversationalMessage(api, event)) return;

                if (event.body && event.body.startsWith(config.prefix)) {
                    handleGeneralCommand(api, event, config.prefix);
                    handleGameCommand(api, event, config.prefix);
                    handleDownloaderCommand(api, event, config.prefix);
                }
            } catch (e) {
                console.error("An error occurred while handling a message:", e);
                api.sendMessage("😥 Oops! Something went wrong on my end.", event.threadID);
            }
        });
    });

} catch (e) {
    console.error(`[ERROR] ${e.message}`);
}