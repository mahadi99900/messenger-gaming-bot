const login = require("facebook-chat-api");
const config = require("./config");

// Importing all of our modules
const handleConversationalMessage = require("./messages.js");
const handleGeneralCommand = require("./commands.js");
const handleGameCommand = require("./game.js");
const handleDownloaderCommand = require("./downloader.js");

console.log("Starting bot...");

try {
    if (!config.appstate) {
        throw new Error("Appstate is missing in config.js. Please add your appstate.");
    }

    login({ appState: config.appstate }, (err, api) => {
        if (err) {
            console.error("Login failed! The appstate might be invalid or expired.", err);
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
            }
        });
    });

} catch (e) {
    console.error(`[ERROR] ${e.message}`);
}