// This file handles video downloading from various websites.

const fs = require('fs');
const path = require('path');
const ytDlpExec = require('yt-dlp-exec');

// A lock to prevent multiple simultaneous downloads, which can crash the bot.
let isDownloading = false;

module.exports = async function handleDownloaderCommand(api, event, prefix) {
    const message = event.body;
    if (!message.startsWith(prefix)) return;

    const args = message.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // We can use 'dl' or specific commands like 'youtube', 'facebook', etc.
    if (command === "dl" || command === "youtube" || command === "facebook") {
        if (isDownloading) {
            api.sendMessage("Another download is already in progress. Please wait.", event.threadID, event.messageID);
            return;
        }

        const url = args[0];
        if (!url) {
            api.sendMessage(`Usage: ${prefix}dl <video_url>`, event.threadID, event.messageID);
            return;
        }

        isDownloading = true;
        const replyMsg = await api.sendMessage("📥 Starting download, please wait...", event.threadID, event.messageID);
        
        const output_template = `${Date.now()}.%(ext)s`;
        let videoFilePath = '';

        try {
            console.log(`Downloading from URL: ${url}`);
            
            // Execute yt-dlp to download the video
            const res = await ytDlpExec(url, {
                output: output_template,
                format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                maxFilesize: '50m' // Limit download size to 50MB to avoid server crash
            });
            
            videoFilePath = path.join(__dirname, res.stdout.trim().split('\n').pop());
            console.log(`Downloaded successfully. File path: ${videoFilePath}`);
            
            await api.editMessage("✅ Download complete! Now uploading to you...", replyMsg.messageID);

            // Send the downloaded video as an attachment
            await api.sendMessage({
                body: "Here is your video!",
                attachment: fs.createReadStream(videoFilePath)
            }, event.threadID, event.messageID);

        } catch (error) {
            console.error("Download Error:", error);
            api.sendMessage(`❌ Sorry, an error occurred.\n\nError: ${error.message.split('\n')[1] || 'Unknown error'}`, event.threadID, event.messageID);
        
        } finally {
            // Clean up: delete the video file from the server after sending
            if (videoFilePath && fs.existsSync(videoFilePath)) {
                fs.unlinkSync(videoFilePath);
                console.log(`Cleaned up file: ${videoFilePath}`);
            }
            // Release the lock
            isDownloading = false;
            // Delete the "Downloading..." message
            if (replyMsg) {
                await api.unsendMessage(replyMsg.messageID);
            }
        }
    }
};
