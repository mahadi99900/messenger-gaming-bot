const login = require("facebook-chat-api");
const fs = require("fs");
const path = require("path");
const config = require("./config");

// Importing all of our modules
const handleConversationalMessage = require("./messages.js");
const handleGeneralCommand = require("./commands.js");
const handleGameCommand = require("./game.js");
const handleDownloaderCommand = require("./downloader.js");

// Path to the appstate file
const appStatePath = path.resolve(__dirname, 'appstate.json');

console.log("Starting bot...");

// Main login function
function performLogin() {
    let credentials;
    // Check if appstate.json exists
    if (fs.existsSync(appStatePath)) {
        console.log("Found appstate.json. Trying to log in with cookies...");
        credentials = { appState: JSON.parse(fs.readFileSync(appStatePath, 'utf8')) };
    } else {
        console.log("No appstate.json found. Trying to log in with email/password...");
        credentials = { email: config.email, password: config.password };
    }

    login(credentials, (err, api) => {
        if (err) {
            // If login with appstate failed, try again with email/password
            if (credentials.appState) {
                console.error("Login with appstate failed. Deleting old appstate and trying with password.", err);
                fs.unlinkSync(appStatePath); // Delete the faulty appstate
                return performLogin(); // Retry the login process
            }
            
            // If login with email/password fails, it's a real error
            console.error("Login with email/password failed!", err);
            if (err.error === 'login-approval') {
                console.log("!!! IMPORTANT: Login approval needed. Please check your Facebook account for a notification and approve the login. Then, restart the bot.");
            }
            return;
        }

        // --- Login Successful ---
        console.log("Login successful! Bot is now listening for messages...");

        // Save the new appstate for future logins
        fs.writeFileSync(appStatePath, JSON.stringify(api.getAppState(), null, 2));
        console.log("New appstate.json has been saved for future sessions.");

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
}

// Start the whole process
performLogin();