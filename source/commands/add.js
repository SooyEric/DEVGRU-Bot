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

const GOLD_ROLES = [
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
];

const BLACK_ROLES = [
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
];

const SILVER_ROLES = [
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
];

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

const GUEST_ROLE = "1373365890623602768";

const SQUADRONS = {
    red: {
        roles: RED_ROLES,
        role1: "1373365804279791839",
        role7: "1373365857928876243",
        role10: "1373365867576033440"
    },

    blue: {
        roles: BLUE_ROLES,
        role1: "1373365805693009920",
        role7: "1373365858784514241",
        role10: "1373365868569952298"
    },

    gold: {
        roles: GOLD_ROLES,
        role1: "1373365806775406693",
        role7: "1373365859640279124",
        role10: "1373365870226571325"
    },

    black: {
        roles: BLACK_ROLES,
        role1: "1373365808969023529",
        role7: "1420221604020879463",
        role10: "1420443645558919308"
    },

    silver: {
        roles: SILVER_ROLES,
        role1: "1535720824257122476",
        role7: "1535716558322540594",
        role10: "1535716769417666653"
    }
};

export default {
    name: "add",
    permission: 1,

    async execute(message, args) {
        /*
         * ============================================================
         * VALIDACIÓN
         * ============================================================
         */

        if (args.length < 2) {
            await message.react("❌");
            return;
        }

        const group = args[0].toLowerCase();
        const targetInput = args[1];

        const validGroups = [
            "red",
            "blue",
            "gold",
            "black",
            "silver",
            "guest"
        ];

        if (!validGroups.includes(group)) {
            await message.react("❌");
            return;
        }

        /*
         * ============================================================
         * OBTENER USUARIO
         * ============================================================
         */

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
        } catch {
            await message.react("❌");
            return;
        }

        /*
         * ============================================================
         * CONFIRMACIÓN TEMPRANA
         *
         * Igual que el YAGPDB:
         * una vez validado el grupo y el usuario, reacciona ✅.
         * ============================================================
         */

        try {
            await message.react("✅");
        } catch {
            // Igual que el try/catch del comando original.
        }

        try {

            /*
             * ========================================================
             * GUEST
             * ========================================================
             *
             * YAGPDB:
             *
             * - Quita TODOS los roles de Red
             * - Quita TODOS los roles de Blue
             * - Quita TODOS los roles de Gold
             * - Quita TODOS los roles de Black
             * - Quita TODOS los roles de Silver
             * - Quita TODOS los Type 3
             * - Quita TODOS los Type 5
             * - Agrega Guest
             *
             * ========================================================
             */

            if (group === "guest") {

                const allSquadronRoles = [
                    ...new Set([
                        ...RED_ROLES,
                        ...BLUE_ROLES,
                        ...GOLD_ROLES,
                        ...BLACK_ROLES,
                        ...SILVER_ROLES
                    ])
                ];

                const rolesToRemove = [
                    ...new Set([
                        ...allSquadronRoles,
                        ...TYPE_3_ROLES,
                        ...TYPE_5_ROLES
                    ])
                ];

                const existingRolesToRemove = rolesToRemove.filter(roleId =>
                    member.roles.cache.has(roleId)
                );

                if (existingRolesToRemove.length > 0) {
                    await member.roles.remove(existingRolesToRemove);
                }

                if (!member.roles.cache.has(GUEST_ROLE)) {
                    await member.roles.add(GUEST_ROLE);
                }

                return;
            }

            /*
             * ========================================================
             * INFORMACIÓN DEL GRUPO
             * ========================================================
             */

            const squadron = SQUADRONS[group];

            /*
             * ========================================================
             * DETECTAR SI PERTENECE A OTRO GRUPO
             *
             * Exactamente como el YAGPDB:
             *
             * Red    = tiene sus roles 1, 7 y 10
             * Blue   = tiene sus roles 1, 7 y 10
             * Gold   = tiene sus roles 1, 7 y 10
             * Black  = tiene sus roles 1, 7 y 10
             * Silver = tiene sus roles 1, 7 y 10
             * ========================================================
             */

            let currentGroup = null;

            for (const [name, data] of Object.entries(SQUADRONS)) {

                const belongsToGroup =
                    member.roles.cache.has(data.role1) &&
                    member.roles.cache.has(data.role7) &&
                    member.roles.cache.has(data.role10);

                if (belongsToGroup) {
                    currentGroup = name;
                    break;
                }
            }

            /*
             * ========================================================
             * CAMBIO DE GRUPO
             * ========================================================
             *
             * Si pertenece a otro grupo:
             *
             * 1. Quita solamente sus roles 1, 7 y 10 actuales.
             * 2. Agrega los roles 1, 7 y 10 del nuevo grupo.
             * 3. Quita Guest.
             *
             * NO elimina los demás roles del grupo.
             * ========================================================
             */

            if (currentGroup && currentGroup !== group) {

                const oldSquadron = SQUADRONS[currentGroup];

                const oldIdentifiers = [
                    oldSquadron.role1,
                    oldSquadron.role7,
                    oldSquadron.role10
                ];

                const oldRolesToRemove = oldIdentifiers.filter(roleId =>
                    member.roles.cache.has(roleId)
                );

                if (oldRolesToRemove.length > 0) {
                    await member.roles.remove(oldRolesToRemove);
                }

                const newIdentifiers = [
                    squadron.role1,
                    squadron.role7,
                    squadron.role10
                ];

                const newRolesToAdd = newIdentifiers.filter(roleId =>
                    !member.roles.cache.has(roleId)
                );

                if (newRolesToAdd.length > 0) {
                    await member.roles.add(newRolesToAdd);
                }

                if (member.roles.cache.has(GUEST_ROLE)) {
                    await member.roles.remove(GUEST_ROLE);
                }

                return;
            }

            /*
             * ========================================================
             * MISMO GRUPO
             * ========================================================
             */

            const sameGroup =
                member.roles.cache.has(squadron.role1) &&
                member.roles.cache.has(squadron.role7) &&
                member.roles.cache.has(squadron.role10);

            if (sameGroup) {

                /*
                 * Buscar si ya tiene algún Type 3.
                 */

                const hasRole3 = TYPE_3_ROLES.some(roleId =>
                    member.roles.cache.has(roleId)
                );

                /*
                 * Buscar si ya tiene algún Type 5.
                 */

                const hasRole5 = TYPE_5_ROLES.some(roleId =>
                    member.roles.cache.has(roleId)
                );

                /*
                 * Si ya tiene ambos:
                 *
                 * NO SE HACE NADA.
                 *
                 * Esto reproduce exactamente:
                 *
                 * {{if and $hasRole3 $hasRole5}}
                 *
                 *     no hacer cambios
                 *
                 * {{end}}
                 */

                if (hasRole3 && hasRole5) {
                    return;
                }

                /*
                 * Si le falta Type 3 o Type 5:
                 *
                 * - Quita Guest
                 * - Agrega TODOS los roles del grupo.
                 *
                 * Discord no duplica un rol que ya posee.
                 */

                if (member.roles.cache.has(GUEST_ROLE)) {
                    await member.roles.remove(GUEST_ROLE);
                }

                const missingRoles = squadron.roles.filter(roleId =>
                    !member.roles.cache.has(roleId)
                );

                if (missingRoles.length > 0) {
                    await member.roles.add(missingRoles);
                }

                return;
            }

            /*
             * ========================================================
             * NO PERTENECE A NINGÚN GRUPO
             * ========================================================
             *
             * Exactamente como el YAGPDB:
             *
             * - Quita Guest
             * - Agrega todos los roles del grupo solicitado.
             * ========================================================
             */

            if (member.roles.cache.has(GUEST_ROLE)) {
                await member.roles.remove(GUEST_ROLE);
            }

            const rolesToAdd = squadron.roles.filter(roleId =>
                !member.roles.cache.has(roleId)
            );

            if (rolesToAdd.length > 0) {
                await member.roles.add(rolesToAdd);
            }

        } catch (error) {
            throw error;
        }
    }
};