const fs = require("node:fs");
const path = require("node:path");
const accounts = require("../accounts.json")

module.exports = (bot) => {
  const commandsPath = path.join(__dirname, "../commands/minecraft");
  const commands = fs
    .readdirSync(commandsPath)
    .filter((x) => x.endsWith(".js"))
  bot.on("whisper", (username, message) => {
    const args = message.split(" ");
    const commandName = args[0].toLowerCase();
	if (commands.includes(`${commandName}.js`)) {
	const filePath = path.join(commandsPath, commandName);
	const command = require(filePath);
      command.execute(bot, message, username)
	}
  });
  bot.on('messagestr', (msg) => {
    const incomingTP = /^Type \/tpy ([A-Za-z0-9_]+) to accept or \/tpn \1 to deny\.$/.exec(msg);
    if(incomingTP) {
      console.log(incomingTP[1]+ ' wants to tp');
      if(accounts.includes(incomingTP[1])) {bot.chat(`/tpy ${incomingTP[1]}`)} else {bot.chat(`/tpn ${incomingTP[1]}`); bot.chat(`/w ${incomingTP[1]} kys`)}
    }
  })
};
