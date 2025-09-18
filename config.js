// This file holds all the configuration and sensitive credentials for your bot.
// Fill in your details in the placeholder sections.

module.exports = {
    // --- LOGIN CREDENTIALS ---
    // You can use either email/password OR appstate (cookies).
    // Using appstate is highly recommended to avoid login issues and 2FA.

    // Option 1: Email and Password (less recommended)
    // Use a secondary, bot-specific Facebook account, NOT your main account.
    email: "YOUR_FACEBOOK_EMAIL_HERE",
    password: "YOUR_FACEBOOK_PASSWORD_HERE",

    // Option 2: Appstate (Recommended)
    // If you fill this in, the bot will ignore email and password.
    // Get the appstate (cookie) from your browser. It's a long block of JSON text.
    appstate: null,

    // --- BOT ADMIN ---
    // Your own Facebook User ID. The bot will recognize you as the admin
    // for special commands. You can find your ID from sites like lookup-id.com
    adminID: "YOUR_FACEBOOK_USER_ID_HERE",

    // --- BOT SETTINGS ---
    // The prefix the bot will use for commands.
    prefix: "/",
};