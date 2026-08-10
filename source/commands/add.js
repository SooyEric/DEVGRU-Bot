const SQUADRONS = {
    red: {
        nickname: "SOE1 Alpha",
        roles: [
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
        ]
    },

    blue: {
        nickname: "SOE1 Bravo",
        roles: [
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
        ]
    },

    gold: {
        nickname: "SOE1 Charlie",
        roles: [
            "1373365806775406693",
            "1373365810910859265",
            "1373365831454556312",
            "1373365832914178179",
            "1373365840677703865",
            "1373365856524046488",
            "1373365859640279124",
            "1373365865734738070",
            "1373365866657222819",
            "1373365870226571325"
        ]
    },

    black: {
        nickname: "SOE1 Delta",
        roles: [
            "1373365808969023529",
            "1373365810910859265",
            "1373365831454556312",
            "1373365832914178179",
            "1373365840677703865",
            "1373365856524046488",
            "1420221604020879463",
            "1373365865734738070",
            "1373365866657222819",
            "1420443645558919308"
        ]
    },

    silver: {
        nickname: "SOE1 Echo",
        roles: [
            "1535720824257122476",
            "1373365810910859265",
            "1373365831454556312",
            "1373365832914178179",
            "1373365840677703865",
            "1373365856524046488",
            "1535716558322540594",
            "1373365865734738070",
            "1373365866657222819",
            "1535716769417666653"
        ]
    }
};

const GUEST_ROLE = "1373365890623602768";

const TYPE_3_ROLES = [
    "1373365811858768005",
    "1373365812383187047",
    "1373365813490483313",
    "1373365814341799958",
    "1373365815524724966",
    "1373365816539480267",
    "1373365817386860729",
    "1373365818112348235",
    "1373365819383480370",
    "1373365820217884815",
    "1373365821543284796",
    "1373365822281748637",
    "1373365823841894531",
    "1373365824932548679",
    "1373365827239280751",
    "1373365828388655196",
    "1373365829860593735",
    "1373365830359847036",
    "1373365831454556312"
];

const TYPE_5_ROLES = [
    "1373365833618690059",
    "1373365835862642713",
    "1373365837129318474",
    "1373365839037988894",
    "1373365839721529506",
    "1373365840677703865"
];

const ALL_SQUADRON_ROLES = [
    ...new Set(
        Object.values(SQUADRONS).flatMap(
            squadron => squadron.roles
        )
    )
];

const ALL_TYPE_ROLES = [
    ...TYPE_3_ROLES,
    ...TYPE_5_ROLES
];

export default {
    name: "add",
    permission: 1,

    async execute(message, args) {

        const group = args[0]?.toLowerCase();
        const targetInput = args[1];

        const VALID_GROUPS = [
            "red",
            "blue",
            "gold",
            "black",
            "silver",
            "guest"
        ];

        // =========================================================
        // VALIDAR GRUPO
        // =========================================================

        if (!group || !VALID_GROUPS.includes(group)) {
            await message.react("❌");
            return;
        }

        // =========================================================
        // VALIDAR USUARIO
        // =========================================================

        if (!targetInput) {
            await message.react("❌");
            return;
        }

        let member;

        try {

            // Primero intenta obtener una mención
            member = message.mentions.members.first();

            // Si no hay mención, intenta obtener el ID
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

            // Obtener información actualizada del miembro
            member = await message.guild.members.fetch({
                user: member.id,
                force: true
            });

        } catch (error) {

            await message.react("❌");
            throw error;
        }

        try {

            // =========================================================
            // GUEST
            // =========================================================

            if (group === "guest") {

                /*
                 * Guest significa:
                 *
                 * eliminar absolutamente todo lo relacionado
                 * con escuadrones y tipos.
                 */

                const rolesToRemove = [
                    ...ALL_SQUADRON_ROLES,
                    ...ALL_TYPE_ROLES,
                    GUEST_ROLE
                ];

                const removableRoles = member.roles.cache.filter(role =>
                    rolesToRemove.includes(role.id)
                );

                if (removableRoles.size > 0) {
                    await member.roles.remove(removableRoles);
                }

                // Guest es el ÚNICO rol que se agrega aquí.
                await member.roles.add(GUEST_ROLE);

                // Restaurar nickname original
                await member.setNickname(null);

                await message.react("✅");
                return;
            }

            // =========================================================
            // ESCUADRÓN SOLICITADO
            // =========================================================

            const targetSquadron = SQUADRONS[group];

            // =========================================================
            // GUARDAR TYPE 3 Y TYPE 5 EXISTENTES
            // =========================================================

            /*
             * Estos roles NO pertenecen al cambio de escuadrón.
             *
             * Si el usuario ya tiene un Type 3 y/o Type 5,
             * se conserva.
             */

            const existingType3 = TYPE_3_ROLES.find(roleId =>
                member.roles.cache.has(roleId)
            );

            const existingType5 = TYPE_5_ROLES.find(roleId =>
                member.roles.cache.has(roleId)
            );

            // =========================================================
            // DETECTAR ESCUADRÓN ACTUAL
            // =========================================================

            let currentSquadron = null;

            for (const [name, squadron] of Object.entries(SQUADRONS)) {

                /*
                 * Un usuario pertenece a un escuadrón si posee
                 * suficientes roles exclusivos de ese paquete.
                 *
                 * Para evitar confundir los roles compartidos,
                 * buscamos específicamente los roles 1, 7 y 10.
                 */

                const identifiers = [
                    squadron.roles[0],
                    squadron.roles[6],
                    squadron.roles[9]
                ];

                const belongsToSquadron = identifiers.every(roleId =>
                    member.roles.cache.has(roleId)
                );

                if (belongsToSquadron) {
                    currentSquadron = name;
                    break;
                }
            }

            // =========================================================
            // CAMBIO DE ESCUADRÓN
            // =========================================================

            if (
                currentSquadron &&
                currentSquadron !== group
            ) {

                const oldSquadron = SQUADRONS[currentSquadron];

                /*
                 * Quitamos los roles del escuadrón anterior.
                 *
                 * PERO:
                 *
                 * Type 3 y Type 5 se respetan.
                 *
                 * Si uno de los roles del escuadrón anterior
                 * pertenece a Type 3/Type 5, NO se elimina.
                 */

                const rolesToRemove = oldSquadron.roles.filter(roleId => {

                    // Respetar Type 3
                    if (TYPE_3_ROLES.includes(roleId)) {
                        return false;
                    }

                    // Respetar Type 5
                    if (TYPE_5_ROLES.includes(roleId)) {
                        return false;
                    }

                    return member.roles.cache.has(roleId);
                });

                if (rolesToRemove.length > 0) {
                    await member.roles.remove(rolesToRemove);
                }
            }

            // =========================================================
            // QUITAR GUEST
            // =========================================================

            /*
             * CUALQUIER escuadrón elimina Guest.
             *
             * Nunca se vuelve a agregar Guest aquí.
             */

            if (member.roles.cache.has(GUEST_ROLE)) {
                await member.roles.remove(GUEST_ROLE);
            }

            // =========================================================
            // ASIGNAR ROLES DEL NUEVO ESCUADRÓN
            // =========================================================

            const rolesToAdd = [];

            for (const roleId of targetSquadron.roles) {

                // Ya tiene el rol
                if (member.roles.cache.has(roleId)) {
                    continue;
                }

                /*
                 * Si ya tiene un Type 3 distinto,
                 * NO añadimos otro Type 3.
                 */

                if (
                    TYPE_3_ROLES.includes(roleId) &&
                    existingType3
                ) {
                    continue;
                }

                /*
                 * Si ya tiene un Type 5 distinto,
                 * NO añadimos otro Type 5.
                 */

                if (
                    TYPE_5_ROLES.includes(roleId) &&
                    existingType5
                ) {
                    continue;
                }

                rolesToAdd.push(roleId);
            }

            if (rolesToAdd.length > 0) {
                await member.roles.add(rolesToAdd);
            }

            // =========================================================
            // NICKNAME
            // =========================================================

            await member.setNickname(targetSquadron.nickname);

            // =========================================================
            // ÉXITO
            // =========================================================

            await message.react("✅");

        } catch (error) {

            await message.react("❌");

            throw error;
        }
    }
};