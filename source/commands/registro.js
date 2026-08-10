import {
    EmbedBuilder
} from "discord.js";

import {
    SQUADRONS,
    initializeSquadronRegistry,
    saveSquadronMessage,
    getSquadronMessage,
    buildTable
} from "../utils/squadronRegistry.js";

const COLOR = "#ffaf1a";

async function createTable(message, key) {
    const squadron = SQUADRONS[key];

    const existing = await getSquadronMessage(key);

    if (existing) {
        return false;
    }

    const channel = await message.guild.channels.fetch(
        squadron.channel
    );

    if (!channel) {
        throw new Error(
            `No se encontró el canal de ${squadron.name}.`
        );
    }

    await message.guild.members.fetch();

    const members = [
        ...message.guild.members.cache.values()
    ];

    const embed = buildTable(
        members,
        key
    );

    const tableMessage = await channel.send({
        embeds: [embed]
    });

    await tableMessage.pin();

    await saveSquadronMessage(
        key,
        channel.id,
        tableMessage.id
    );

    return true;
}

export default {
    name: "registro",
    permission: 1,

    async execute(message, args) {
        const target = args[0]?.toLowerCase();

        if (
            !target ||
            (
                target !== "all" &&
                !SQUADRONS[target]
            )
        ) {
            await message.react("❌");
            return;
        }

        try {
            await initializeSquadronRegistry();

            if (target === "all") {
                for (const key of Object.keys(SQUADRONS)) {
                    await createTable(
                        message,
                        key
                    );
                }
            } else {
                await createTable(
                    message,
                    target
                );
            }

            await message.react("✅");

        } catch (error) {
            console.error(
                "Error creando registro:",
                error
            );

            await message.react("❌");
        }
    }
};