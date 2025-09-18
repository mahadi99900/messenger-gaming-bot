// This file acts as a simple JSON database manager with a lock to prevent race conditions.

const fs = require('fs');
const path = require('path');
const { Mutex } = require('async-mutex'); // Using a lock for safe file writing

const dbPath = path.join(__dirname, 'playerData.json');
const mutex = new Mutex();

// Function to load the database from the JSON file
function loadData() {
    if (fs.existsSync(dbPath)) {
        const jsonData = fs.readFileSync(dbPath, 'utf-8');
        if (jsonData.length === 0) { // Handle empty file case
            return {};
        }
        return JSON.parse(jsonData);
    }
    return {}; // If file doesn't exist, return empty object
}

// Async function to save the database safely
async function saveData(data) {
    const release = await mutex.acquire(); // Acquire lock before writing
    try {
        const jsonData = JSON.stringify(data, null, 4); // Pretty-print JSON
        fs.writeFileSync(dbPath, jsonData);
    } finally {
        release(); // ALWAYS release the lock
    }
}

// Async function to ensure a user has a complete profile
async function ensureUserData(userID, userName) {
    const data = loadData();
    
    // Check if the user ID already exists
    if (!data[userID]) {
        // If not, create a complete default profile for the new user
        data[userID] = {
            name: userName,
            level: 1,
            xp: 0,
            coins: 100,
            luck: 1.0,
            zoo: [],
            last_hunt: 0,
            last_claim: 0,
            last_pray: 0
        };
        
        // Save the updated data with the new user profile
        await saveData(data);
        console.log(`Created a new, complete profile for user: ${userName} (ID: ${userID})`);
    }
}

// Export the functions for other files to use
module.exports = {
    loadData,
    saveData,
    ensureUserData
};
