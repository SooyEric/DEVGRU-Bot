import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";

import {
    createRobloxAuthorization
} from "../utils/robloxOAuth.js";

const APPLY_ROLE_ID = "1373365890623602768";

const TIMEOUT = 30 * 60 * 1000;

export default {
    name: "aplicar",
    permission: null,

    async execute(message) {
        if (!message.member?.roles.cache.has(APPLY_ROLE_ID)) {
            await message.react("❌");
            return;
        }

        try {
            await message.author.send(
                "**Aplicación DEVGRU**\n\n" +
                "Comenzaremos con la verificación de tu cuenta de Roblox.\n\n" +
                "Tendrás **30 minutos** para completar la aplicación."
            );

            const question = await message.author.send(
                "**1. ¿Cuál es tu usuario de Roblox?**\n\n" +
                "Escribe únicamente tu nombre de usuario de Roblox."
            );

            const collected = await message.author.dmChannel.awaitMessages({
                filter: msg =>
                    msg.author.id === message.author.id &&
                    !msg.author.bot,
                max: 1,
                time: TIMEOUT,
                errors: ["time"]
            }).catch(() => null);

            if (!collected || collected.size === 0) {
                await message.author.send(
                    "⏱️ Tu aplicación ha expirado por falta de respuesta."
                ).catch(() => {});

                return;
            }

            const robloxUsername = collected.first().content.trim();

            if (!robloxUsername) {
                await message.author.send(
                    "❌ No se recibió un usuario válido."
                ).catch(() => {});

                return;
            }

            const authorizationUrl =
                createRobloxAuthorization(
                    message.author.id
                );

            const verifyButton = new ButtonBuilder()
                .setLabel("Verificar cuenta")
                .setStyle(ButtonStyle.Link)
                .setURL(authorizationUrl);

            const backButton = new ButtonBuilder()
                .setCustomId(
                    `apply_back:${message.author.id}`
                )
                .setLabel("Atrás")
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder()
                .addComponents(
                    verifyButton,
                    backButton
                );

            const verificationMessage =
                await message.author.send({
                    content:
                        `**Usuario indicado:** \`${robloxUsername}\`\n\n` +
                        "Ahora debes verificar que esta cuenta de Roblox te pertenece.\n\n" +
                        "Pulsa **Verificar cuenta** y autoriza a DEVGRU.\n\n" +
                        "Después de autorizar, podrás regresar a Discord.",
                    components: [row]
                });

            const interactionFilter = interaction =>
                interaction.isButton() &&
                interaction.user.id === message.author.id &&
                interaction.customId ===
                    `apply_back:${message.author.id}`;

            const interaction =
                await verificationMessage.awaitMessageComponent({
                    filter: interactionFilter,
                    time: TIMEOUT
                }).catch(() => null);

            if (interaction) {
                await interaction.update({
                    content:
                        "**1. ¿Cuál es tu usuario de Roblox?**\n\n" +
                        "Escribe nuevamente tu usuario de Roblox.",
                    components: []
                });
            }

        } catch (error) {
            console.error(
                "Error en comando aplicar:",
                error
            );

            await message.author.send(
                "❌ Ocurrió un error al iniciar tu aplicación. Inténtalo nuevamente."
            ).catch(() => {});

            await message.react("❌");
            return;
        }

        await message.react("✅");
    }
};