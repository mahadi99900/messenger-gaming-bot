// This is the main file of your bot. It connects all the modules together.

const login = require("facebook-chat-api");
const config = require("./config");

// We are importing the function from our other module files.
const handleConversationalMessage = require("./messages.js");
// We will add game and downloader modules later.
// const handleGameCommand = require("./game.js");
// const handleDownloaderCommand = require("./downloader.js");

console.log("Attempting to log in to Facebook...");

// This function starts the login process using credentials from config.js
login({ email: config.email, password: config.password, appState: config.appstate }, (err, api) => {
    // If there is an error during login, it will be printed here.
    if (err) {
        console.error("Login failed!");
        console.error(err);
        return; // Stop the script if login fails.
    }

    console.log("Login successful! Bot is now listening for messages...");

    // This function sets up the message listener.
    // It will be called every time a new event (like a message) happens.
    api.listenMqtt((err, event) => {
        if (err) {
            console.error("Listener error:", err);
            return;
        }

        // We only want to handle new messages.
        if (event.type === "message" || event.type === "message_reply") {
            
            // First, let's see if it's a simple conversational message (e.g., "hi", "hello")
            // The handleConversationalMessage function will return 'true' if it handled the message.
            const wasHandledByMessages = handleConversationalMessage(api, event);

            // If the message was not a simple greeting, we will check for other commands.
            if (!wasHandledByMessages) {
                // LATER: We will add logic here to check for game commands like /hunt
                // Example: if (event.body.startsWith(config.prefix + "hunt")) {
                //     handleGameCommand(api, event);
                // }

                // LATER: We will also add logic for downloader commands like /youtube
                // Example: if (event.body.startsWith(config.prefix + "youtube")) {
                //     handleDownloaderCommand(api, event);
                // }
            }
        }
    });
});