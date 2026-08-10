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
    ...BLUE_ROLES,
    ...RED_ROLES
];

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

            // Obtener estado actual directamente de Discord
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
            // 1. QUITAR TODOS LOS ROLES DE GRUPO
            // =====================================================

            for (const roleId of GROUP_ROLES) {
                if (member.roles.cache.has(roleId)) {
                    await member.roles.remove(roleId);
                }
            }

            // =====================================================
            // 2. QUITAR GUEST
            // =====================================================

            if (member.roles.cache.has(GUEST_ROLE)) {
                await member.roles.remove(GUEST_ROLE);
            }

            // =====================================================
            // 3. VOLVER A OBTENER EL ESTADO REAL DEL USUARIO
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
            // 5. SELECCIONAR EXCLUSIVAMENTE EL GRUPO SOLICITADO
            // =====================================================

            const rolesToAdd =
                group === "blue"
                    ? BLUE_ROLES
                    : RED_ROLES;

            // =====================================================
            // 6. AGREGAR ÚNICAMENTE LOS ROLES DEL GRUPO
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