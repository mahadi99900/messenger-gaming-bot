// index.js

const login = require("facebook-chat-api");
const config = require("./config");

// Importing both of our modules
const handleConversationalMessage = require("./messages.js");
const handleCommand = require("./commands.js");

console.log("Attempting to log in to Facebook...");

login({ email: config.email, password: config.password, appState: config.appstate }, (err, api) => {
    if (err) {
        console.error("Login failed!");
        console.error(err);
        return;
    }

    console.log("Login successful! Bot is now listening for messages...");

    api.listenMqtt((err, event) => {
        if (err) {
            console.error("Listener error:", err);
            return;
        }

        if (event.type === "message" || event.type === "message_reply") {
            
            // First, try to handle it as a conversational message (hi/hello)
            const wasHandledByMessages = handleConversationalMessage(api, event);

            // If it was not a greeting, then check if it is a command (like /help)
            if (!wasHandledByMessages) {
                handleCommand(api, event, config.prefix);
            }
        }
    });
});