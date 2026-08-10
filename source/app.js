import { Client, GatewayIntentBits, Collection, REST, Routes } from "discord.js";
import config from "./config/config.js";
import logger from "./utils/logger.js";
import permissions from "./config/permissions.js";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

client.once("clientReady", () => {
    logger.info(`Logged in as ${client.user.tag}`);
    logger.info("DEVGRU-Bot is online.");
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (!message.content.startsWith(config.discord.prefix)) return;

    const args = message.content
        .slice(config.discord.prefix.length)
        .trim()
        .split(/\s+/);

    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    const command = client.commands.get(commandName);

    if (!command) return;

    const requiredPermission = command.permission ?? null;

    if (requiredPermission !== null) {
        const userRoles = message.member?.roles.cache;

        if (!userRoles) return;

        const hasPermission = permissions[requiredPermission]?.some(
            roleId => userRoles.has(roleId)
        );

        if (!hasPermission) return;
    }

    try {
        await command.execute(message, args);
    } catch (error) {
        logger.error(`Error executing command ${commandName}:`, error);
    }
});

const rest = new REST({ version: "10" }).setToken(config.discord.token);

try {
    logger.info("Eliminando slash commands registrados...");

    await rest.put(
        Routes.applicationCommands(config.discord.clientId),
        { body: [] }
    );

    await rest.put(
        Routes.applicationGuildCommands(
            config.discord.clientId,
            process.env.GUILD_ID
        ),
        { body: [] }
    );

    logger.info("Slash commands eliminados correctamente.");
} catch (error) {
    logger.error("Error eliminando slash commands:", error);
}

client.login(config.discord.token);