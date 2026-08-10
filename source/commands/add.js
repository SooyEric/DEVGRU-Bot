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
        Object.values(SQUADRONS).flatMap(squadron => squadron.roles)
    )
];

const ALL_MANAGED_ROLES = [
    ...new Set([
        ...ALL_SQUADRON_ROLES,
        ...TYPE_3_ROLES,
        ...TYPE_5_ROLES,
        GUEST_ROLE
    ])
];

export default {
    name: "add",
    permission: 1,

    async execute(message, args) {
        const group = args[0]?.toLowerCase();
        const targetInput = args[1];

        // =========================
        // VALIDAR GRUPO
        // =========================

        const validGroups = [
            "red",
            "blue",
            "gold",
            "black",
            "silver",
            "guest"
        ];

        if (!group || !validGroups.includes(group)) {
            await message.react("❌");
            return;
        }

        // =========================
        // VALIDAR USUARIO
        // =========================

        if (!targetInput) {
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
        } catch {
            await message.react("❌");
            return;
        }

        if (!member) {
            await message.react("❌");
            return;
        }

        // =========================
        // GUEST
        // =========================

        if (group === "guest") {
            try {
                const rolesToRemove = member.roles.cache.filter(role =>
                    ALL_MANAGED_ROLES.includes(role.id)
                );

                if (rolesToRemove.size > 0) {
                    await member.roles.remove(rolesToRemove);
                }

                await member.roles.add(GUEST_ROLE);

                await member.setNickname(null);

                await message.react("✅");
                return;

            } catch (error) {
                await message.react("❌");
                throw error;
            }
        }

        // =========================
        // ESCUADRÓN
        // =========================

        const squadron = SQUADRONS[group];

        try {
            /*
             * IMPORTANTE:
             *
             * Primero eliminamos TODOS los roles administrados
             * de cualquier escuadrón.
             *
             * Esto evita que un rol de Gold, por ejemplo,
             * permanezca o vuelva a aparecer al pasar a Red.
             */

            const rolesToRemove = member.roles.cache.filter(role =>
                ALL_SQUADRON_ROLES.includes(role.id) ||
                role.id === GUEST_ROLE
            );

            if (rolesToRemove.size > 0) {
                await member.roles.remove(rolesToRemove);
            }

            /*
             * Ahora que el usuario está limpio de cualquier
             * escuadrón y de Guest, agregamos EXCLUSIVAMENTE
             * los roles del escuadrón solicitado.
             */

            await member.roles.add(squadron.roles);

            /*
             * Cambiar nickname
             */

            await member.setNickname(squadron.nickname);

            /*
             * ÉXITO
             */

            await message.react("✅");

        } catch (error) {
            await message.react("❌");
            throw error;
        }
    }
};