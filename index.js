require("dotenv").config();
const {
  Client,
  Collection,
  IntentsBitField,
  EmbedBuilder,
  Events
} = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const axios = require("axios");
const url = require("url");
const mineflayer = require("mineflayer");
const pathfinder = require("mineflayer-pathfinder").pathfinder;
const Movements = require("mineflayer-pathfinder").Movements;
const m = require("./commands/minecraft/m")
const { sleep } = require("./util")

const PORT = 6969;
const app = express();
const users = require("./users.json");
const accounts = require("./accounts.json");

app.post("/auth/:code", async (req, res) => {
  const { code } = req.params;
  if (code) {
    const formData = new url.URLSearchParams({
      client_id: process.env.ID,
      client_secret: process.env.SECRET,
      grant_type: "authorization_code",
      code: code.toString(),
      redirect_uri: "http://localhost:420/api/auth/discord/redirect",
    });

    const output = await axios.post(
      "https://discord.com/api/oauth2/token",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (output.data) {
      const access = output.data.access_token;

      const userinfo = await axios.get(
        "https://discord.com/api/v10/users/@me",
        {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        }
      );
      res.status(200).send(users.includes(userinfo.data.id));
    }
  } else {
    res.status(420).send({ message: "code required" });
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

const commandsPath = path.join(__dirname, "commands/discord");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

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

async function log(msg, color) {
  const channel = await client.channels.fetch("1233011906063892491");
  const embed = new EmbedBuilder()
    .setDescription(msg)
    .setColor(color)
    .setTimestamp();
  channel.send({ embeds: [embed] });
}

function handler(bot) {
  bot.on("whisper", (username, message) => {
    const args = message.split(" ");
    const commandName = args[0].toLowerCase();
    if (commandName === "m" && accounts.includes(username)) {
      log(`New order from ${username}`, "Purple")
      m.execute(bot, message, username);
    }
  });

  bot.on("messagestr", async (message, messagePosition, jsonMsg, sender, verified) => {
    const channel = await client.channels.fetch("1298675034264436879");
    const regExp = /[a-zA-Z]/g.exec(message);
    const embed = new EmbedBuilder()
    .setDescription(message)
    .setColor(0x2B2D31)
    .setTimestamp();
    const incomingTP =
      /^Type \/tpy ([A-Za-z0-9_]+) to accept or \/tpn \1 to deny\.$/.exec(message);
    if (incomingTP) {
      log(incomingTP[1] + " wants to tp");
      const tp = ["znde", "vtul", "ezcs"]
      if (tp.includes(incomingTP[1])) {
        bot.chat(`/tpy ${incomingTP[1]}`);
      } else {
        bot.chat(`/tpn ${incomingTP[1]}`);
        bot.chat(`/w ${incomingTP[1]} kys`);
      }
    }
    if(regExp) {
      if(sender) embed.setAuthor({  iconURL: `https://mc-heads.net/head/${sender}` })
      channel.send({ embeds: [embed] });
    }
  });
}

async function createBot() {
  await sleep(1000)
  const bot = mineflayer.createBot({
    username: process.env.UNAME,
    password: process.env.PASS,
    auth: "microsoft",
    host: "0b0t.org",
    version: "1.12.2",
  });

  bot.on("end", () => {
    log("Disconnected", "Red");
    setTimeout(createBot, 5000);
  });
  bot.on('error', (e) => {log(e, "Red")})

  bot.on('kicked', () => log("Kicked", "Red"))

  bot.once('spawn', async () => {
    log("Spawned", "Green")
    bot.loadPlugin(pathfinder)
    const defaultMovements = new Movements(bot)
    defaultMovements.allowParkour = false
    bot.pathfinder.setMovements(defaultMovements)
    bot.loadPlugin(handler);
  })

  client.on(Events.MessageCreate, (message) => {
  if(message.channel.id == "1298687925361442867" && message.author.id == "619835593068904464") bot.chat(message.content)
})
  
  return bot;
}

const bot = createBot();
