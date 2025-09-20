// index.js

// --- Core Dependencies ---
const login = require("fca-unofficial");
const config = require("./config.js");

// --- Module Imports ---
// Bringing in all the separate modules for handling different types of messages.
const handleConversationalMessage = require("./messages.js");
const handleGeneralCommand = require("./commands.js");
const handleGameCommand = require("./game.js");
const handleDownloaderCommand = require("./downloader.js");

// --- Bot Initialization ---
console.log("Starting the bot...");

login({ appState: config.appstate }, (err, api) => {
    // This is the login function. It uses the appstate from config.js.
    
    if (err) {
        // If login fails, this block will run.
        console.error("Login failed! Your appstate might be expired or incorrect.", err);
        // We log the detailed error 'err' to the console to help find the exact problem.
        return; // Stop the script if login is unsuccessful.
    }

    console.log(`Login successful! Logged in as User ID: ${api.getCurrentUserID()}. Bot is now listening for messages...`);

    // --- Message Listener ---
    // api.listenMqtt is the core function that listens for new events (messages, reactions, etc.).
    api.listenMqtt((err, event) => {
        if (err) {
            // This handles errors with the connection to Facebook's servers.
            console.error("An error occurred while listening for messages:", err);
            return;
        }

        // --- Event Filtering ---
        // We check if the event is a valid message that the bot should process.
        // It ignores empty messages, events that aren't messages, and messages sent by the bot itself.
        if (!event.body || (event.type !== "message" && event.type !== "message_reply") || event.senderID === api.getCurrentUserID()) {
            return; // Ignore these events.
        }

        // --- Message Handling Logic ---
        try {
            console.log(`Received message from: ${event.senderID} in thread: ${event.threadID}`);

            // 1. First, check for conversational messages (like 'hi', 'hello').
            // If a conversational message is found and handled, we stop further processing.
            const conversationalMessageHandled = handleConversationalMessage(api, event);
            if (conversationalMessageHandled) {
                return;
            }

            // 2. If it's not a conversational message, check if it's a command.
            // A command must start with the prefix defined in config.js.
            if (event.body.startsWith(config.prefix)) {
                // If it's a command, pass it to all command handlers.
                // Each handler will check if the command belongs to it.
                handleGeneralCommand(api, event, config.prefix); // For help, etc.
                handleGameCommand(api, event, config.prefix);      // For hunt, profile, battle, etc.
                handleDownloaderCommand(api, event, config.prefix); // For dl, youtube, etc.
            }

        } catch (e) {
            // This is a safety net. If any of the handlers crash, this will catch the error.
            console.error("A critical error occurred while handling a message:", e);
            api.sendMessage("An unexpected error occurred. Please try again later.", event.threadID);
        }
    });
});