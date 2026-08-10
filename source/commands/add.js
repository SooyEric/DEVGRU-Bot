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

const GUEST_ROLE = "1373365890623602768";

export default {
    name: "add",
    permission: 1,

    async execute(message, args) {
        if (args.length < 2) {
            await message.react("❌");
            return;
        }

        const group = args[0].toLowerCase();
        const member = message.mentions.members.first();

        if (!["blue", "red", "guest"].includes(group) || !member) {
            await message.react("❌");
            return;
        }

        try {
            if (group === "blue") {
                const redRoles = member.roles.cache.filter(role =>
                    RED_ROLES.includes(role.id)
                );

                if (redRoles.size > 0) {
                    await member.roles.remove(redRoles);
                }

                await member.roles.add(BLUE_ROLES);

                if (member.roles.cache.has(GUEST_ROLE)) {
                    await member.roles.remove(GUEST_ROLE);
                }

                await member.setNickname("SOE1 Bravo");
            }

            if (group === "red") {
                const blueRoles = member.roles.cache.filter(role =>
                    BLUE_ROLES.includes(role.id)
                );

                if (blueRoles.size > 0) {
                    await member.roles.remove(blueRoles);
                }

                await member.roles.add(RED_ROLES);

                if (member.roles.cache.has(GUEST_ROLE)) {
                    await member.roles.remove(GUEST_ROLE);
                }

                await member.setNickname("SOE1 Alpha");
            }

            if (group === "guest") {
                const rolesToRemove = member.roles.cache.filter(role =>
                    BLUE_ROLES.includes(role.id) ||
                    RED_ROLES.includes(role.id)
                );

                if (rolesToRemove.size > 0) {
                    await member.roles.remove(rolesToRemove);
                }

                if (!member.roles.cache.has(GUEST_ROLE)) {
                    await member.roles.add(GUEST_ROLE);
                }

                await member.setNickname(null);
            }

            await message.react("✅");
        } catch (error) {
            await message.react("❌");
            throw error;
        }
    }
};