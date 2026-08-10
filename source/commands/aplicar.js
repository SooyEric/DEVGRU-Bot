import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";

const REQUIRED_ROLE = "1373365890623602768";

const APPLICATION_TIMEOUT = 30 * 60 * 1000;

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

            await dm.send(
                "**Solicitud para DEVGRU**\n\n" +
                "Comenzaremos tu aplicación para formar parte de DEVGRU.\n\n" +
                "Responde cada pregunta directamente en este chat.\n\n" +
                "⏱️ Tienes **30 minutos** para completar la aplicación."
            );

            await dm.send(
                "**1. ¿Cuál es tu usuario de Roblox?**\n\n" +
                "Escribe únicamente tu nombre de usuario de Roblox."
            );

            const collector = dm.createMessageCollector({
                filter: m =>
                    m.author.id === message.author.id &&
                    !m.author.bot,
                time: APPLICATION_TIMEOUT,
                max: 1
            });

            collector.on("collect", async robloxMessage => {
                const robloxUsername = robloxMessage.content.trim();

                if (!robloxUsername) {
                    await dm.send(
                        "❌ No se recibió un usuario válido."
                    );
                    return;
                }

                await dm.send(
                    "**Verificación de cuenta de Roblox**\n\n" +
                    `Usuario indicado: **${robloxUsername}**\n\n` +
                    "Para continuar, debes verificar que esta cuenta de Roblox te pertenece.\n\n" +
                    "Presiona **Verificar** para autorizar tu cuenta."
                );

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
                    content:
                        "Cuando termines la autorización, regresa a este DM.",
                    components: [row]
                });
            });

            collector.on("end", async collected => {
                if (collected.size === 0) {
                    await dm.send(
                        "⏱️ **Solicitud cerrada.**\n\n" +
                        "La aplicación fue cerrada porque no recibimos una respuesta dentro de los 30 minutos."
                    ).catch(() => {});
                }
            });

            await message.react("✅");

        } catch (error) {
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