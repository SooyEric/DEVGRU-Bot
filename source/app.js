import {
  Client,
  GatewayIntentBits,
  Collection,
} from "discord.js";

import config from "./config/config.js";
import logger from "./utils/logger.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

const funcionandoCommand = await import("./commands/funcionando.js");
client.commands.set(
  funcionandoCommand.default.name,
  funcionandoCommand.default
);

client.once("ready", () => {
  logger.info(`Logged in as ${client.user.tag}`);
  logger.info("DEVGRU-Bot is online.");
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (!message.content.startsWith(config.prefix)) return;

  const args = message.content
    .slice(config.prefix.length)
    .trim()
    .split(/\s+/);

  const commandName = args.shift()?.toLowerCase();

  const command = client.commands.get(commandName);

  if (!command) return;

  try {
    await command.execute(message, args);
  } catch (error) {
    logger.error(`Error executing command ${commandName}:`, error);
  }
});

client.login(config.token);