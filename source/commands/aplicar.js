import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} from "discord.js";

import {
    createRobloxAuthorization,
    hasGroupJoinRequest
} from "../utils/robloxOAuth.js";

const REQUIRED_ROLE =
    "1373365890623602768";

const APPLICATION_TIMEOUT =
    30 * 60 * 1000;

const COLOR =
    "#ffaf1a";

const GROUP_URL =
    process.env.ROBLOX_GROUP_URL;

const APPLICATION_LOG_CHANNEL_ID =
    process.env.APPLICATION_LOG_CHANNEL_ID;

const applications =
    new Map();

function embed(
    title,
    description,
    color = COLOR
) {
    return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description);
}

function timeoutError() {
    return new Error(
        "APPLICATION_TIMEOUT"
    );
}

async function waitForMessage(
    dm,
    userId,
    endTime,
    filterExtra = () => true
) {
    const remaining =
        endTime - Date.now();

    if (remaining <= 0) {
        throw timeoutError();
    }

    const collected =
        await dm.awaitMessages({
            filter: message =>
                message.author.id === userId &&
                !message.author.bot &&
                filterExtra(message),

            max: 1,
            time: remaining
        });

    if (collected.size === 0) {
        throw timeoutError();
    }

    return collected.first();
}

/*
 * ============================================================
 * SOLICITUD AL GRUPO DE ROBLOX
 * ============================================================
 */

async function waitForGroupRequest(
    dm,
    robloxUserId,
    endTime
) {
    if (!GROUP_URL) {
        throw new Error(
            "ROBLOX_GROUP_URL no está configurada."
        );
    }

    const groupMessage =
        await dm.send({
            embeds: [
                embed(
                    "Solicitud al grupo de Roblox",
                    "Antes de continuar debes solicitar unirte al grupo oficial de **DEVGRU**.\n\n" +
                    `[**Unirse al grupo de DEVGRU**](${GROUP_URL})\n\n` +
                    "Después de enviar la solicitud, vuelve a este DM.\n\n" +
                    "⏳ **Esperando confirmación…**"
                )
            ]
        });

    while (Date.now() < endTime) {
        try {
            const requested =
                await hasGroupJoinRequest(
                    robloxUserId
                );

            if (requested) {
                await groupMessage
                    .delete()
                    .catch(() => {});

                const confirmedMessage =
                    await dm.send({
                        embeds: [
                            embed(
                                "Solicitud confirmada",
                                "✅ Detectamos correctamente tu solicitud para unirte al grupo de **DEVGRU**.\n\n" +
                                "Continuemos con tu aplicación."
                            )
                        ]
                    });

                /*
                 * La confirmación también se conserva.
                 */

                return {
                    confirmedMessage
                };
            }

        } catch (error) {
            console.error(
                "Error comprobando solicitud de grupo de Roblox:",
                error
            );
        }

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    10000
                )
        );
    }

    throw timeoutError();
}

/*
 * ============================================================
 * REVISIÓN FINAL DEL USUARIO
 * ============================================================
 */

async function waitForConfirmation(
    dm,
    userId,
    endTime
) {
    const remaining =
        endTime - Date.now();

    if (remaining <= 0) {
        throw timeoutError();
    }

    const confirmButton =
        new ButtonBuilder()
            .setCustomId(
                `application_submit:${userId}`
            )
            .setLabel("Enviar")
            .setStyle(
                ButtonStyle.Success
            );

    const cancelButton =
        new ButtonBuilder()
            .setCustomId(
                `application_cancel:${userId}`
            )
            .setLabel("Cancelar")
            .setStyle(
                ButtonStyle.Danger
            );

    const row =
        new ActionRowBuilder()
            .addComponents(
                confirmButton,
                cancelButton
            );

    const confirmationMessage =
        await dm.send({
            embeds: [
                embed(
                    "Revisión de solicitud",
                    "Has completado todas las preguntas.\n\n" +
                    "Revisa que toda la información proporcionada sea correcta.\n\n" +
                    "Cuando estés listo, presiona **Enviar**."
                )
            ],
            components: [
                row
            ]
        });

    const interaction =
        await confirmationMessage
            .awaitMessageComponent({
                filter:
                    interaction =>
                        interaction.user.id ===
                        userId,

                time: remaining
            })
            .catch(
                () => null
            );

    if (!interaction) {
        throw timeoutError();
    }

    /*
     * CANCELAR
     */

    if (
        interaction.customId ===
        `application_cancel:${userId}`
    ) {
        await interaction.update({
            embeds: [
                embed(
                    "Solicitud cancelada",
                    "❌ Tu aplicación ha sido cancelada.",
                    "#ff6b6b"
                )
            ],
            components: []
        });

        return false;
    }

    /*
     * ENVIAR
     */

    await interaction.update({
        embeds: [
            embed(
                "Solicitud enviada",
                "✅ Tu solicitud fue enviada correctamente.\n\n" +
                "La información será revisada por un miembro del staff de **DEVGRU**.\n\n" +
                "Recibirás una respuesta cuando finalice la revisión.",
                "#77dd77"
            )
        ],
        components: []
    });

    return true;
}

/*
 * ============================================================
 * CONTINUAR APLICACIÓN DESPUÉS DE ROBLOX OAUTH
 * ============================================================
 */

async function continueApplication(
    application,
    robloxUser
) {
    const {
        dm,
        userId,
        endTime,
        robloxUsername
    } = application;

    if (Date.now() >= endTime) {
        applications.delete(userId);

        await dm.send({
            embeds: [
                embed(
                    "Solicitud cerrada",
                    "⏱️ Tu aplicación fue cerrada porque superó el límite de **30 minutos**."
                )
            ]
        }).catch(() => {});

        return;
    }

    application.robloxUser =
        robloxUser;

    try {

        /*
         * ====================================================
         * ELIMINAR MENSAJES DE VERIFICACIÓN
         * ====================================================
         */

        if (
            application.verificationMessage
        ) {
            await application
                .verificationMessage
                .delete()
                .catch(() => {});
        }

        if (
            application.authorizationMessage
        ) {
            await application
                .authorizationMessage
                .delete()
                .catch(() => {});
        }

        /*
         * ====================================================
         * CUENTA VERIFICADA
         * ====================================================
         */

        await dm.send({
            embeds: [
                embed(
                    "Cuenta verificada",
                    "✅ Tu cuenta de Roblox fue verificada correctamente.\n\n" +
                    `**Usuario:** ${
                        robloxUser.preferred_username ||
                        robloxUser.name
                    }\n` +
                    `**ID:** \`${robloxUser.sub}\`\n\n` +
                    "Continuemos con tu aplicación."
                )
            ]
        });

        /*
         * ====================================================
         * SOLICITUD AL GRUPO
         *
         * IMPORTANTE:
         * Esto ocurre ANTES de las preguntas restantes
         * y ANTES de los botones Enviar / Cancelar.
         * ====================================================
         */

        await waitForGroupRequest(
            dm,
            robloxUser.sub,
            endTime
        );

        /*
         * ====================================================
         * PREGUNTA 2
         * ====================================================
         */

        const sourceQuestion =
            await dm.send({
                embeds: [
                    embed(
                        "2. ¿Cómo encontraste el servidor?",
                        "Responde con el número correspondiente:\n\n" +
                        "**1.** Vanity — `discord.gg/devgru`\n" +
                        "**2.** Tag de SEALs\n" +
                        "**3.** Invitación de un usuario\n" +
                        "**4.** Promoción en otro servidor"
                    )
                ]
            });

        const sourceMessage =
            await waitForMessage(
                dm,
                userId,
                endTime,
                message =>
                    [
                        "1",
                        "2",
                        "3",
                        "4"
                    ].includes(
                        message.content.trim()
                    )
            );

        const source =
            sourceMessage.content.trim();

        await sourceQuestion
            .delete()
            .catch(() => {});

        let sourceText;

        /*
         * VANITY
         */

        if (source === "1") {
            sourceText =
                "Vanity — discord.gg/devgru";
        }

        /*
         * TAG DE SEALS
         */

        if (source === "2") {
            sourceText =
                "Tag de SEALs";
        }

        /*
         * INVITACIÓN
         */

        if (source === "3") {
            const invitedByQuestion =
                await dm.send({
                    embeds: [
                        embed(
                            "Usuario que te invitó",
                            "¿Cuál es el usuario de Discord de la persona que te invitó?"
                        )
                    ]
                });

            const invitedBy =
                await waitForMessage(
                    dm,
                    userId,
                    endTime
                );

            await invitedByQuestion
                .delete()
                .catch(() => {});

            sourceText =
                `Invitación de: ${invitedBy.content.trim()}`;
        }

        /*
         * PROMOCIÓN
         */

        if (source === "4") {
            const promotedInQuestion =
                await dm.send({
                    embeds: [
                        embed(
                            "Servidor de promoción",
                            "¿En qué servidor viste la promoción de DEVGRU?"
                        )
                    ]
                });

            const promotedIn =
                await waitForMessage(
                    dm,
                    userId,
                    endTime
                );

            await promotedInQuestion
                .delete()
                .catch(() => {});

            sourceText =
                `Promoción en: ${promotedIn.content.trim()}`;
        }

        application.discovery =
            sourceText;

        /*
         * ====================================================
         * PREGUNTA 3
         * ====================================================
         */

        const imageQuestion =
            await dm.send({
                embeds: [
                    embed(
                        "3. Servidores de Discord",
                        "Envía una **foto de tus servidores de Discord**.\n\n" +
                        "La imagen debe permitirnos comprobar los servidores en los que te encuentras.\n\n" +
                        "⚠️ Si las fotografías no son suficientemente claras, se te solicitará entrar a un **voice chat y compartir pantalla**."
                    )
                ]
            });

        const imageMessage =
            await waitForMessage(
                dm,
                userId,
                endTime,
                message =>
                    message.attachments.some(
                        attachment =>
                            attachment.contentType?.startsWith(
                                "image/"
                            )
                    )
            );

        const image =
            imageMessage.attachments.find(
                attachment =>
                    attachment.contentType?.startsWith(
                        "image/"
                    )
            );

        if (!image) {
            throw new Error(
                "No se encontró una imagen válida."
            );
        }

        application.discordImage =
            image.url;

        await imageQuestion
            .delete()
            .catch(() => {});

        /*
         * ====================================================
         * INFORMACIÓN RECIBIDA
         * ====================================================
         */

        await dm.send({
            embeds: [
                embed(
                    "Información recibida",
                    `**Roblox:** ${
                        robloxUsername
                    }\n` +
                    `**Encontró DEVGRU mediante:** ${
                        sourceText
                    }\n\n` +
                    "La fotografía de tus servidores fue recibida correctamente.\n\n" +
                    "Todos los datos necesarios fueron recopilados."
                )
            ]
        });

        /*
         * ====================================================
         * REVISIÓN FINAL
         * ====================================================
         */

        const submitted =
            await waitForConfirmation(
                dm,
                userId,
                endTime
            );

        if (!submitted) {
            applications.delete(
                userId
            );

            return;
        }

        /*
         * ====================================================
         * ENVIAR A LOGS
         * ====================================================
         */

        application.status =
            "ready_for_review";

        applications.delete(
            userId
        );

        await sendApplicationToLogs(
            application
        );

    } catch (error) {

        applications.delete(
            userId
        );

        if (
            error?.message ===
            "APPLICATION_TIMEOUT"
        ) {
            await dm.send({
                embeds: [
                    embed(
                        "Solicitud cerrada",
                        "⏱️ La aplicación fue cerrada porque no recibimos todas las respuestas dentro de los **30 minutos**."
                    )
                ]
            }).catch(() => {});

            return;
        }

        console.error(
            "Error continuando aplicación:",
            error
        );

        await dm.send({
            embeds: [
                embed(
                    "Error",
                    "❌ Ocurrió un error procesando tu aplicación.\n\n" +
                    "Contacta con un miembro del staff."
                )
            ]
        }).catch(() => {});
    }
}

/*
 * ============================================================
 * ENVIAR A CANAL DE LOGS
 * ============================================================
 */

async function sendApplicationToLogs(
    application
) {
    if (!APPLICATION_LOG_CHANNEL_ID) {
        console.error(
            "APPLICATION_LOG_CHANNEL_ID no está configurado."
        );

        return;
    }

    const channel =
        application.client.channels.cache.get(
            APPLICATION_LOG_CHANNEL_ID
        );

    if (!channel) {
        console.error(
            "No se encontró el canal de logs de aplicaciones."
        );

        return;
    }

    const roblox =
        application.robloxUser;

    const logEmbed =
        new EmbedBuilder()
            .setColor(
                COLOR
            )
            .setTitle(
                "Nueva aplicación — DEVGRU"
            )
            .setDescription(
                `**Discord:** <@${application.userId}>\n` +
                `**Discord ID:** \`${application.userId}\`\n\n` +
                `**Roblox:** ${
                    roblox.preferred_username ||
                    roblox.name
                }\n` +
                `**Roblox ID:** \`${roblox.sub}\`\n\n` +
                `**Encontró DEVGRU mediante:**\n${application.discovery}\n\n` +
                `**Estado:** Solicitud recibida — pendiente de revisión`
            );

    if (application.discordImage) {
        logEmbed.setImage(
            application.discordImage
        );
    }

    const acceptButton =
        new ButtonBuilder()
            .setCustomId(
                `application_accept:${application.userId}`
            )
            .setLabel(
                "Aceptar"
            )
            .setStyle(
                ButtonStyle.Success
            );

    const rejectButton =
        new ButtonBuilder()
            .setCustomId(
                `application_reject:${application.userId}`
            )
            .setLabel(
                "Rechazar"
            )
            .setStyle(
                ButtonStyle.Danger
            );

    const row =
        new ActionRowBuilder()
            .addComponents(
                acceptButton,
                rejectButton
            );

    await channel.send({
        embeds: [
            logEmbed
        ],
        components: [
            row
        ]
    });
}

/*
 * ============================================================
 * ROBLOX OAUTH CALLBACK
 * ============================================================
 */

export function resumeRobloxApplication(
    userId,
    robloxUser,
    client
) {
    const application =
        applications.get(
            userId
        );

    if (!application) {
        return false;
    }

    application.client =
        client;

    continueApplication(
        application,
        robloxUser
    );

    return true;
}

/*
 * ============================================================
 * COMANDO -APLICAR
 * ============================================================
 */

export default {
    name: "aplicar",
    permission: null,

    async execute(message) {

        if (
            !message.member?.roles.cache.has(
                REQUIRED_ROLE
            )
        ) {
            await message.react(
                "❌"
            );

            return;
        }

        if (
            applications.has(
                message.author.id
            )
        ) {
            await message.react(
                "❌"
            );

            return;
        }

        try {

            const dm =
                await message.author.createDM();

            const endTime =
                Date.now() +
                APPLICATION_TIMEOUT;

            const application = {
                userId:
                    message.author.id,

                dm,

                endTime,

                client:
                    message.client,

                robloxUsername:
                    null,

                robloxUser:
                    null,

                discovery:
                    null,

                discordImage:
                    null,

                verificationMessage:
                    null,

                authorizationMessage:
                    null
            };

            applications.set(
                message.author.id,
                application
            );

            /*
             * =================================================
             * MENSAJE INICIAL
             * SE QUEDA
             * =================================================
             */

            await dm.send({
                embeds: [
                    embed(
                        "Solicitud para DEVGRU",
                        "Comenzaremos tu aplicación para formar parte de **DEVGRU**.\n\n" +
                        "Responde cada pregunta directamente en este chat.\n\n" +
                        "⏱️ Tienes **30 minutos** para completar la aplicación."
                    )
                ]
            });

            /*
             * =================================================
             * PREGUNTA 1
             * =================================================
             */

            const robloxQuestion =
                await dm.send({
                    embeds: [
                        embed(
                            "1. Usuario de Roblox",
                            "¿Cuál es tu usuario de Roblox?\n\n" +
                            "Escribe únicamente tu **nombre de usuario de Roblox**."
                        )
                    ]
                });

            const collectedMessage =
                await waitForMessage(
                    dm,
                    message.author.id,
                    endTime
                );

            const robloxUsername =
                collectedMessage.content.trim();

            if (!robloxUsername) {
                throw timeoutError();
            }

            application.robloxUsername =
                robloxUsername;

            /*
             * Elimina la pregunta 1.
             */

            await robloxQuestion
                .delete()
                .catch(() => {});

            /*
             * =================================================
             * VERIFICACIÓN DE ROBLOX
             * =================================================
             */

            const verifyButton =
                new ButtonBuilder()
                    .setLabel(
                        "Verificar"
                    )
                    .setStyle(
                        ButtonStyle.Link
                    )
                    .setURL(
                        createRobloxAuthorization(
                            message.author.id,
                            robloxUsername
                        )
                    );

            const backButton =
                new ButtonBuilder()
                    .setCustomId(
                        `aplicar_back:${message.author.id}`
                    )
                    .setLabel(
                        "Atrás"
                    )
                    .setStyle(
                        ButtonStyle.Secondary
                    );

            const row =
                new ActionRowBuilder()
                    .addComponents(
                        verifyButton,
                        backButton
                    );

            const verificationMessage =
                await dm.send({
                    embeds: [
                        embed(
                            "Verificación de cuenta",
                            `Usuario indicado: **${robloxUsername}**\n\n` +
                            "Para continuar, debes verificar que esta cuenta de Roblox te pertenece.\n\n" +
                            "Presiona **Verificar** para autorizar tu cuenta de Roblox."
                        )
                    ],
                    components: [
                        row
                    ]
                });

            const authorizationMessage =
                await dm.send({
                    embeds: [
                        embed(
                            "Autorización requerida",
                            "Después de completar la autorización, regresa a este DM.\n\n" +
                            "El formulario continuará automáticamente cuando Roblox confirme tu cuenta."
                        )
                    ]
                });

            /*
             * Guardamos ambos mensajes para
             * eliminarlos después de verificar.
             */

            application.verificationMessage =
                verificationMessage;

            application.authorizationMessage =
                authorizationMessage;

            await message.react(
                "✅"
            );

        } catch (error) {

            applications.delete(
                message.author.id
            );

            if (
                error?.message ===
                "APPLICATION_TIMEOUT"
            ) {

                await message.author
                    .createDM()
                    .then(
                        dm =>
                            dm.send({
                                embeds: [
                                    embed(
                                        "Solicitud cerrada",
                                        "⏱️ La aplicación fue cerrada porque no recibimos una respuesta dentro de los **30 minutos**."
                                    )
                                ]
                            })
                    )
                    .catch(
                        () => {}
                    );

                await message.react(
                    "❌"
                );

                return;
            }

            console.error(
                "Error iniciando aplicación:",
                error
            );

            await message.react(
                "❌"
            );
        }
    }
};