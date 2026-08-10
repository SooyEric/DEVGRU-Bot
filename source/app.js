import { Client, GatewayIntentBits, Collection } from "discord.js";
import config from "./config/config.js";
import logger from "./utils/logger.js";
import permissions from "./config/permissions.js";
import { logCommandError } from "./utils/commandLogger.js";
import { logBotUpdate } from "./utils/updateLogger.js";
import { loadCommands } from "./utils/commandLoader.js";
import {
    initializeBanTable,
    getBannedMember,
    markRestored
} from "./utils/banManager.js";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

await initializeBanTable();
await loadCommands(client);

client.once("clientReady", async () => {
    logger.info(`Logged in as ${client.user.tag}`);
    logger.info("DEVGRU-Bot is online.");

    logger.info(
        `Commands loaded: ${
            client.commands.size > 0
                ? [...client.commands.keys()].join(", ")
                : "NONE"
        }`
    );

    await logBotUpdate(client);
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith("restore_ban:")) return;

    const userId = interaction.customId.split(":")[1];
    const allowedRoles = permissions[1];

    const hasPermission = allowedRoles?.some(
        roleId => interaction.member?.roles.cache.has(roleId)
    );

    if (!hasPermission) {
        await interaction.reply({
            content: "❌ No tienes permiso para restaurar este usuario.",
            ephemeral: true
        });
        return;
    }

    try {
        const bannedMember = await getBannedMember(userId);

        if (!bannedMember || bannedMember.restored) {
            await interaction.reply({
                content: "❌ Este registro ya fue restaurado.",
                ephemeral: true
            });
            return;
        }

        let member;

        try {
            member = await interaction.guild.members.fetch(userId);
        } catch {
            await interaction.reply({
                content: "❌ El usuario todavía no ha regresado al servidor.",
                ephemeral: true
            });
            return;
        }

        const rolesToRemove = member.roles.cache.filter(
            role => role.id !== interaction.guild.id
        );

        if (rolesToRemove.size > 0) {
            await member.roles.remove(rolesToRemove);
        }

        for (const roleId of bannedMember.role_ids) {
            try {
                await member.roles.add(roleId);
            } catch (error) {
                logger.error(
                    `No se pudo restaurar el rol ${roleId} de ${userId}:`,
                    error
                );
            }
        }

        await member.setNickname(bannedMember.nickname);
        await markRestored(userId);

        try {
            const logMessage = await interaction.channel.messages.fetch(
                bannedMember.log_message_id
            );

            await logMessage.edit({
                components: []
            });
        } catch (error) {
            logger.error("No se pudo actualizar el mensaje de restauración:", error);
        }

        await interaction.reply({
            content: "✅ Usuario restaurado correctamente.",
            ephemeral: true
        });

        await interaction.channel.send(
            `✅ Los roles y el nickname de ${member} fueron restaurados correctamente por ${interaction.user}.`
        );

    } catch (error) {
        logger.error("Error restoring banned member:", error);

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: "❌ No se pudo restaurar al usuario.",
                ephemeral: true
            });
        }
    }
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

    logger.info(`Command detected: ${commandName}`);

    const requiredPermission = command.permission ?? null;

    if (requiredPermission !== null) {
        const userRoles = message.member?.roles.cache;

        if (!userRoles) {
            await logCommandError(
                message,
                commandName,
                "No se pudieron obtener los roles del usuario."
            );
            return;
        }

        const allowedRoles = permissions[requiredPermission];

        const hasPermission = allowedRoles?.some(
            roleId => userRoles.has(roleId)
        );

        if (!hasPermission) {
            await logCommandError(
                message,
                commandName,
                `Permiso insuficiente. Se requiere nivel ${requiredPermission}.`
            );
            return;
        }
    }

    try {
        await command.execute(message, args);
    } catch (error) {
        logger.error(
            `Error executing command ${commandName}:`,
            error
        );

        await logCommandError(
            message,
            commandName,
            error?.message ||
                "Error desconocido al ejecutar el comando.",
            error
        );
    }
});

client.login(config.discord.token);