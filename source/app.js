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
    initializeSquadronRegistry
} from "./utils/squadronRegistry.js";

import {
    getPendingState,
    deletePendingState,
    exchangeRobloxCode,
    getRobloxUser
} from "./utils/robloxOAuth.js";

import {
    resumeRobloxApplication
} from "./commands/aplicar.js";

import squadronRegistry from "./events/squadronRegistry.js";
import antiRaid from "./events/antiRaid.js";

const client =
    new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.DirectMessages
        ],

        partials: [
            Partials.Channel
        ]
    });

client.commands =
    new Collection();

await initializeBanTable();

await initializeSquadronRegistry();

squadronRegistry.register(
    client
);

antiRaid.register(
    client
);

await loadCommands(
    client
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
                    ? [
                        ...client.commands.keys()
                    ].join(", ")
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

        /*
         * ========================================
         * RESTORE BAN
         * ========================================
         */

        if (
            interaction.customId.startsWith(
                "restore_ban:"
            )
        ) {

            const userId =
                interaction.customId
                    .split(":")[1];

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
                        currentRoles
                    );
                }

                for (
                    const roleId
                    of bannedMember.role_ids
                ) {

                    if (
                        roleId ===
                        interaction.guild.id
                    ) {
                        continue;
                    }

                    await member.roles.add(
                        roleId
                    );
                }

                await member.setNickname(
                    bannedMember.nickname ||
                    null
                );

                await markRestored(
                    userId
                );

                await interaction.update({
                    components: []
                });

                const restoredEmbed =
                    new EmbedBuilder()
                        .setColor(
                            "#ffaf1a"
                        )
                        .setTitle(
                            "Roles restaurados"
                        )
                        .setDescription(
                            `**Usuario:** ${member}\n` +
                            `**ID:** \`${member.id}\`\n` +
                            `**Ejecutado por:** ${interaction.user}\n\n` +
                            `**Nickname restaurado:** ${
                                bannedMember.nickname ||
                                "Ninguno"
                            }\n\n` +
                            `**Roles restaurados:**\n` +
                            `${
                                bannedMember.role_ids.length >
                                0
                                    ? bannedMember.role_ids
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
                        restoredEmbed
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

        /*
         * ========================================
         * APLICACIONES DEVGRU
         * ========================================
         */

        if (
            interaction.customId.startsWith(
                "application_confirm:"
            ) ||
            interaction.customId.startsWith(
                "application_reject:"
            )
        ) {

            /*
             * El ID del usuario está después
             * de los dos puntos.
             */

            const userId =
                interaction.customId
                    .split(":")[1];

            /*
             * PERMISOS
             */

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
                        "❌ No tienes permiso para revisar aplicaciones.",
                    ephemeral: true
                });

                return;
            }

            /*
             * Determinar si acepta o rechaza.
             */

            const accepted =
                interaction.customId.startsWith(
                    "application_confirm:"
                );

            try {

                /*
                 * Evitar que una aplicación
                 * ya revisada vuelva a procesarse.
                 */

                const currentEmbed =
                    interaction.message.embeds[0];

                if (
                    currentEmbed?.title ===
                        "Aplicación aceptada" ||
                    currentEmbed?.title ===
                        "Aplicación rechazada"
                ) {

                    await interaction.reply({
                        content:
                            "❌ Esta aplicación ya fue revisada.",
                        ephemeral: true
                    });

                    return;
                }

                /*
                 * Datos del solicitante.
                 */

                let applicant = null;

                try {

                    applicant =
                        await client.users.fetch(
                            userId
                        );

                } catch (error) {

                    logger.error(
                        `No se pudo encontrar al solicitante ${userId}:`,
                        error
                    );
                }

                /*
                 * ========================================
                 * ACEPTADA
                 * ========================================
                 */

                if (accepted) {

                    const acceptedEmbed =
                        new EmbedBuilder()
                            .setColor(
                                "#77DD77"
                            )
                            .setTitle(
                                "Aplicación aceptada"
                            )
                            .setDescription(
                                `**Discord:** <@${userId}>\n` +
                                `**Discord ID:** \`${userId}\`\n\n` +
                                `**Revisada por:** ${interaction.user}\n\n` +
                                "✅ **La aplicación ha sido aceptada.**"
                            );

                    /*
                     * Conserva la imagen original
                     * si existía.
                     */

                    if (
                        currentEmbed?.image?.url
                    ) {

                        acceptedEmbed.setImage(
                            currentEmbed.image.url
                        );
                    }

                    await interaction.update({
                        embeds: [
                            acceptedEmbed
                        ],
                        components: []
                    });

                    /*
                     * DM AL SOLICITANTE
                     */

                    if (applicant) {

                        await applicant.send({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(
                                        "#77DD77"
                                    )
                                    .setTitle(
                                        "Aplicación aceptada"
                                    )
                                    .setDescription(
                                        "✅ **Tu aplicación para DEVGRU ha sido aceptada.**\n\n" +
                                        "Felicidades. Un miembro del staff continuará contigo con los siguientes pasos."
                                    )
                            ]
                        }).catch(
                            error =>
                                logger.error(
                                    "No se pudo enviar el DM de aceptación:",
                                    error
                                )
                        );
                    }

                    return;
                }

                /*
                 * ========================================
                 * RECHAZADA
                 * ========================================
                 */

                const rejectedEmbed =
                    new EmbedBuilder()
                        .setColor(
                            "#FF6B6B"
                        )
                        .setTitle(
                            "Aplicación rechazada"
                        )
                        .setDescription(
                            `**Discord:** <@${userId}>\n` +
                            `**Discord ID:** \`${userId}\`\n\n` +
                            `**Revisada por:** ${interaction.user}\n\n` +
                            "❌ **La aplicación ha sido rechazada.**"
                        );

                /*
                 * Conserva la imagen original
                 * si existía.
                 */

                if (
                    currentEmbed?.image?.url
                ) {

                    rejectedEmbed.setImage(
                        currentEmbed.image.url
                    );
                }

                await interaction.update({
                    embeds: [
                        rejectedEmbed
                    ],
                    components: []
                });

                /*
                 * DM AL SOLICITANTE
                 */

                if (applicant) {

                    await applicant.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(
                                    "#FF6B6B"
                                )
                                .setTitle(
                                    "Aplicación rechazada"
                                )
                                .setDescription(
                                    "❌ **Tu aplicación para DEVGRU ha sido rechazada.**\n\n" +
                                    "Si consideras que se trata de un error, puedes contactar con un miembro del staff."
                                )
                        ]
                    }).catch(
                        error =>
                            logger.error(
                                "No se pudo enviar el DM de rechazo:",
                                error
                            )
                    );
                }

                return;

            } catch (error) {

                logger.error(
                    "Error procesando aplicación:",
                    error
                );

                if (
                    !interaction.replied &&
                    !interaction.deferred
                ) {

                    await interaction.reply({
                        content:
                            "❌ Ocurrió un error al procesar esta aplicación.",
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

        if (message.author.bot) {
            return;
        }

        /*
         * Los mensajes DM son utilizados
         * por el sistema de aplicaciones.
         */

        if (!message.guild) {
            return;
        }

        if (
            !message.content.startsWith(
                config.discord.prefix
            )
        ) {
            return;
        }

        const args =
            message.content
                .slice(
                    config.discord.prefix.length
                )
                .trim()
                .split(/\s+/);

        const commandName =
            args.shift()
                ?.toLowerCase();

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
            command.permission ??
            null;

        if (
            requiredPermission !==
            null
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

/*
 * ========================================
 * HTTP SERVER
 * ========================================
 *
 * Railway: Target Port 8080
 */

const PORT =
    process.env.PORT || 8080;

const server =
    http.createServer(
        async (req, res) => {

            const url =
                new URL(
                    req.url,
                    `http://${req.headers.host}`
                );

            /*
             * ROOT
             */

            if (
                url.pathname ===
                "/"
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

            /*
             * ========================================
             * ROBLOX OAUTH CALLBACK
             * ========================================
             */

            if (
                url.pathname ===
                "/roblox/callback"
            ) {

                const code =
                    url.searchParams.get(
                        "code"
                    );

                const state =
                    url.searchParams.get(
                        "state"
                    );

                const error =
                    url.searchParams.get(
                        "error"
                    );

                /*
                 * ROBLOX CANCELÓ / RECHAZÓ
                 */

                if (error) {

                    logger.error(
                        `Roblox OAuth error: ${error}`
                    );

                    res.writeHead(
                        400,
                        {
                            "Content-Type":
                                "text/plain; charset=utf-8"
                        }
                    );

                    res.end(
                        "La autorización de Roblox fue cancelada o rechazada."
                    );

                    return;
                }

                /*
                 * FALTAN DATOS
                 */

                if (
                    !code ||
                    !state
                ) {

                    res.writeHead(
                        400,
                        {
                            "Content-Type":
                                "text/plain; charset=utf-8"
                        }
                    );

                    res.end(
                        "No se recibió un código o estado válido."
                    );

                    return;
                }

                /*
                 * BUSCAR APPLICATION STATE
                 */

                const pending =
                    getPendingState(
                        state
                    );

                if (!pending) {

                    res.writeHead(
                        400,
                        {
                            "Content-Type":
                                "text/plain; charset=utf-8"
                        }
                    );

                    res.end(
                        "Esta autorización expiró o ya fue utilizada."
                    );

                    return;
                }

                try {

                    logger.info(
                        `Roblox OAuth callback recibido para Discord ID: ${pending.userId}`
                    );

                    /*
                     * CODE → ACCESS TOKEN
                     */

                    const tokenData =
                        await exchangeRobloxCode(
                            code
                        );

                    /*
                     * OBTENER DATOS DEL USUARIO
                     */

                    const robloxUser =
                        await getRobloxUser(
                            tokenData.access_token
                        );

                    /*
                     * EL STATE YA FUE UTILIZADO
                     */

                    deletePendingState(
                        state
                    );

                    logger.info(
                        `Roblox account verified: ${
                            robloxUser.preferred_username ||
                            robloxUser.name
                        } (${robloxUser.sub})`
                    );

                    /*
                     * CONTINUAR APLICACIÓN
                     */

                    const applicationContinued =
                        resumeRobloxApplication(
                            pending.userId,
                            robloxUser,
                            client
                        );

                    /*
                     * SI NO EXISTE APLICACIÓN ACTIVA
                     */

                    if (
                        !applicationContinued
                    ) {

                        logger.warn(
                            `No se encontró una aplicación activa para Discord ID: ${pending.userId}`
                        );

                        try {

                            const discordUser =
                                await client.users.fetch(
                                    pending.userId
                                );

                            await discordUser.send({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor(
                                            "#ffaf1a"
                                        )
                                        .setTitle(
                                            "Cuenta de Roblox verificada"
                                        )
                                        .setDescription(
                                            "✅ Tu cuenta de Roblox fue verificada correctamente.\n\n" +
                                            `**Usuario:** ${
                                                robloxUser.preferred_username ||
                                                robloxUser.name
                                            }\n` +
                                            `**ID:** \`${robloxUser.sub}\``
                                        )
                                ]
                            });

                        } catch (dmError) {

                            logger.error(
                                "No se pudo enviar el DM de Roblox:",
                                dmError
                            );
                        }
                    }

                    /*
                     * RESPUESTA DEL CALLBACK
                     */

                    res.writeHead(
                        200,
                        {
                            "Content-Type":
                                "text/html; charset=utf-8"
                        }
                    );

                    res.end(`
                        <!DOCTYPE html>
                        <html lang="es">

                        <head>
                            <meta charset="UTF-8">

                            <meta
                                name="viewport"
                                content="width=device-width, initial-scale=1.0"
                            >

                            <title>DEVGRU</title>
                        </head>

                        <body>

                            <h2>
                                ✅ Cuenta de Roblox verificada
                            </h2>

                            <p>
                                Puedes regresar a Discord.
                            </p>

                        </body>

                        </html>
                    `);

                } catch (error) {

                    logger.error(
                        "Error procesando Roblox OAuth:",
                        error
                    );

                    res.writeHead(
                        500,
                        {
                            "Content-Type":
                                "text/plain; charset=utf-8"
                        }
                    );

                    res.end(
                        "No se pudo verificar la cuenta de Roblox."
                    );
                }

                return;
            }

            /*
             * 404
             */

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