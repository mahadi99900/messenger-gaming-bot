// messages.js

module.exports = function handleConversationalMessage(api, event) {
    const message = event.body.toLowerCase();

    if (message === "hi" || message === "hello") {
        
        // The new, shorter welcome message
        const replyMessage = `👋 Hello! Welcome to the Battle Nexus Bot. 😊

To see all the features and commands, please type: /help`;

        // Sending the reply
        api.sendMessage(replyMessage, event.threadID, event.messageID);
        return true; // The message was handled
    }

    return false; // Not a greeting, so do nothing
};
