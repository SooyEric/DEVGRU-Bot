import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} from "discord.js";

const APPLY_ROLE_ID = "1373365890623602768";
const LOG_CHANNEL_ID = "1536396530930557049";

const REDIRECT_URI = process.env.ROBLOX_REDIRECT_URI;

const applications = new Map();

function createApplication(userId) {
    const application = {
        userId,
        step: "roblox_username",
        robloxUsername: null,
        robloxUserId: null,
        discovery: null,
        discoveryDetail: null,
        serversImage: null,
        createdAt: Date.now(),
        timeout: null
    };

    application.timeout = setTimeout(() => {
        applications.delete(userId);
    }, 30 * 60 * 1000);

    applications.set(userId, application);

    return application;
}

function getApplication(userId) {
    return applications.get(userId);
}

function closeApplication(userId) {
    const application = applications.get(userId);

    if (application?.timeout) {
        clearTimeout(application.timeout);
    }

    applications.delete(userId);
}

function getRobloxAuthorizationUrl(userId) {
    const params = new URLSearchParams({
        client_id: process.env.ROBLOX_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        scope: "openid profile",
        state: userId
    });

    return `https://apis.roblox.com/oauth/v1/authorize?${params}`;
}

async function sendRobloxVerification(dm, application) {
    const authorizationUrl =
        getRobloxAuthorizationUrl(application.userId);

    const embed = new EmbedBuilder()
        .setColor("#ffaf1a")
        .setTitle("Verificación de Roblox")
        .setDescription(
            "Ahora debes verificar que la cuenta de Roblox que proporcionaste realmente te pertenece.\n\n" +
            "Presiona **Verificar cuenta** para continuar con la autorización de Roblox."
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel("Verificar cuenta")
                .setStyle(ButtonStyle.Link)
                .setURL(authorizationUrl),

            new ButtonBuilder()
                .setCustomId(`application_back:${application.userId}`)
                .setLabel("Atrás")
                .setStyle(ButtonStyle.Secondary)
        );

    await dm.send({
        embeds: [embed],
        components: [row]
    });
}

async function sendDiscoveryQuestion(dm, application) {
    application.step = "discovery";

    await dm.send(
        "¿Cómo encontraste el servidor?\n\n" +
        "**1.** Vanity (`discord.gg/devgru`)\n" +
        "**2.** Tag de SEALs\n" +
        "**3.** Invitación de un usuario\n" +
        "**4.** Promoción en otro servidor\n\n" +
        "Responde únicamente con **1, 2, 3 o 4**."
    );
}

async function sendServerImageQuestion(dm, application) {
    application.step = "servers_image";

    await dm.send(
        "📸 **Foto de tus servidores de Discord**\n\n" +
        "Envía una foto donde se puedan apreciar tus servidores actuales.\n\n" +
        "Si la imagen no se ve con suficiente claridad, se te podrá solicitar posteriormente que compartas pantalla en un voice chat."
    );
}

async function sendConfirmation(dm, application) {
    application.step = "confirmation";

    const embed = new EmbedBuilder()
        .setColor("#ffaf1a")
        .setTitle("Solicitud lista")
        .setDescription(
            "**Tu solicitud está casi lista para ser enviada.**\n\n" +
            "Antes de finalizar, asegúrate de haber enviado tu solicitud para unirte al grupo oficial de Roblox de DEVGRU:\n\n" +
            "[**DEVGRU — Seal Team Six**](https://www.roblox.com/communities/34479953/DEVGRU-Seal-Team-Six#!/about)\n\n" +
            "Cuando la hayas enviado, el sistema comprobará automáticamente tu solicitud.\n\n" +
            "⏳ **Esperando confirmación…**"
        );

    await dm.send({
        embeds: [embed]
    });

    application.step = "waiting_group";
}

async function sendFinalConfirmation(dm, application) {
    application.step = "final_confirmation";

    const embed = new EmbedBuilder()
        .setColor("#ffaf1a")
        .setTitle("Confirmar solicitud")
        .setDescription(
            "Tu solicitud ha sido completada.\n\n" +
            "**¿Deseas enviarla al equipo de DEVGRU para revisión?**"
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`application_submit:${application.userId}`)
                .setLabel("Enviar solicitud")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId(`application_cancel:${application.userId}`)
                .setLabel("Cancelar")
                .setStyle(ButtonStyle.Danger)
        );

    await dm.send({
        embeds: [embed],
        components: [row]
    });
}

async function sendLog(client, application) {
    const channel = await client.channels.fetch(
        LOG_CHANNEL_ID
    );

    if (!channel) return;

    const embed = new EmbedBuilder()
        .setColor("#ffaf1a")
        .setTitle("Nueva aplicación DEVGRU")
        .setDescription(
            `**Usuario de Discord:** <@${application.userId}>\n` +
            `**Discord ID:** \`${application.userId}\`\n\n` +
            `**Roblox Username:** ${application.robloxUsername || "N/A"}\n` +
            `**Roblox User ID:** ${application.robloxUserId || "N/A"}\n\n` +
            `**Cómo encontró DEVGRU:** ${application.discovery || "N/A"}\n` +
            `${
                application.discoveryDetail
                    ? `**Detalle:** ${application.discoveryDetail}\n`
                    : ""
            }\n` +
            `**Solicitud al grupo:** Confirmada\n`
        );

    await channel.send({
        content: `<@&1397135262823485550> <@&1394406230348529674> <@&1373365803491266683>`,
        embeds: [embed]
    });
}

export default {
    name: "applications",

    register(client) {

        client.on("messageCreate", async message => {
            if (message.author.bot) return;

            if (
                !message.content.startsWith("-aplicar")
            ) {
                return;
            }

            const member = message.member;

            if (
                !member?.roles.cache.has(
                    APPLY_ROLE_ID
                )
            ) {
                return;
            }

            const existing =
                getApplication(message.author.id);

            if (existing) {
                await message.reply(
                    "❌ Ya tienes una aplicación en proceso. Revisa tus mensajes privados."
                );

                return;
            }

            try {
                const dm = await message.author.createDM();

                const application =
                    createApplication(
                        message.author.id
                    );

                await dm.send(
                    "📝 **Aplicación DEVGRU**\n\n" +
                    "Comenzaremos tu proceso de aplicación.\n" +
                    "Responde cada pregunta directamente en este chat.\n\n" +
                    "**1. ¿Cuál es tu usuario de Roblox?**"
                );

                application.step =
                    "roblox_username";

                await message.react("✅");

            } catch (error) {
                console.error(
                    "Error iniciando aplicación:",
                    error
                );

                await message.react("❌");
            }
        });

        client.on("messageCreate", async message => {
            if (message.author.bot) return;

            const application =
                getApplication(message.author.id);

            if (!application) return;

            if (application.step === "roblox_username") {

                application.robloxUsername =
                    message.content.trim();

                if (!application.robloxUsername) {
                    return;
                }

                application.step =
                    "roblox_verification";

                await sendRobloxVerification(
                    message.channel,
                    application
                );

                return;
            }

            if (application.step === "discovery") {

                const answer =
                    message.content.trim();

                if (
                    !["1", "2", "3", "4"]
                        .includes(answer)
                ) {
                    await message.channel.send(
                        "❌ Responde únicamente con **1, 2, 3 o 4**."
                    );

                    return;
                }

                const options = {
                    "1": "Vanity",
                    "2": "Tag de SEALs",
                    "3": "Invitación de un usuario",
                    "4": "Promoción en otro servidor"
                };

                application.discovery =
                    options[answer];

                if (answer === "3") {
                    application.step =
                        "discovery_user";

                    await message.channel.send(
                        "¿Quién te invitó? Proporciona su usuario de Discord."
                    );

                    return;
                }

                if (answer === "4") {
                    application.step =
                        "discovery_server";

                    await message.channel.send(
                        "¿En qué servidor viste la promoción?"
                    );

                    return;
                }

                await sendServerImageQuestion(
                    message.channel,
                    application
                );

                return;
            }

            if (
                application.step ===
                "discovery_user"
            ) {

                application.discoveryDetail =
                    message.content.trim();

                await sendServerImageQuestion(
                    message.channel,
                    application
                );

                return;
            }

            if (
                application.step ===
                "discovery_server"
            ) {

                application.discoveryDetail =
                    message.content.trim();

                await sendServerImageQuestion(
                    message.channel,
                    application
                );

                return;
            }

            if (
                application.step ===
                "servers_image"
            ) {

                if (
                    message.attachments.size === 0
                ) {
                    await message.channel.send(
                        "❌ Debes adjuntar una imagen."
                    );

                    return;
                }

                application.serversImage =
                    message.attachments.first().url;

                await sendConfirmation(
                    message.channel,
                    application
                );

                return;
            }
        });

        client.on(
            "interactionCreate",
            async interaction => {

                if (!interaction.isButton()) {
                    return;
                }

                const [action, userId] =
                    interaction.customId.split(":");

                if (
                    ![
                        "application_cancel",
                        "application_submit"
                    ].includes(action)
                ) {
                    return;
                }

                if (
                    interaction.user.id !==
                    userId
                ) {
                    await interaction.reply({
                        content:
                            "❌ Esta solicitud no te pertenece.",
                        ephemeral: true
                    });

                    return;
                }

                const application =
                    getApplication(userId);

                if (!application) {
                    await interaction.reply({
                        content:
                            "❌ Esta aplicación ya expiró.",
                        ephemeral: true
                    });

                    return;
                }

                if (
                    action ===
                    "application_cancel"
                ) {

                    closeApplication(userId);

                    await interaction.update({
                        content:
                            "❌ Aplicación cancelada.",
                        embeds: [],
                        components: []
                    });

                    return;
                }

                if (
                    action ===
                    "application_submit"
                ) {

                    await sendLog(
                        client,
                        application
                    );

                    closeApplication(userId);

                    await interaction.update({
                        content:
                            "✅ Tu aplicación fue enviada correctamente. El equipo de DEVGRU revisará tu solicitud.",
                        embeds: [],
                        components: []
                    });
                }
            }
        );
    }
};