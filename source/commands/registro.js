import {
    SQUADRONS,
    initializeSquadronRegistry,
    saveSquadronMessage,
    getSquadronMessage,
    buildTable
} from "../utils/squadronRegistry.js";

async function createTable(message, key) {
    const squadron = SQUADRONS[key];

    if (!squadron) return false;

    const channel = await message.guild.channels.fetch(
        squadron.channel
    );

    if (!channel) {
        throw new Error(
            `No se encontró el canal de ${squadron.name}.`
        );
    }

    const existing = await getSquadronMessage(key);

    if (existing) {
        try {
            await channel.messages.fetch(
                existing.message_id
            );

            return false;

        } catch {
            // El mensaje ya no existe.
            // Se crea uno nuevo y se actualiza el registro.
        }
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
                    try {
                        await createTable(
                            message,
                            key
                        );
                    } catch (error) {
                        console.error(
                            `Error creando registro ${key}:`,
                            error
                        );
                    }
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
                "Error ejecutando registro:",
                error
            );

            await message.react("❌");
        }
    }
};