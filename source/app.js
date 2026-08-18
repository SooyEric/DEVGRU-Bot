import {
    Client,
    GatewayIntentBits,
    Collection,
    EmbedBuilder,
    Partials
} from "discord.js";

import http from "http";

import config from "./config/config.js";
import logger from "./utils/logger.js";
import permissions from "./config/permissions.js";

import {
    logCommandError
} from "./utils/commandLogger.js";

import {
    logBotUpdate
} from "./utils/updateLogger.js";

import {
    loadCommands
} from "./utils/commandLoader.js";

import {
    initializeBanTable,
    getBannedMember,
    markRestored
} from "./utils/banManager.js";

import {
    initializeAntiRaidTable,
    getAntiRaidMember,
    markAntiRaidRestored
} from "./utils/antiRaidManager.js";

import {
    initializeSquadronRegistry
} from "./utils/squadronRegistry.js";

import {
    initializeRobloxProfileTable,
    getRobloxProfile,
    getRobloxProfileByRobloxId,
    saveRobloxProfile
} from "./utils/robloxProfile.js";

import {
    getPendingProfileState,
    deletePendingProfileState,
    exchangeProfileRobloxCode,
    getProfileRobloxUser
} from "./utils/robloxProfileOAuth.js";

import {
    handleMessageDelete
} from "./utils/snipeManager.js";

import squadronRegistry from "./events/squadronRegistry.js";
import antiRaid from "./events/antiRaid.js";

import {
    initializeGiveaways
} from "./commands/giveaways.js";

import {
    TTSSystem
} from "./tts.js";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [
        Partials.Channel,
        Partials.Message
    ]
});

const tts =
    new TTSSystem(
        process.env.TTS_CHANNEL_ID
    );

const AUTO_ROLE_ID =
    "1373365890623602768";

client.on(
    "guildMemberAdd",
    async member => {
        try {
            await member.roles.add(
                AUTO_ROLE_ID
            );
        } catch (error) {
            logger.error(
                `Error asignando autorole a ${member.user.tag}:`,
                error
            );
        }
    }
);

client.commands =
    new Collection();

await initializeBanTable();
await initializeAntiRaidTable();
await initializeSquadronRegistry();
await initializeRobloxProfileTable();

squadronRegistry.register(client);
antiRaid.register(client);

await loadCommands(client);

await initializeGiveaways(
    client
);

client.on(
    "messageDelete",
    async message => {
        try {
            await handleMessageDelete(
                message
            );
        } catch (error) {
            logger.error(
                "Error procesando mensaje eliminado para Snipe:",
                error
            );
        }
    }
);

client.on(
    "messageCreate",
    async message => {
        try {
            if (
                message.author.bot ||
                !message.guild
            ) {
                return;
            }

            if (
                message.channel.id !==
                process.env.TTS_CHANNEL_ID
            ) {
                return;
            }

            await tts.handleMessage(
                message
            );

        } catch (error) {
            logger.error(
                "[TTS] Error:",
                error
            );
        }
    }
);

client.on(
    "voiceStateUpdate",
    async (
        oldState,
        newState
    ) => {
        try {
            tts.handleVoiceStateUpdate(
                oldState,
                newState,
                client
            );

        } catch (error) {
            logger.error(
                "[VOICE] Error:",
                error
            );
        }
    }
);

client.once(
    "clientReady",
    async () => {
        logger.info(
            `Logged in as ${client.user.tag}`
        );

        logger.info(
            "DEVGRU-Bot is online."
        );

        logger.info(
            `Commands loaded: ${
                client.commands.size > 0
                    ? [...client.commands.keys()].join(", ")
                    : "NONE"
            }`
        );

        await logBotUpdate(
            client
        );
    }
);

client.on(
    "interactionCreate",
    async interaction => {

        if (!interaction.isButton()) {
            return;
        }

        if (
            interaction.customId.startsWith(
                "restore_antiraid:"
            )
        ) {
            const userId =
                interaction.customId.split(":")[1];

            const allowedRoles =
                permissions[1];

            const hasPermission =
                allowedRoles?.some(
                    roleId =>
                        interaction.member?.roles.cache.has(
                            roleId
                        )
                );

            if (!hasPermission) {
                await interaction.reply({
                    content:
                        "❌ No tienes permiso para restaurar estos roles.",
                    ephemeral: true
                });

                return;
            }

            try {
                const antiRaidMember =
                    await getAntiRaidMember(
                        userId
                    );

                if (
                    !antiRaidMember ||
                    antiRaidMember.restored
                ) {
                    await interaction.reply({
                        content:
                            "❌ Este registro ya fue restaurado o no existe.",
                        ephemeral: true
                    });

                    return;
                }

                let member;

                try {
                    member =
                        await interaction.guild.members.fetch(
                            userId
                        );
                } catch {
                    await interaction.reply({
                        content:
                            "❌ El usuario no se encuentra actualmente en el servidor.",
                        ephemeral: true
                    });

                    return;
                }

                const rolesToRestore =
                    antiRaidMember.role_ids.filter(
                        roleId =>
                            roleId !==
                            interaction.guild.id
                    );

                const existingRoles =
                    rolesToRestore.filter(
                        roleId =>
                            interaction.guild.roles.cache.has(
                                roleId
                            )
                    );

                const safeRoles =
                    existingRoles.filter(
                        roleId => {
                            const role =
                                interaction.guild.roles.cache.get(
                                    roleId
                                );

                            return (
                                role &&
                                !role.managed &&
                                !role.permissions.has(
                                    "Administrator"
                                )
                            );
                        }
                    );

                if (
                    safeRoles.length > 0
                ) {
                    await member.roles.add(
                        safeRoles,
                        "Restauración de roles Anti-Raid"
                    );
                }

                await markAntiRaidRestored(
                    userId
                );

                await interaction.update({
                    components: []
                });

                const restorationLog =
                    new EmbedBuilder()
                        .setColor(
                            "#77DD77"
                        )
                        .setTitle(
                            "Roles Anti-Raid restaurados"
                        )
                        .setDescription(
                            `**Usuario:** ${member}\n` +
                            `**ID:** \`${member.id}\`\n` +
                            `**Restaurado por:** ${interaction.user}\n` +
                            `**Staff ID:** \`${interaction.user.id}\`\n\n` +
                            `**Roles restaurados:**\n` +
                            `${
                                safeRoles.length > 0
                                    ? safeRoles
                                        .map(
                                            roleId =>
                                                `<@&${roleId}>`
                                        )
                                        .join(" ")
                                    : "Ninguno"
                            }`
                        )
                        .setTimestamp();

                await interaction.channel.send({
                    embeds: [
                        restorationLog
                    ]
                });

            } catch (error) {
                logger.error(
                    "Error restoring Anti-Raid member:",
                    error
                );

                if (
                    !interaction.replied &&
                    !interaction.deferred
                ) {
                    await interaction.reply({
                        content:
                            "❌ No se pudieron restaurar los roles.",
                        ephemeral: true
                    });
                }
            }

            return;
        }

        if (
            interaction.customId.startsWith(
                "restore_ban:"
            )
        ) {
            const userId =
                interaction.customId.split(":")[1];

            const allowedRoles =
                permissions[1];

            const hasPermission =
                allowedRoles?.some(
                    roleId =>
                        interaction.member?.roles.cache.has(
                            roleId
                        )
                );

            if (!hasPermission) {
                await interaction.reply({
                    content:
                        "❌ No tienes permiso para restaurar este usuario.",
                    ephemeral: true
                });

                return;
            }

            try {
                const bannedMember =
                    await getBannedMember(
                        userId
                    );

                if (
                    !bannedMember ||
                    bannedMember.restored
                ) {
                    await interaction.reply({
                        content:
                            "❌ Este registro ya fue restaurado.",
                        ephemeral: true
                    });

                    return;
                }

                let member;

                try {
                    member =
                        await interaction.guild.members.fetch(
                            userId
                        );
                } catch {
                    await interaction.reply({
                        content:
                            "❌ El usuario todavía no ha regresado al servidor.",
                        ephemeral: true
                    });

                    return;
                }

                const currentRoles =
                    member.roles.cache.filter(
                        role =>
                            role.id !==
                            interaction.guild.id
                    );

                if (
                    currentRoles.size > 0
                ) {
                    await member.roles.remove(
                        currentRoles,
                        "Restauración de usuario baneado"
                    );
                }

                const rolesToRestore =
                    bannedMember.role_ids.filter(
                        roleId =>
                            roleId !==
                            interaction.guild.id
                    );

                if (
                    rolesToRestore.length > 0
                ) {
                    await member.roles.add(
                        rolesToRestore,
                        "Restauración de usuario baneado"
                    );
                }

                await member.setNickname(
                    bannedMember.nickname || null,
                    "Restauración de usuario baneado"
                );

                await markRestored(
                    userId
                );

                await interaction.update({
                    components: []
                });

                const restorationLog =
                    new EmbedBuilder()
                        .setColor(
                            "#77DD77"
                        )
                        .setTitle(
                            "Usuario restaurado"
                        )
                        .setDescription(
                            `**Usuario:** ${member}\n` +
                            `**ID:** \`${member.id}\`\n` +
                            `**Restaurado por:** ${interaction.user}\n` +
                            `**Staff ID:** \`${interaction.user.id}\`\n\n` +
                            `**Nickname restaurado:** ${
                                bannedMember.nickname ||
                                "Ninguno"
                            }\n\n` +
                            `**Roles restaurados:**\n` +
                            `${
                                rolesToRestore.length > 0
                                    ? rolesToRestore
                                        .map(
                                            id =>
                                                `<@&${id}>`
                                        )
                                        .join(" ")
                                    : "Ninguno"
                            }`
                        );

                await interaction.channel.send({
                    embeds: [
                        restorationLog
                    ]
                });

            } catch (error) {
                logger.error(
                    "Error restoring banned member:",
                    error
                );

                if (
                    !interaction.replied &&
                    !interaction.deferred
                ) {
                    await interaction.reply({
                        content:
                            "❌ No se pudo restaurar al usuario.",
                        ephemeral: true
                    });
                }
            }

            return;
        }
    }
);

client.on(
    "messageCreate",
    async message => {

        if (
            message.author.bot
        ) {
            return;
        }

        if (
            !message.guild
        ) {
            return;
        }

        const PREFIXES = [
            "-",
            ".",
            ",",
            "!",
            "?"
        ];

        const usedPrefix =
            PREFIXES.find(
                prefix =>
                    message.content.startsWith(prefix)
            );

        if (!usedPrefix) {
            return;
        }

        const args =
            message.content
                .slice(
                    usedPrefix.length
                )
                .trim()
                .split(/\s+/);

        const commandName =
            args.shift()?.toLowerCase();

        if (!commandName) {
            return;
        }

        const command =
            client.commands.get(
                commandName
            );

        if (!command) {
            return;
        }

        logger.info(
            `Command detected: ${commandName}`
        );

        const requiredPermission =
            command.permission ?? null;

        if (
            requiredPermission !== null
        ) {
            const userRoles =
                message.member?.roles.cache;

            if (!userRoles) {
                await logCommandError(
                    message,
                    commandName,
                    "No se pudieron obtener los roles del usuario."
                );

                return;
            }

            const allowedRoles =
                permissions[
                    requiredPermission
                ];

            const hasPermission =
                allowedRoles?.some(
                    roleId =>
                        userRoles.has(
                            roleId
                        )
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
            await command.execute(
                message,
                args
            );

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
    }
);

const PORT =
    process.env.PORT || 8080;

const server =
    http.createServer(
        async (
            req,
            res
        ) => {

            const url =
                new URL(
                    req.url,
                    `http://${req.headers.host}`
                );

if (
    url.pathname === "/internal/roblox/callback" &&
    req.method === "GET"
) {
    res.writeHead(
        200,
        {
            "Content-Type":
                "application/json; charset=utf-8"
        }
    );

    res.end(
        JSON.stringify({
            success: true,
            message:
                "DEVGRU-Bot Roblox callback endpoint is online."
        })
    );

    return;
}

if (
    url.pathname === "/internal/roblox/callback" &&
    req.method === "POST"
) {
    const authorization =
        req.headers.authorization;

    const expectedAuthorization =
        `Bearer ${process.env.ROBLOX_CALLBACK_API_KEY}`;

    if (
        !process.env.ROBLOX_CALLBACK_API_KEY ||
        authorization !==
            expectedAuthorization
    ) {
        res.writeHead(
            401,
            {
                "Content-Type":
                    "application/json; charset=utf-8"
            }
        );

        res.end(
            JSON.stringify({
                success: false,
                error: "Unauthorized"
            })
        );

        return;
    }

    try {
        let body = "";

        for await (
            const chunk of req
        ) {
            body += chunk;
        }

        const data =
            JSON.parse(
                body
            );

        const code =
            data.code;

        const state =
            data.state;

        if (
            !code ||
            !state
        ) {
            res.writeHead(
                400,
                {
                    "Content-Type":
                        "application/json; charset=utf-8"
                }
            );

            res.end(
                JSON.stringify({
                    success: false,
                    error:
                        "Missing code or state"
                })
            );

            return;
        }

        const pending =
            getPendingProfileState(
                state
            );

        if (
            !pending
        ) {
            res.writeHead(
                400,
                {
                    "Content-Type":
                        "application/json; charset=utf-8"
                }
            );

            res.end(
                JSON.stringify({
                    success: false,
                    error:
                        "Invalid or expired state"
                })
            );

            return;
        }

        const tokens =
            await exchangeProfileRobloxCode(
                code
            );

        const robloxUser =
            await getProfileRobloxUser(
                tokens.access_token
            );

        const authenticatedRobloxId =
            String(
                robloxUser.sub
            );

        const selectedRobloxId =
            String(
                pending.robloxId
            );

        if (
            authenticatedRobloxId !==
            selectedRobloxId
        ) {
            deletePendingProfileState(
                state
            );

            const channel =
                await client.channels.fetch(
                    pending.channelId
                );

            const message =
                await channel.messages.fetch(
                    pending.messageId
                );

            await message.edit({
                embeds: [
                    new EmbedBuilder()
                        .setColor(
                            "#ff4d4d"
                        )
                        .setTitle(
                            "Cuenta incorrecta"
                        )
                        .setDescription(
                            "La cuenta de Roblox con la que autorizaste no coincide con la cuenta que seleccionaste anteriormente.\n\n" +
                            "Vuelve a intentarlo utilizando **Verificar**."
                        )
                ],
                components: []
            });

            res.writeHead(
                400,
                {
                    "Content-Type":
                        "application/json; charset=utf-8"
                }
            );

            res.end(
                JSON.stringify({
                    success: false,
                    error:
                        "Roblox account mismatch"
                })
            );

            return;
        }

        const existingDiscordProfile =
            await getRobloxProfile(
                pending.userId
            );

        const existingRobloxProfile =
            await getRobloxProfileByRobloxId(
                authenticatedRobloxId
            );

        if (
            existingRobloxProfile &&
            existingRobloxProfile.discord_id !==
                pending.userId
        ) {
            deletePendingProfileState(
                state
            );

            const channel =
                await client.channels.fetch(
                    pending.channelId
                );

            const message =
                await channel.messages.fetch(
                    pending.messageId
                );

            await message.edit({
                embeds: [
                    new EmbedBuilder()
                        .setColor(
                            "#ff4d4d"
                        )
                        .setTitle(
                            "Cuenta ya vinculada"
                        )
                        .setDescription(
                            "Esta cuenta de Roblox ya está vinculada a otra cuenta de Discord."
                        )
                ],
                components: []
            });

            res.writeHead(
                409,
                {
                    "Content-Type":
                        "application/json; charset=utf-8"
                }
            );

            res.end(
                JSON.stringify({
                    success: false,
                    error:
                        "Roblox account already linked"
                })
            );

            return;
        }

        if (
            existingDiscordProfile &&
            existingDiscordProfile.roblox_id !==
                authenticatedRobloxId
        ) {
            deletePendingProfileState(
                state
            );

            const channel =
                await client.channels.fetch(
                    pending.channelId
                );

            const message =
                await channel.messages.fetch(
                    pending.messageId
                );

            await message.edit({
                embeds: [
                    new EmbedBuilder()
                        .setColor(
                            "#ff4d4d"
                        )
                        .setTitle(
                            "Cuenta ya vinculada"
                        )
                        .setDescription(
                            "Tu cuenta de Discord ya tiene una cuenta de Roblox vinculada."
                        )
                ],
                components: []
            });

            res.writeHead(
                409,
                {
                    "Content-Type":
                        "application/json; charset=utf-8"
                }
            );

            res.end(
                JSON.stringify({
                    success: false,
                    error:
                        "Discord account already linked"
                })
            );

            return;
        }

        await saveRobloxProfile(
            pending.userId,
            authenticatedRobloxId,
            robloxUser.preferred_username ||
                pending.robloxUsername
        );

        deletePendingProfileState(
            state
        );

        const channel =
            await client.channels.fetch(
                pending.channelId
            );

        const message =
            await channel.messages.fetch(
                pending.messageId
            );

        const username =
            robloxUser.preferred_username ||
            pending.robloxUsername;

        const profileUrl =
            robloxUser.profile ||
            `https://www.roblox.com/users/${authenticatedRobloxId}/profile`;

        await message.edit({
            embeds: [
                new EmbedBuilder()
                    .setColor(
                        "#77DD77"
                    )
                    .setTitle(
                        "Cuenta de Roblox vinculada"
                    )
                    .setDescription(
                        "Tu cuenta de Roblox ha sido verificada y vinculada correctamente.\n\n" +
                        `**Cuenta:** [${username}](${profileUrl})\n\n` +
                        "La vinculación ha quedado guardada permanentemente en tu perfil de Discord."
                    )
            ],
            components: []
        });

        logger.info(
            `[ROBLOX OAUTH] Cuenta vinculada. Discord=${pending.userId} Roblox=${authenticatedRobloxId}`
        );

        res.writeHead(
            200,
            {
                "Content-Type":
                    "application/json; charset=utf-8"
            }
        );

        res.end(
            JSON.stringify({
                success: true
            })
        );

        return;

    } catch (error) {
        logger.error(
            "[ROBLOX OAUTH] Error procesando callback interno:",
            error
        );

        res.writeHead(
            500,
            {
                "Content-Type":
                    "application/json; charset=utf-8"
            }
        );

        res.end(
            JSON.stringify({
                success: false,
                error:
                    "Internal OAuth processing error"
            })
        );

        return;
    }
}

            if (
                url.pathname === "/"
            ) {
                res.writeHead(
                    200,
                    {
                        "Content-Type":
                            "text/plain; charset=utf-8"
                    }
                );

                res.end(
                    "DEVGRU-Bot online."
                );

                return;
            }

            res.writeHead(
                404,
                {
                    "Content-Type":
                        "text/plain; charset=utf-8"
                }
            );

            res.end(
                "Not Found"
            );
        }
    );

server.listen(
    PORT,
    "0.0.0.0",
    () => {
        logger.info(
            `HTTP server listening on port ${PORT}`
        );
    }
);

client.login(
    config.discord.token
);