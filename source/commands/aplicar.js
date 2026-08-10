import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} from "discord.js";

const REQUIRED_ROLE = "1373365890623602768";

const APPLICATION_TIMEOUT = 30 * 60 * 1000;

const COLOR = "#ffaf1a";

function embed(title, description) {
    return new EmbedBuilder()
        .setColor(COLOR)
        .setTitle(title)
        .setDescription(description);
}

async function waitForMessage(dm, userId, endTime) {
    const remaining = endTime - Date.now();

    if (remaining <= 0) {
        throw new Error("APPLICATION_TIMEOUT");
    }

    const collected = await dm.awaitMessages({
        filter: message =>
            message.author.id === userId &&
            !message.author.bot,

        max: 1,
        time: remaining
    });

    if (collected.size === 0) {
        throw new Error("APPLICATION_TIMEOUT");
    }

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

        try {
            const dm = await message.author.createDM();

            const endTime =
                Date.now() + APPLICATION_TIMEOUT;

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

            await dm.send({
                embeds: [
                    embed(
                        "1. Usuario de Roblox",
                        "¿Cuál es tu usuario de Roblox?\n\n" +
                        "Escribe únicamente tu **nombre de usuario de Roblox**."
                    )
                ]
            });

            const robloxMessage = await waitForMessage(
                dm,
                message.author.id,
                endTime
            );

            const robloxUsername =
                robloxMessage.content.trim();

            if (!robloxUsername) {
                await dm.send({
                    embeds: [
                        embed(
                            "Solicitud cancelada",
                            "❌ No se recibió un usuario válido de Roblox."
                        )
                    ]
                });

                await message.react("❌");
                return;
            }

            const verifyButton = new ButtonBuilder()
                .setLabel("Verificar")
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
                    embed(
                        "Verificación de cuenta",
                        `Usuario indicado: **${robloxUsername}**\n\n` +
                        "Para continuar, debes verificar que esta cuenta de Roblox te pertenece.\n\n" +
                        "Presiona **Verificar** para autorizar tu cuenta de Roblox."
                    )
                ],
                components: [row]
            });

            await dm.send({
                embeds: [
                    embed(
                        "Autorización requerida",
                        "Después de completar la autorización, regresa a este DM para continuar con tu aplicación."
                    )
                ]
            });

            /*
             * IMPORTANTE:
             * Aquí posteriormente esperaremos a que
             * el callback de Roblox confirme la cuenta.
             *
             * Por ahora el proceso se detiene aquí.
             */

            await message.react("✅");

        } catch (error) {

            if (error.message === "APPLICATION_TIMEOUT") {
                try {
                    const dm =
                        await message.author.createDM();

                    await dm.send({
                        embeds: [
                            embed(
                                "Solicitud cerrada",
                                "⏱️ La aplicación fue cerrada porque no recibimos una respuesta dentro de los **30 minutos**."
                            )
                        ]
                    });
                } catch {}

                await message.react("❌");
                return;
            }

            console.error(
                "Error iniciando aplicación:",
                error
            );

            await message.react("❌");
        }
    }
};

function buildRobloxOAuthUrl(
    discordUserId,
    robloxUsername
) {
    const params = new URLSearchParams({
        client_id:
            process.env.ROBLOX_CLIENT_ID,

        redirect_uri:
            process.env.ROBLOX_REDIRECT_URI,

        response_type: "code",

        scope:
            "openid profile",

        state:
            Buffer.from(
                JSON.stringify({
                    discordUserId,
                    robloxUsername
                })
            ).toString("base64url")
    });

    return (
        "https://apis.roblox.com/oauth/v1/authorize?" +
        params
    );
}