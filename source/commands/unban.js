import {
    initializeBanTable,
    getBannedMember,
    getAllBannedMembers
} from "../utils/banManager.js";

export default {
    name: "unban",
    permission: 1,

    async execute(message, args) {
        const target = args[0];

        if (!target) {
            await message.react("❌");
            return;
        }

        try {
            await initializeBanTable();

            if (target.toLowerCase() === "all") {
                const bannedMembers = await getAllBannedMembers();

                if (bannedMembers.length === 0) {
                    await message.react("❌");
                    return;
                }

                for (const bannedMember of bannedMembers) {
                    try {
                        await message.guild.bans.remove(
                            bannedMember.user_id,
                            `Unban ejecutado por ${message.author.tag}`
                        );
                    } catch {
                    }
                }

                await message.react("✅");
                return;
            }

            const userId = target.replace(/[<@!>]/g, "");

            if (!/^\d{17,20}$/.test(userId)) {
                await message.react("❌");
                return;
            }

            const bannedMember = await getBannedMember(userId);

            if (!bannedMember) {
                await message.react("❌");
                return;
            }

            await message.guild.bans.remove(
                userId,
                `Unban ejecutado por ${message.author.tag}`
            );

            await message.react("✅");

        } catch (error) {
            console.error("Error en comando unban:", error);
            await message.react("❌");
        }
    }
};