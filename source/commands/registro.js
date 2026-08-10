import {
    SQUADRONS,
    initializeSquadronRegistry,
    saveSquadronMessage,
    getSquadronMessage,
    buildTable
} from "../utils/squadronRegistry.js";

async function createTable(message, key) {
    const squadron = SQUADRONS[key];

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

    const content = buildTable(
        members,
        key
    );

    const tableMessage = await channel.send({
        content
    });

    try {
        await tableMessage.pin();
    } catch (error) {
        console.error(
            `No se pudo pinear ${key}:`,
            error
        );
    }

    await saveSquadronMessage(
        key,
        channel.id,
        tableMessage.id
    );
}

export default {
    name: "registro",
    permission: 1,

    async execute(message, args) {
        const target = args[0]?.toLowerCase();

        if (!target || !SQUADRONS[target]) {
            await message.react("❌");
            return;
        }

        try {
            await initializeSquadronRegistry();

            await createTable(
                message,
                target
            );

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