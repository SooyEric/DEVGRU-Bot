const BLUE_ROLES = [
    "1373365805693009920",
    "1373365810910859265",
    "1373365831454556312",
    "1373365832914178179",
    "1373365840677703865",
    "1373365856524046488",
    "1373365858784514241",
    "1373365865734738070",
    "1373365866657222819",
    "1373365868569952298"
];

const RED_ROLES = [
    "1373365804279791839",
    "1373365810910859265",
    "1373365831454556312",
    "1373365832914178179",
    "1373365840677703865",
    "1373365856524046488",
    "1373365857928876243",
    "1373365865734738070",
    "1373365866657222819",
    "1373365867576033440"
];

const BLUE_EXCLUSIVE_ROLES = [
    "1373365805693009920",
    "1373365858784514241",
    "1373365868569952298"
];

const RED_EXCLUSIVE_ROLES = [
    "1373365804279791839",
    "1373365857928876243",
    "1373365867576033440"
];

const GUEST_ROLE = "1373365890623602768";

export default {
    name: "add",
    permission: 1,

    async execute(message, args) {
        const group = args[0]?.toLowerCase();
        const target = args[1];

        if (!["blue", "red", "guest"].includes(group) || !target) {
            await message.react("❌");
            return;
        }

        let member;

        try {
            if (message.mentions.members.first()) {
                member = message.mentions.members.first();
            } else {
                const userId = target.replace(/[<@!>]/g, "");

                if (!/^\d{17,20}$/.test(userId)) {
                    await message.react("❌");
                    return;
                }

                member = await message.guild.members.fetch(userId);
            }
        } catch {
            await message.react("❌");
            return;
        }

        try {
            if (group === "blue") {
                await member.roles.remove(RED_EXCLUSIVE_ROLES);
                await member.roles.remove(GUEST_ROLE);
                await member.roles.add(BLUE_ROLES);
                await member.setNickname("SOE1 Bravo");
            }

            if (group === "red") {
                await member.roles.remove(BLUE_EXCLUSIVE_ROLES);
                await member.roles.remove(GUEST_ROLE);
                await member.roles.add(RED_ROLES);
                await member.setNickname("SOE1 Alpha");
            }

            if (group === "guest") {
                await member.roles.remove(BLUE_EXCLUSIVE_ROLES);
                await member.roles.remove(RED_EXCLUSIVE_ROLES);
                await member.roles.remove([
                    "1373365810910859265",
                    "1373365831454556312",
                    "1373365832914178179",
                    "1373365840677703865",
                    "1373365856524046488",
                    "1373365865734738070",
                    "1373365866657222819"
                ]);
                await member.roles.add(GUEST_ROLE);
                await member.setNickname(null);
            }

            await message.react("✅");
        } catch (error) {
            await message.react("❌");
            throw error;
        }
    }
};