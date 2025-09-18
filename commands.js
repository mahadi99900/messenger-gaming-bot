// commands.js

module.exports = function handleCommand(api, event, prefix) {
    const message = event.body;

    // First, check if the message is a command
    if (!message.startsWith(prefix)) {
        return false; // If not, do nothing
    }

    // Separate the command from its arguments
    const args = message.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Now, handle the '/help' command
    if (command === "help") {
        const helpMessage = `📜 **Here are the main commands for the Battle Nexus Bot:**

**Game Commands:**
• \`${prefix}hunt\` - To hunt for new animals.
• \`${prefix}zoo\` - To see your zoo.
• \`${prefix}profile\` - To see your profile.
• \`${prefix}battle @mention\` - To challenge someone to a battle.

**Utility Commands:**
• \`${prefix}youtube <video_link>\` - To download a YouTube video.
• \`${prefix}facebook <video_link>\` - To download a Facebook video.

Just type the command to use it!`;
        
        api.sendMessage(helpMessage, event.threadID, event.messageID);
        return true; // The command was handled
    }

    // We can add more commands like 'hunt', 'zoo' etc. here later.

    return false; // If the command is not recognized
};
