import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";

const REQUIRED_ROLE = "1373365890623602768";

const APPLICATION_TIMEOUT = 30 * 60 * 1000;

const EMBED_COLOR = "#ffaf1a";

function createEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle(title)
        .setDescription(description);
}

async function waitForMessage(dm, userId) {
    const collected = await dm.awaitMessages({
        filter: message =>
            message.author.id === userId &&
            !message.author.bot,
        max: 1,
        time: APPLICATION_TIMEOUT,
        errors: ["time"]
    });

    return collected.first();
}

export default {
    name: "aplicar",
    permission: null,

    async execute(message) {
        if (!message.member?.roles.cache.has(REQUIRED_ROLE)) {
            await message.react("❌");
            return;
        }

        let dm;

        try {
            dm = await message.author.createDM();

            await dm.send({
                embeds: [
                    createEmbed(
                        "Solicitud para DEVGRU",
                        "Comenzaremos tu aplicación para formar parte de **DEVGRU**.\n\n" +
                        "Responde cada pregunta directamente en este chat.\n\n" +
                        "⏱️ Tienes **30 minutos** para completar la aplicación."
                    )
                ]
            });

            await dm.send({
                embeds: [
                    createEmbed(
                        "1. Usuario de Roblox",
                        "¿Cuál es tu usuario de Roblox?\n\n" +
                        "Escribe únicamente tu **nombre de usuario**."
                    )
                ]
            });

            const robloxMessage = await waitForMessage(
                dm,
                message.author.id
            );

            const robloxUsername =
                robloxMessage.content.trim();

            if (!robloxUsername) {
                throw new Error(
                    "No se recibió un usuario de Roblox."
                );
            }

            const verifyButton = new ButtonBuilder()
                .setLabel("Verificar cuenta")
                .setStyle(ButtonStyle.Link)
                .setURL(
                    buildRobloxOAuthUrl(
                        message.author.id,
                        robloxUsername
                    )
                );

            const backButton = new ButtonBuilder()
                .setCustomId(
                    `aplicar_back:${message.author.id}`
                )
                .setLabel("Atrás")
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder()
                .addComponents(
                    verifyButton,
                    backButton
                );

            await dm.send({
                embeds: [
                    createEmbed(
                        "Verificación de Roblox",
                        `**Usuario indicado:** \`${robloxUsername}\`\n\n` +
                        "Ahora debes verificar que esta cuenta de Roblox te pertenece.\n\n" +
                        "Presiona **Verificar cuenta** para autorizar tu cuenta de Roblox.\n\n" +
                        "Después de completar la autorización, regresa a este chat."
                    )
                ],
                components: [row]
            });

            await message.react("✅");

        } catch (error) {
            if (error?.message === "Collector received no messages before ending with time") {
                await dm?.send({
                    embeds: [
                        createEmbed(
                            "Solicitud cerrada",
                            "⏱️ Tu aplicación fue cerrada porque no recibimos una respuesta dentro de los **30 minutos**."
                        )
                    ]
                }).catch(() => {});

                return;
            }

            console.error(
                "Error en comando aplicar:",
                error
            );

            await dm?.send({
                embeds: [
                    createEmbed(
                        "Error",
                        "❌ Ocurrió un error al procesar tu aplicación.\n\n" +
                        "Inténtalo nuevamente con `-aplicar`."
                    )
                ]
            }).catch(() => {});

            await message.react("❌");
        }
    }
};

function buildRobloxOAuthUrl(
    discordUserId,
    robloxUsername
) {
    const params = new URLSearchParams({
        client_id: process.env.ROBLOX_CLIENT_ID,
        redirect_uri: process.env.ROBLOX_REDIRECT_URI,
        response_type: "code",
        scope: "openid profile",
        state: Buffer.from(
            JSON.stringify({
                discordUserId,
                robloxUsername
            })
        ).toString("base64url")
    });

    return `https://apis.roblox.com/oauth/v1/authorize?${params}`;
}