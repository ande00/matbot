const { Events } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client, bot) {
	console.log(`\x1b[32mDiscord ✅\x1b[0m`);
	},
};
