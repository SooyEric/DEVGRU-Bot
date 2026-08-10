const SQUADRONS = {
    red: {
        group: "Alpha",
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
        group: "Bravo",
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
        group: "Charlie",
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
        group: "Delta",
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
        group: "Echo",
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

const RANK_ROLES = [
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

const ALL_SQUADRON_ROLES = [
    ...new Set(
        Object.values(SQUADRONS).flatMap(squadron => squadron.roles)
    )
];

const RANK_NAMES = new Map(
    RANK_ROLES.map((roleId, index) => [
        roleId,
        `SOE${RANK_ROLES.length - index}`
    ])
);

export default {
    name: "add",
    permission: 1,

    async execute(message, args) {
        const group = args[0]?.toLowerCase();
        const targetInput = args[1];

        if (!["red", "blue", "gold", "black", "silver", "guest"].includes(group)) {
            await message.react("❌");
            return;
        }

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
            // =========================
            // GUEST
            // =========================

            if (group === "guest") {
                const rolesToRemove = [
                    ...ALL_SQUADRON_ROLES,
                    ...RANK_ROLES,
                    GUEST_ROLE
                ];

                const removableRoles = member.roles.cache.filter(role =>
                    rolesToRemove.includes(role.id)
                );

                if (removableRoles.size > 0) {
                    await member.roles.remove(removableRoles);
                }

                await member.setNickname(null);
                await member.roles.add(GUEST_ROLE);

                await message.react("✅");
                return;
            }

            const squadron = SQUADRONS[group];

            // =========================
            // DETECTAR RANGO ACTUAL
            // =========================

            let existingRank = RANK_ROLES.find(roleId =>
                member.roles.cache.has(roleId)
            );

            // =========================
            // DETECTAR PLACA ACTUAL
            // =========================

            let plate = null;

            const nickname = member.nickname;

            if (nickname) {
                const match = nickname.match(/\s(\d{2})$/);

                if (match) {
                    plate = match[1];
                }
            }

            // =========================
            // ELIMINAR ESCUADRÓN ACTUAL
            // =========================

            const rolesToRemove = member.roles.cache.filter(role =>
                ALL_SQUADRON_ROLES.includes(role.id)
            );

            if (rolesToRemove.size > 0) {
                await member.roles.remove(rolesToRemove);
            }

            await member.roles.remove(GUEST_ROLE);

            // =========================
            // NICKNAME
            // =========================

            let rankName;

            if (existingRank) {
                rankName = RANK_NAMES.get(existingRank);
            } else {
                rankName = "SOE1";
                existingRank = "1373365831454556312";
            }

            const newNickname = plate
                ? `${rankName} ${squadron.group} ${plate}`
                : `${rankName} ${squadron.group}`;

            await member.setNickname(newNickname);

            // =========================
            // RESTAURAR / ASIGNAR RANGO
            // =========================

            if (existingRank) {
                await member.roles.add(existingRank);
            }

            // =========================
            // AGREGAR ESCUADRÓN
            // =========================

            for (const roleId of squadron.roles) {
                if (roleId === "1373365831454556312") {
                    if (existingRank) {
                        continue;
                    }
                }

                await member.roles.add(roleId);
            }

            await message.react("✅");

        } catch (error) {
            await message.react("❌");
            throw error;
        }
    }
};