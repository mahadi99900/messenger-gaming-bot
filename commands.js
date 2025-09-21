// commands.js

module.exports = function handleGeneralCommand(api, event, config) {
    const message = event.body;
    const prefix = config.PREFIX; // config থেকে প্রিফিক্স নেওয়া হচ্ছে

    if (!message.startsWith(prefix)) {
        return; 
    }

    const args = message.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === "help") {
        const helpMessage = `📜 **ব্যাটেল নেক্সাস বটের সকল কমান্ড:**

**--- 🎮 গেমিং কমান্ড ---**
• \`${prefix}profile\` - আপনার প্রোফাইল দেখুন।
• \`${prefix}hunt\` - নতুন প্রাণী শিকার করুন।
• \`${prefix}zoo\` - আপনার চিড়িয়াখানা দেখুন।
• \`${prefix}sell <animal_id>\` - প্রাণী বিক্রি করুন।
• \`${prefix}claim\` - ফ্রি কয়েন সংগ্রহ করুন।
• \`${prefix}pray\` - আপনার ভাগ্য বৃদ্ধি করুন।
• \`${prefix}battle\` - বটের সাথে যুদ্ধ করুন (PvE)।
• \`${prefix}battle @mention\` - অন্য খেলোয়াড়ের সাথে যুদ্ধ করুন (PvP)।
• \`${prefix}give @mention <amount>\` - অন্যকে কয়েন দিন।
• \`${prefix}slots <amount>\` - স্লট মেশিন খেলুন।
• \`${prefix}leaderboard\` - লিডারবোর্ড দেখুন।

**--- 📥 ইউটিলিটি কমান্ড ---**
• \`${prefix}dl <video_url>\` - ভিডিও ডাউনলোড করুন।

প্রয়োজনীয় কমান্ডটি টাইপ করে পাঠিয়ে দিন!`;
        
        api.sendMessage(helpMessage, event.threadID, event.messageID);
        return;
    }
};