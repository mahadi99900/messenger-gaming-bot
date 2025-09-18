// game.js
const db = require("./database.js");

// --- Game Constants ---
const HUNT_COOLDOWN = 15; // 15 seconds
const PRAY_COOLDOWN = 60; // 1 minute
const CLAIM_COOLDOWN = 300; // 5 minutes
const CLAIM_AMOUNT = 1000;
const BATTLE_COIN_REWARD = 100;
const PLAYER_XP_FOR_WIN = 50;
const PLAYER_XP_FOR_LOSS = 10;

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

// --- Helper Functions ---
function calculateTotalPower(playerData) {
    if (!playerData || !playerData.zoo || playerData.zoo.length === 0) return 0;
    return playerData.zoo.reduce((total, animal) => total + (animal.power || 0), 0);
}

function calculateLevel(xp) {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// --- Main Command Handler ---
module.exports = function handleGameCommand(api, event, prefix) {
    const senderID = event.senderID;
    
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

        // --- COMMAND ROUTER ---
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
                if (currentTime - (playerData.last_hunt || 0) < HUNT_COOLDOWN) {
                    return api.sendMessage(`⏳ You are tired. Please wait.`, event.threadID, event.messageID);
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
                const huntMessage = `🏞️ You found a [${foundQuality}]-quality **${foundAnimalBase.name}** ${foundAnimalBase.icon}!\n\n💥 Power: ${finalPower}\n⭐ Gained 15 XP.`;
                api.sendMessage(huntMessage, event.threadID, event.messageID);

            } else if (command === "zoo") {
                if (playerData.zoo.length === 0) return api.sendMessage("Your zoo is empty!", event.threadID, event.messageID);
                const totalPower = calculateTotalPower(playerData);
                let zooMessage = `🐾 **${playerData.name}'s Zoo** 🐾\nTotal Power: ${totalPower}\n\n`;
                playerData.zoo.sort((a, b) => b.power - a.power);
                playerData.zoo.forEach(animal => {
                    zooMessage += `• ${animal.icon} ${animal.name} | Pwr: ${animal.power} | ID: ${animal.uid}\n`;
                });
                api.sendMessage(zooMessage, event.threadID);

            } else if (command === "sell") {
                if (args.length === 0) return api.sendMessage(`Usage: ${prefix}sell <animal_ID>`, event.threadID, event.messageID);
                const animalUID = args[0];
                const animalIndex = playerData.zoo.findIndex(a => a.uid === animalUID);
                if (animalIndex === -1) return api.sendMessage(`❌ No animal found with ID: ${animalUID}`, event.threadID, event.messageID);
                const animalToSell = playerData.zoo[animalIndex];
                const sellPrice = Math.floor(animalToSell.power / 2);
                playerData.coins += sellPrice;
                playerData.zoo.splice(animalIndex, 1);
                api.sendMessage(`✅ Sold ${animalToSell.icon} ${animalToSell.name} for ${sellPrice} coins.`, event.threadID, event.messageID);

            } else if (command === "claim") {
                const currentTime = Date.now() / 1000;
                if (currentTime - (playerData.last_claim || 0) < CLAIM_COOLDOWN) {
                    return api.sendMessage(`⏳ Please wait for the next claim.`, event.threadID, event.messageID);
                }
                playerData.coins += CLAIM_AMOUNT;
                playerData.last_claim = currentTime;
                api.sendMessage(`🎉 You claimed ${CLAIM_AMOUNT} coins!`, event.threadID, event.messageID);

            } else if (command === "pray") {
                const currentTime = Date.now() / 1000;
                if (currentTime - (playerData.last_pray || 0) < PRAY_COOLDOWN) {
                    return api.sendMessage(`🙏 You can pray once a minute.`, event.threadID, event.messageID);
                }
                playerData.luck = (playerData.luck || 1.0) + 0.1;
                playerData.last_pray = currentTime;
                api.sendMessage(`Your luck increased to ${playerData.luck.toFixed(2)}.`, event.threadID, event.messageID);

            } else if (command === "give") {
                const recipientID = Object.keys(event.mentions)[0];
                const amount = parseInt(args[1], 10);
                if (!recipientID || !amount || amount <= 0) return api.sendMessage(`Usage: ${prefix}give @mention <amount>`, event.threadID, event.messageID);
                if (playerData.coins < amount) return api.sendMessage("❌ Not enough coins.", event.threadID, event.messageID);
                const recipientData = data[recipientID];
                if (!recipientData) return api.sendMessage("❌ Player not found.", event.threadID, event.messageID);
                
                playerData.coins -= amount;
                recipientData.coins += amount;
                api.sendMessage(`✅ Sent ${amount} coins to ${recipientData.name}.`, event.threadID, event.messageID);
                
            } else if (command === "leaderboard") {
                const sortedPlayers = Object.values(data).sort((a, b) => b.coins - a.coins);
                let lbMessage = "🏆 **Richest Players Leaderboard** 🏆\n\n";
                sortedPlayers.slice(0, 10).forEach((p, i) => {
                    lbMessage += `${i + 1}. ${p.name} - ${p.coins} coins\n`;
                });
                api.sendMessage(lbMessage, event.threadID);
            
            } else if (command === "battle") {
                const opponentID = Object.keys(event.mentions)[0];
                if (opponentID) { // PvP
                    const opponentData = data[opponentID];
                    if (!opponentData) return api.sendMessage("This player hasn't started the game.", event.threadID, event.messageID);
                    if (playerData.coins < BATTLE_COIN_REWARD) return api.sendMessage(`You need ${BATTLE_COIN_REWARD} coins for a PvP battle.`, event.threadID, event.messageID);
                    
                    const playerPower = calculateTotalPower(playerData);
                    const opponentPower = calculateTotalPower(opponentData);
                    let resultMessage = `⚔️ **Battle Result** ⚔️\n\n${playerData.name}'s Power: ${playerPower}\n${opponentData.name}'s Power: ${opponentPower}\n\n`;
                    if (playerPower >= opponentPower) {
                        playerData.coins += BATTLE_COIN_REWARD; opponentData.coins -= BATTLE_COIN_REWARD;
                        playerData.xp += PLAYER_XP_FOR_WIN; opponentData.xp += PLAYER_XP_FOR_LOSS;
                        resultMessage += `🎉 **${playerData.name} wins!**`;
                    } else {
                        opponentData.coins += BATTLE_COIN_REWARD; playerData.coins -= BATTLE_COIN_REWARD;
                        opponentData.xp += PLAYER_XP_FOR_WIN; playerData.xp += PLAYER_XP_FOR_LOSS;
                        resultMessage += `🎉 **${opponentData.name} wins!**`;
                    }
                    api.sendMessage(resultMessage, event.threadID);
                } else { // PvE
                    const playerPower = calculateTotalPower(playerData);
                    if (playerPower === 0) return api.sendMessage("You have no animals to battle with!", event.threadID, event.messageID);
                    const botPower = Math.floor(playerPower * (Math.random() * (1.3 - 0.7) + 0.7));
                    let resultMessage = `⚔️ **Battle vs. Bot** ⚔️\n\nYour Power: ${playerPower}\nBot's Power: ${botPower}\n\n`;
                    if (playerPower >= botPower) {
                        playerData.xp += 25;
                        resultMessage += `🎉 **YOU WON!** You gained 25 XP.`;
                    } else {
                        resultMessage += `💔 **YOU LOST!** Try getting stronger!`;
                    }
                    api.sendMessage(resultMessage, event.threadID, event.messageID);
                }

            } else if (command === "slots" || command === "bet") {
                const amount = parseInt(args[0], 10);
                if (!amount || amount <= 0) return api.sendMessage(`Usage: ${prefix}${command} <amount>`, event.threadID, event.messageID);
                if (playerData.coins < amount) return api.sendMessage("❌ Not enough coins.", event.threadID, event.messageID);
                
                playerData.coins -= amount;
                const emojis = ['🍒', '🍊', '🍋', '🔔', '💎', '💰'];
                const results = [emojis[Math.floor(Math.random() * emojis.length)], emojis[Math.floor(Math.random() * emojis.length)], emojis[Math.floor(Math.random() * emojis.length)]];
                
                let winnings = 0;
                let outcomeMessage = "";

                if (results[0] === results[1] && results[1] === results[2]) {
                    winnings = amount * 10;
                    outcomeMessage = `🎊 JACKPOT! You won ${winnings} coins!`;
                } else if (results[0] === results[1] || results[1] === results[2]) {
                    winnings = amount * 2;
                    outcomeMessage = `🎉 Small Win! You won ${winnings} coins!`;
                } else {
                    outcomeMessage = "💔 You lost!";
                }

                if (winnings > 0) playerData.coins += winnings;

                api.sendMessage(`🎰 You bet ${amount}...\n| ${results.join(' | ')} |\n\n${outcomeMessage}`, event.threadID, event.messageID);
            }

            // Save data after any command that modifies player data
            await db.saveData(data);

        } catch (e) {
            console.error("An error occurred in command handler:", e);
            api.sendMessage("😥 Oops! Something went wrong.", event.threadID);
        }
    });
};
