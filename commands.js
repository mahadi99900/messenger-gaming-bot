// commands.js

module.exports = function handleCommand(api, event, prefix) {
    const message = event.body;

    if (!message.startsWith(prefix)) {
        return false; // Not a command, do nothing
    }

    const args = message.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === "help") {
        const helpMessage = `📜 **ব্যাটেল নেক্সাস বটের সকল কমান্ড:**

**--- 🎮 গেমিং কমান্ড ---**
• \`${prefix}profile\` - আপনার প্রোফাইল দেখুন (লেভেল, এক্সপি, কয়েন)।
• \`${prefix}hunt\` - নতুন প্রাণী শিকার করুন।
• \`${prefix}zoo\` - আপনার চিড়িয়াখানায় থাকা সকল প্রাণী দেখুন।
• \`${prefix}sell <animal_id>\` - নির্দিষ্ট প্রাণী বিক্রি করুন।
• \`${prefix}claim\` - নির্দিষ্ট সময় পর পর ফ্রি কয়েন সংগ্রহ করুন।
• \`${prefix}pray\` - আপনার ভাগ্য (Luck) বৃদ্ধি করুন।
• \`${prefix}battle\` - বটের সাথে যুদ্ধ করুন (PvE)।
• \`${prefix}battle @mention\` - অন্য খেলোয়াড়ের সাথে যুদ্ধ করুন (PvP)।
• \`${prefix}give @mention <amount>\` - অন্যকে কয়েন দিন।
• \`${prefix}slots <amount>\` - স্লট মেশিন খেলে ভাগ্য পরীক্ষা করুন।
• \`${prefix}leaderboard\` - সবচেয়ে ধনী খেলোয়াড়দের তালিকা দেখুন।

**--- 📥 ইউটিলিটি কমান্ড ---**
• \`${prefix}dl <video_url>\` - যেকোনো ওয়েবসাইট থেকে ভিডিও ডাউনলোড করুন।

প্রয়োজনীয় কমান্ডটি টাইপ করে পাঠিয়ে দিন!`;
        
        api.sendMessage(helpMessage, event.threadID, event.messageID);
        return true; // Command was handled
    }

    return false; // Command not recognized here
};