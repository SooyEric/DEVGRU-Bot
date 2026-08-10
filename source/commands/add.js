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

const GUEST_ROLE = "1373365890623602768";

export default {
    name: "add",
    permission: 1,

    async execute(message, args) {
        // Validar argumentos
        if (args.length < 2) {
            await message.react("❌");
            return;
        }

        // El único grupo disponible actualmente
        const group = args[0].toLowerCase();

        if (group !== "blue") {
            await message.react("❌");
            return;
        }

        // Obtener persona mencionada
        const member = message.mentions.members.first();

        if (!member) {
            await message.react("❌");
            return;
        }

        try {
            // Agregar todos los roles de Blue
            await member.roles.add(BLUE_ROLES);

            // Remover Guest si lo tiene
            if (member.roles.cache.has(GUEST_ROLE)) {
                await member.roles.remove(GUEST_ROLE);
            }

            // Cambiar nickname
            await member.setNickname("SOE1 Bravo");

            // Éxito
            await message.react("✅");

        } catch (error) {
            await message.react("❌");
            throw error;
        }
    }
};