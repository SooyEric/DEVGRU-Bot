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

const GROUP_ROLES = [
    ...new Set([
        ...BLUE_ROLES,
        ...RED_ROLES
    ])
];

const ALL_MANAGED_ROLES = [
    ...GROUP_ROLES,
    GUEST_ROLE
];

const wait = ms =>
    new Promise(resolve => setTimeout(resolve, ms));

export default {
    name: "add",
    permission: 1,

    async execute(message, args) {
        const group = args[0]?.toLowerCase();
        const target = args[1];

        if (!["blue", "red", "guest"].includes(group)) {
            await message.react("❌");
            return;
        }

        if (!target) {
            await message.react("❌");
            return;
        }

        let member;

        try {
            member = message.mentions.members.first();

            if (!member) {
                const userId = target.replace(/[<@!>]/g, "");

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
            // =====================================================
            // 1. REMOVER TODOS LOS ROLES DE UNA SOLA OPERACIÓN
            // =====================================================

            await member.roles.remove(ALL_MANAGED_ROLES);

            // =====================================================
            // 2. ESPERAR A QUE DISCORD PROCESE EL REMOVE
            // =====================================================

            await wait(2000);

            // =====================================================
            // 3. OBTENER EL ESTADO ACTUALIZADO
            // =====================================================

            member = await message.guild.members.fetch({
                user: member.id,
                force: true
            });

            // =====================================================
            // 4. GUEST
            // =====================================================

            if (group === "guest") {
                await member.roles.add(GUEST_ROLE);
                await member.setNickname(null);

                await message.react("✅");
                return;
            }

            // =====================================================
            // 5. SELECCIONAR ÚNICAMENTE EL GRUPO SOLICITADO
            // =====================================================

            const rolesToAdd =
                group === "blue"
                    ? BLUE_ROLES
                    : RED_ROLES;

            // =====================================================
            // 6. AGREGAR UNO POR UNO
            // =====================================================

            for (const roleId of rolesToAdd) {
                await member.roles.add(roleId);
            }

            // =====================================================
            // 7. NICKNAME
            // =====================================================

            if (group === "blue") {
                await member.setNickname("SOE1 Bravo");
            }

            if (group === "red") {
                await member.setNickname("SOE1 Alpha");
            }

            await message.react("✅");

        } catch (error) {
            await message.react("❌");
            throw error;
        }
    }
};