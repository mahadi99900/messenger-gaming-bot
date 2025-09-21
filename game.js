// game.js
const db = require("./database.js");

const ANIMALS = [
    { name: 'Frog', icon: '🐸', base_power: 4 }, { name: 'Mouse', icon: '🐁', base_power: 5 },
    { name: 'Chicken', icon: '🐔', base_power: 6 }, { name: 'Rabbit', icon: '🐇', base_power: 8 },
    { name: 'Cat', icon: '🐈', base_power: 10 }, { name: 'Dog', icon: '🐕', base_power: 12 },
    { name: 'Fox', icon: '🦊', base_power: 15 }, { name: 'Horse', icon: '🐎', base_power: 18 },
    { name: 'Deer', icon: '🦌', base_power: 20 }, { name: 'Eagle', icon: '🦅', base_power: 22 },
    { name: 'Bear', icon: '🐻', base_power: 25 }, { name: 'Boar', icon: '🐗', base_power: 28 },
    { name: 'Wolf', icon: '🐺', base_power: 30 }, { name: 'Gorilla', icon: '🦍', base_power: 35 },
    { name: 'Leopard', icon: '🐆', base_power: 45 }, { name: 'Crocodile', icon: '🐊', base_power: 48 },
    { name: 'Lion', icon: '🦁', base_power: 50 }, { name: 'Shark', icon: '🦈', base_power: 52 },
    { name: 'Tiger', icon: '🐅', base_power: 55 }, { name: 'Elephant', icon: '🐘', base_power: 60 },
    { name: 'Rhino', icon: '🦏', base_power: 65 }, { name: 'Whale', icon: '🐋', base_power: 75 },
    { name: 'Unicorn', icon: '🦄', base_power: 80 }, { name: 'Phoenix', icon: '🔥', base_power: 90 },
    { name: 'Dragon', icon: '🐉', base_power: 100 },
];
const ANIMAL_QUALITIES = { 'F': 0.5, 'D': 0.8, 'C': 1.0, 'B': 1.2, 'A': 1.5, 'S': 2.0 };

function calculateTotalPower(playerData) {
    if (!playerData || !playerData.zoo || playerData.zoo.length === 0) return 0;
    return playerData.zoo.reduce((total, animal) => total + (animal.power || 0), 0);
}

function calculateLevel(xp) {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
}

module.exports = function handleGameCommand(api, event, config) {
    const senderID = event.senderID;
    const prefix = config.PREFIX; // config থেকে প্রিফিক্স নেওয়া হচ্ছে
    
    api.getUserInfo(senderID, async (err, ret) => {
        if (err) return console.error(err);
        const userName = ret[senderID].name;
        await db.ensureUserData(senderID, userName);

        const message = event.body;
        if (!message.startsWith(prefix)) return;

        const args = message.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        
        const data = db.loadData();
        const playerData = data[senderID];
        
        // config.json থেকে গেমের সেটিংস লোড করা
        const gameSettings = config.gameSettings;

        try {
            if (command === "profile") {
                const totalPower = calculateTotalPower(playerData);
                const level = calculateLevel(playerData.xp);
                const profileMessage = `👤 **Player Profile: ${playerData.name}**
🏅 Level: ${level} (XP: ${playerData.xp})
💰 Coins: ${playerData.coins}
🐾 Animals: ${playerData.zoo.length}
💥 Total Power: ${totalPower}
🍀 Luck: ${(playerData.luck || 1.0).toFixed(2)}`;
                api.sendMessage(profileMessage, event.threadID, event.messageID);

            } else if (command === "hunt") {
                const currentTime = Date.now() / 1000;
                if (currentTime - (playerData.last_hunt || 0) < gameSettings.huntCooldown) {
                    return api.sendMessage(`⏳ আপনি ক্লান্ত। অনুগ্রহ করে অপেক্ষা করুন।`, event.threadID, event.messageID);
                }
                const foundAnimalBase = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
                const luck = playerData.luck || 1.0;
                const weightedQualities = ['F', 'F', 'D', 'D', 'D', 'C', 'C', 'C', 'C', 'B', 'B', 'A'];
                if (luck > 1.2) weightedQualities.push('A', 'S');
                if (luck > 1.5) weightedQualities.push('S', 'S');
                const foundQuality = weightedQualities[Math.floor(Math.random() * weightedQualities.length)];
                const finalPower = Math.floor(foundAnimalBase.base_power * ANIMAL_QUALITIES[foundQuality]);
                const newAnimal = {
                    uid: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                    name: foundAnimalBase.name, icon: foundAnimalBase.icon,
                    quality: foundQuality, power: finalPower
                };
                playerData.zoo.push(newAnimal);
                playerData.last_hunt = currentTime;
                playerData.xp += 15;
                const huntMessage = `🏞️ আপনি একটি [${foundQuality}]-মানের **${foundAnimalBase.name}** ${foundAnimalBase.icon} খুঁজে পেয়েছেন!\n\n💥 শক্তি: ${finalPower}\n⭐ ১৫ এক্সপি অর্জিত হয়েছে।`;
                api.sendMessage(huntMessage, event.threadID, event.messageID);

            } else if (command === "zoo") {
                if (playerData.zoo.length === 0) return api.sendMessage("আপনার চিড়িয়াখানা খালি!", event.threadID, event.messageID);
                const totalPower = calculateTotalPower(playerData);
                let zooMessage = `🐾 **${playerData.name}-এর চিড়িয়াখানা** 🐾\nমোট শক্তি: ${totalPower}\n\n`;
                playerData.zoo.sort((a, b) => b.power - a.power);
                playerData.zoo.forEach(animal => {
                    zooMessage += `• ${animal.icon} ${animal.name} | শক্তি: ${animal.power} | আইডি: ${animal.uid}\n`;
                });
                api.sendMessage(zooMessage, event.threadID);

            } else if (command === "sell") {
                if (args.length === 0) return api.sendMessage(`ব্যবহার: ${prefix}sell <animal_ID>`, event.threadID, event.messageID);
                const animalUID = args[0];
                const animalIndex = playerData.zoo.findIndex(a => a.uid === animalUID);
                if (animalIndex === -1) return api.sendMessage(`❌ এই আইডি দিয়ে কোনো প্রাণী খুঁজে পাওয়া যায়নি: ${animalUID}`, event.threadID, event.messageID);
                const animalToSell = playerData.zoo[animalIndex];
                const sellPrice = Math.floor(animalToSell.power / 2);
                playerData.coins += sellPrice;
                playerData.zoo.splice(animalIndex, 1);
                api.sendMessage(`✅ ${animalToSell.icon} ${animalToSell.name} প্রাণীটি ${sellPrice} কয়েনের বিনিময়ে বিক্রি করা হয়েছে।`, event.threadID, event.messageID);

            } else if (command === "claim") {
                const currentTime = Date.now() / 1000;
                if (currentTime - (playerData.last_claim || 0) < gameSettings.claimCooldown) {
                    return api.sendMessage(`⏳ পরবর্তী ক্লেইমের জন্য অপেক্ষা করুন।`, event.threadID, event.messageID);
                }
                playerData.coins += gameSettings.claimAmount;
                playerData.last_claim = currentTime;
                api.sendMessage(`🎉 আপনি ${gameSettings.claimAmount} কয়েন সংগ্রহ করেছেন!`, event.threadID, event.messageID);

            } else if (command === "pray") {
                const currentTime = Date.now() / 1000;
                if (currentTime - (playerData.last_pray || 0) < gameSettings.prayCooldown) {
                    return api.sendMessage(`🙏 আপনি প্রতি মিনিটে একবার প্রার্থনা করতে পারবেন।`, event.threadID, event.messageID);
                }
                playerData.luck = (playerData.luck || 1.0) + 0.1;
                playerData.last_pray = currentTime;
                api.sendMessage(`আপনার ভাগ্য বেড়ে ${playerData.luck.toFixed(2)} হয়েছে।`, event.threadID, event.messageID);

            } else if (command === "give") {
                const recipientID = Object.keys(event.mentions)[0];
                const amount = parseInt(args[1], 10);
                if (!recipientID || !amount || amount <= 0) return api.sendMessage(`ব্যবহার: ${prefix}give @mention <amount>`, event.threadID, event.messageID);
                if (playerData.coins < amount) return api.sendMessage("❌ আপনার কাছে পর্যাপ্ত কয়েন নেই।", event.threadID, event.messageID);
                if (!data[recipientID]) return api.sendMessage("❌ এই খেলোয়াড়কে খুঁজে পাওয়া যায়নি।", event.threadID, event.messageID);
                const recipientData = data[recipientID];
                
                playerData.coins -= amount;
                recipientData.coins += amount;
                api.sendMessage(`✅ ${recipientData.name}-কে ${amount} কয়েন পাঠানো হয়েছে।`, event.threadID, event.messageID);
                
            } else if (command === "leaderboard") {
                const sortedPlayers = Object.values(data).sort((a, b) => b.coins - a.coins);
                let lbMessage = "🏆 **সবচেয়ে ধনী খেলোয়াড়দের তালিকা** 🏆\n\n";
                sortedPlayers.slice(0, 10).forEach((p, i) => {
                    lbMessage += `${i + 1}. ${p.name} - ${p.coins} কয়েন\n`;
                });
                api.sendMessage(lbMessage, event.threadID);
            
            } else if (command === "battle") {
                const opponentID = Object.keys(event.mentions)[0];
                if (opponentID) { 
                    if (!data[opponentID]) return api.sendMessage("এই খেলোয়াড় এখনও গেমটি শুরু করেনি।", event.threadID, event.messageID);
                    const opponentData = data[opponentID];
                    
                    if (playerData.coins < gameSettings.battleCoinRequirement) return api.sendMessage(`PvP যুদ্ধের জন্য আপনার ${gameSettings.battleCoinRequirement} কয়েন প্রয়োজন।`, event.threadID, event.messageID);
                    if (opponentData.coins < gameSettings.battleCoinRequirement) return api.sendMessage(`আপনার প্রতিপক্ষের কাছে PvP যুদ্ধের জন্য পর্যাপ্ত (${gameSettings.battleCoinRequirement}) কয়েন নেই।`, event.threadID, event.messageID);
                    
                    const playerPower = calculateTotalPower(playerData);
                    const opponentPower = calculateTotalPower(opponentData);
                    let resultMessage = `⚔️ **যুদ্ধের ফলাফল** ⚔️\n\n${playerData.name}-এর শক্তি: ${playerPower}\n${opponentData.name}-এর শক্তি: ${opponentPower}\n\n`;
                    
                    if (playerPower >= opponentPower) {
                        playerData.coins += gameSettings.battleCoinRequirement; opponentData.coins -= gameSettings.battleCoinRequirement;
                        playerData.xp += gameSettings.playerXpForWin; opponentData.xp += gameSettings.playerXpForLoss;
                        resultMessage += `🎉 **${playerData.name} বিজয়ী!**`;
                    } else {
                        opponentData.coins += gameSettings.battleCoinRequirement; playerData.coins -= gameSettings.battleCoinRequirement;
                        opponentData.xp += gameSettings.playerXpForWin; playerData.xp += gameSettings.playerXpForLoss;
                        resultMessage += `🎉 **${opponentData.name} বিজয়ী!**`;
                    }
                    api.sendMessage(resultMessage, event.threadID);

                } else { 
                    const playerPower = calculateTotalPower(playerData);
                    if (playerPower === 0) return api.sendMessage("যুদ্ধ করার জন্য আপনার কোনো প্রাণী নেই!", event.threadID, event.messageID);
                    const botPower = Math.floor(playerPower * (Math.random() * (1.3 - 0.7) + 0.7));
                    let resultMessage = `⚔️ **বটের সাথে যুদ্ধ** ⚔️\n\nআপনার শক্তি: ${playerPower}\nবটের শক্তি: ${botPower}\n\n`;
                    if (playerPower >= botPower) {
                        playerData.xp += gameSettings.pveXpForWin;
                        resultMessage += `🎉 **আপনি জিতেছেন!** আপনি ${gameSettings.pveXpForWin} এক্সপি পেয়েছেন।`;
                    } else {
                        resultMessage += `💔 **আপনি হেরে গেছেন!**`;
                    }
                    api.sendMessage(resultMessage, event.threadID, event.messageID);
                }

            } else if (command === "slots" || command === "bet") {
                const amount = parseInt(args[0], 10);
                if (!amount || amount <= 0) return api.sendMessage(`ব্যবহার: ${prefix}${command} <amount>`, event.threadID, event.messageID);
                if (playerData.coins < amount) return api.sendMessage("❌ আপনার কাছে পর্যাপ্ত কয়েন নেই।", event.threadID, event.messageID);
                
                playerData.coins -= amount;
                const emojis = ['🍒', '🍊', '🍋', '🔔', '💎', '💰'];
                const results = [emojis[Math.floor(Math.random() * emojis.length)], emojis[Math.floor(Math.random() * emojis.length)], emojis[Math.floor(Math.random() * emojis.length)]];
                
                let winnings = 0;
                let outcomeMessage = "";

                if (results[0] === results[1] && results[1] === results[2]) {
                    winnings = amount * 10;
                    outcomeMessage = `🎊 জ্যাকপট! আপনি ${winnings} কয়েন জিতেছেন!`;
                } else if (results[0] === results[1] || results[1] === results[2]) {
                    winnings = amount * 2;
                    outcomeMessage = `🎉 ছোট জয়! আপনি ${winnings} কয়েন জিতেছেন!`;
                } else {
                    outcomeMessage = "💔 আপনি হেরে গেছেন!";
                }

                if (winnings > 0) playerData.coins += winnings;

                api.sendMessage(`🎰 আপনি ${amount} বাজি ধরেছেন...\n| ${results.join(' | ')} |\n\n${outcomeMessage}`, event.threadID, event.messageID);
            }

            await db.saveData(data);

        } catch (e) {
            console.error("গেম কমান্ড হ্যান্ডলারে একটি সমস্যা হয়েছে:", e);
            api.sendMessage("😥 দুঃখিত! গেম কমান্ডে একটি সমস্যা হয়েছে।", event.threadID);
        }
    });
};