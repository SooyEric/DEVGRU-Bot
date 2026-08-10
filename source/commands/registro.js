import { EmbedBuilder } from "discord.js";

const SQUADRONS = {
    red: {
        name: "Red Squadron",
        emoji: "<:red:1527450543692320869>",
        role: "1373365857928876243",
        channel: "1373366015576117459"
    },

    blue: {
        name: "Blue Squadron",
        emoji: "<:blue:1527449963758358608>",
        role: "1373365858784514241",
        channel: "1373366016754847816"
    },

    gold: {
        name: "Gold Squadron",
        emoji: "<:gold:1527451395848933626>",
        role: "1373365859640279124",
        channel: "1530329743465906338"
    },

    black: {
        name: "Black Squadron",
        emoji: "<:black:1527452013812650054>",
        role: "1420221604020879463",
        channel: "1420443595659280498"
    },

    silver: {
        name: "Silver Squadron",
        emoji: "<:silver:1535722714260578344>",
        role: "1535716558322540594",
        channel: "1535718026618478623"
    }
};

const ROLES = {
    commander: "1373365833618690059",
    deputy: "1373365835862642713",
    executive: "1373365837129318474",
    groupCommander: "1373365839037988894",
    squadLeader: "1373365839721529506",
    operator: "1373365840677703865"
};

const COLOR = "#ffaf1a";

function createEmbed(squadron) {
    return new EmbedBuilder()
        .setColor(COLOR)
        .setTitle(
            `# ${squadron.name} ${squadron.emoji}`
        )
        .setDescription(
            `<@&${squadron.role}>\n\n` +

            `**Squadron Commander (00):**\n` +
            `\n` +

            `**Squadron Deputy Commander (01):**\n` +
            `\n` +

            `**Squadron Executive Officer (02):**\n` +
            `\n` +

            `**Unidad 10**\n` +

            `**Group Commander (10):**\n` +
            `\n` +

            `**Squad Leader (11):**\n` +
            `\n` +

            `**Squad Leader (12):**\n` +
            `\n` +

            `**Team Operator (13/19):**\n` +
            `\n\n` +

            `**Unidad 20**\n` +

            `**Group Commander (20):**\n` +
            `\n` +

            `**Squad Leader (21):**\n` +
            `\n` +

            `**Squad Leader (22):**\n` +
            `\n` +

            `**Team Operator (23/29):**\n`
        )
        .setTimestamp();
}

async function createSquadronTable(message, key) {
    const squadron = SQUADRONS[key];

    const channel = await message.guild.channels.fetch(
        squadron.channel
    );

    if (!channel) {
        throw new Error(
            `No se encontró el canal de ${squadron.name}.`
        );
    }

    const embed = createEmbed(squadron);

    const tableMessage = await channel.send({
        embeds: [embed]
    });

    await tableMessage.pin();

    return tableMessage;
}

export default {
    name: "registro",
    permission: 1,

    async execute(message, args) {
        const target = args[0]?.toLowerCase();

        if (
            !target ||
            (target !== "all" && !SQUADRONS[target])
        ) {
            await message.react("❌");
            return;
        }

        try {
            if (target === "all") {
                for (const key of Object.keys(SQUADRONS)) {
                    await createSquadronTable(message, key);
                }
            } else {
                await createSquadronTable(message, target);
            }

            await message.react("✅");

        } catch (error) {
            console.error(
                "Error creando tabla de escuadrón:",
                error
            );

            await message.react("❌");
        }
    }
};