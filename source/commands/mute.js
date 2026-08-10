const MAX_TIMEOUT = 28 * 24 * 60 * 60 * 1000;

function parseDuration(input) {
    if (!input) return 60 * 1000;

    const match = input.toLowerCase().match(/^(\d+)(s|m|h|d)$/);

    if (!match) return null;

    const value = Number(match[1]);
    const unit = match[2];

    const multipliers = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000
    };

    const duration = value * multipliers[unit];

    if (duration <= 0 || duration > MAX_TIMEOUT) {
        return null;
    }

    return duration;
}

export default {
    name: "mute",
    permission: 1,

    async execute(message, args) {
        const targetInput = args[0];

        if (!targetInput) {
            await message.react("❌");
            return;
        }

        const duration = parseDuration(args[1]);

        if (duration === null) {
            await message.react("❌");
            return;
        }

        let member;

        try {
            member = message.mentions.members.first();

            if (!member) {
                const userId = targetInput.replace(/[<@!>]/g, "");

                if (!/^\d{17,20}$/.test(userId)) {
                    await message.react("❌");
                    return;
                }

                member = await message.guild.members.fetch(userId);
            }

            if (!member) {
                await message.react("❌");
                return;
            }

            member = await message.guild.members.fetch({
                user: member.id,
                force: true
            });
        } catch {
            await message.react("❌");
            return;
        }

        try {
            await member.timeout(
                duration,
                `Mute ejecutado por ${message.author.tag}`
            );

            await message.react("✅");
        } catch (error) {
            console.error("Error en comando mute:", error);
            await message.react("❌");
        }
    }
};