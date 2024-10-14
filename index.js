require('dotenv').config();
const { Client, Collection, IntentsBitField } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const express = require("express");
const axios = require("axios");
const url = require("url");
const mineflayer = require("mineflayer");
const pathfinder = require("mineflayer-pathfinder").pathfinder;
const Movements = require("mineflayer-pathfinder").Movements;

const PORT = 6969;
const app = express();
const users = require("./users.json")

app.post('/auth/:code', async (req, res) => {
    const { code } = req.params;
    if(code) {
        const formData = new url.URLSearchParams({
            client_id: process.env.ID,
            client_secret: process.env.SECRET,
            grant_type: 'authorization_code',
            code: code.toString(),
            redirect_uri: 'http://localhost:420/callback'
        });

        const output = await axios.post('https://discord.com/api/oauth2/token', 
            formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
        });

        if(output.data) {
            const access = output.data.access_token;

            const userinfo = await axios.get('https://discord.com/api/v10/users/@me', {
                headers: {
                    'Authorization': `Bearer ${access}`,
                },
            });
            res.status(200).send(users.includes(userinfo.data.id))
        }
    } else {
        res.status(420).send({message: 'code required'})
    }
});

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));

const client = new Client({
    intents: [
      IntentsBitField.Flags.Guilds,
      IntentsBitField.Flags.GuildMembers,
      IntentsBitField.Flags.GuildMessages,
      IntentsBitField.Flags.MessageContent,
    ],
  });
  

  client.commands = new Collection();

	const commandsPath = path.join(__dirname, 'commands/discord');
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}
  
  client.login(process.env.TOKEN);

  function createBot() {
    const bot = mineflayer.createBot({
      username: 'botf',
      auth: 'microsoft',
      host: '0b0t.org',
      version: '1.12.2'
    });

    function injectModules(bot) {
      const MODULES_DIRECTORY = path.join(__dirname, "modules");
      const modules = fs
        .readdirSync(MODULES_DIRECTORY)
        .filter((x) => x.endsWith(".js"))
        .map((pluginName) => require(path.join(MODULES_DIRECTORY, pluginName)));
  
      console.log(`Loaded \x1b[32m${modules.length}\x1b[0m bot modules`);
  
      bot.loadPlugins(modules);
    }

    bot.on("end", () => {
      console.log("\x1b[31mThe botf has disconnected. Reconnecting... \x1b[0m");
      setTimeout(createBot, 5000);
    });
    bot.on('error', console.log)

    bot.on('kicked', console.log)

    bot.once('spawn', async () => {
      console.log(`\x1b[32mBotf joined localhost\x1b[0m`)
      bot.loadPlugin(pathfinder)
      const defaultMovements = new Movements(bot)
      defaultMovements.allowParkour = false
      bot.pathfinder.setMovements(defaultMovements)
    })

    injectModules(bot);
    return bot;
  }
  
  const bot = createBot();