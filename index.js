// index.js

const login = require("facebook-chat-api");
const config = require("./config");

// Importing all of our modules
const handleConversationalMessage = require("./messages.js");
const handleGeneralCommand = require("./commands.js");
const handleGameCommand = require("./game.js");
const handleDownloaderCommand = require("./downloader.js");

console.log("Attempting to log in to Facebook...");

// Always use appstate for login to avoid issues like 2FA or blocks
login({ appState: config.appstate }, (err, api) => {
    if (err) {
        console.error("Login failed!");
        if (err.error === 'login-approval') {
            console.log("Login approval needed. Please check your Facebook account for a notification.");
        }
        return console.error(err);
    }

    console.log("Login successful! Bot is now listening for messages...");

    api.listenMqtt((err, event) => {
        if (err) {
            console.error("Listener error:", err);
            return;
        }

        // We only process normal messages and replies
        if (event.type !== "message" && event.type !== "message_reply") {
            return;
        }
        
        // Ignore messages sent by the bot itself to prevent infinite loops
        if (event.senderID === api.getCurrentUserID()) {
            return;
        }

        try {
            // Step 1: Handle conversational messages (like "hi", "hello")
            const wasHandledAsGreeting = handleConversationalMessage(api, event);
            if (wasHandledAsGreeting) return; // If it was a greeting, our job is done.

            // If it wasn't a greeting, check if the message is a command
            if (event.body && event.body.startsWith(config.prefix)) {
                
                // Step 2: Handle general commands like /help from commands.js
                handleGeneralCommand(api, event, config.prefix);
                
                // Step 3: Handle all game commands from game.js
                handleGameCommand(api, event, config.prefix);
                
                // Step 4: Handle all downloader commands from downloader.js
                handleDownloaderCommand(api, event, config.prefix);
            }
        } catch (e) {
            console.error("An error occurred while handling a message:", e);
            api.sendMessage("😥 দুঃখিত! আমার দিক থেকে একটি সমস্যা হয়েছে।", event.threadID);
        }
    });
});