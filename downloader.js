// downloader.js

const fs = require('fs');
const path = require('path');
const ytDlpExec = require('yt-dlp-exec');

let isDownloading = false;

module.exports = async function handleDownloaderCommand(api, event, config) {
    const message = event.body;
    const prefix = config.PREFIX; // config থেকে প্রিফিক্স নেওয়া হচ্ছে

    if (!message.startsWith(prefix)) return;

    const args = message.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === "dl" || command === "youtube" || command === "facebook") {
        if (isDownloading) {
            api.sendMessage("আরেকটি ডাউনলোড চলছে। অনুগ্রহ করে অপেক্ষা করুন।", event.threadID, event.messageID);
            return;
        }

        const url = args[0];
        if (!url) {
            api.sendMessage(`ব্যবহার: ${prefix}dl <video_url>`, event.threadID, event.messageID);
            return;
        }

        isDownloading = true;
        const replyMsg = await api.sendMessage("📥 ডাউনলোড শুরু হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...", event.threadID, event.messageID);
        
        const output_template = path.join(__dirname, `${Date.now()}.%(ext)s`);
        let videoFilePath = '';

        try {
            await ytDlpExec(url, {
                output: output_template,
                format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                maxFilesize: '50m'
            });

            // Find the downloaded file
            const files = fs.readdirSync(__dirname);
            const downloadedFile = files.find(file => file.startsWith(path.basename(output_template, '.%(ext)s')));
            
            if (!downloadedFile) {
                throw new Error("ডাউনলোড করা ফাইল খুঁজে পাওয়া যায়নি।");
            }
            videoFilePath = path.join(__dirname, downloadedFile);

            await api.editMessage("✅ ডাউনলোড সম্পন্ন! এখন আপলোড করা হচ্ছে...", replyMsg.messageID);

            await api.sendMessage({
                body: "আপনার ভিডিও!",
                attachment: fs.createReadStream(videoFilePath)
            }, event.threadID);

        } catch (error) {
            console.error("ডাউনলোড ত্রুটি:", error);
            api.sendMessage(`❌ দুঃখিত, একটি ত্রুটি ঘটেছে।`, event.threadID, event.messageID);
        
        } finally {
            if (videoFilePath && fs.existsSync(videoFilePath)) {
                fs.unlinkSync(videoFilePath);
            }
            isDownloading = false;
            if (replyMsg) {
                await api.unsendMessage(replyMsg.messageID);
            }
        }
    }
};