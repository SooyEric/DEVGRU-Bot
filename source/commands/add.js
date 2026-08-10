const SQUADRONS = {
red: {
nickname: “SOE1 Alpha”,
roles: [
“1373365804279791839”,
“1373365810910859265”,
“1373365831454556312”,
“1373365832914178179”,
“1373365840677703865”,
“1373365856524046488”,
“1373365857928876243”,
“1373365865734738070”,
“1373365866657222819”,
“1373365867576033440”
],
identifiers: [
“1373365804279791839”,
“1373365857928876243”,
“1373365867576033440”
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
    ],
    identifiers: [
        "1373365805693009920",
        "1373365858784514241",
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
    ],
    identifiers: [
        "1373365806775406693",
        "1373365859640279124",
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
    ],
    identifiers: [
        "1373365808969023529",
        "1420221604020879463",
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
    ],
    identifiers: [
        "1535720824257122476",
        "1535716558322540594",
        "1535716769417666653"
    ]
}

};

const GUEST_ROLE = “1373365890623602768”;

const TYPE_3_ROLES = [
“1373365811858768005”,
“1373365812383187047”,
“1373365813490483313”,
“1373365814341799958”,
“1373365815524724966”,
“1373365816539480267”,
“1373365817386860729”,
“1373365818112348235”,
“1373365819383480370”,
“1373365820217884815”,
“1373365821543284796”,
“1373365822281748637”,
“1373365823841894531”,
“1373365824932548679”,
“1373365827239280751”,
“1373365828388655196”,
“1373365829860593735”,
“1373365830359847036”,
“1373365831454556312”
];

const TYPE_5_ROLES = [
“1373365833618690059”,
“1373365835862642713”,
“1373365837129318474”,
“1373365839037988894”,
“1373365839721529506”,
“1373365840677703865”
];

const ALL_SQUADRON_ROLES = [
…new Set(
Object.values(SQUADRONS).flatMap(squadron => squadron.roles)
)
];

// Roles que aparecen en más de un escuadrón.
// Estos NUNCA se eliminan al cambiar de escuadrón.
const SHARED_SQUADRON_ROLES = [
…new Set(
ALL_SQUADRON_ROLES.filter(roleId =>
Object.values(SQUADRONS).filter(squadron =>
squadron.roles.includes(roleId)
).length > 1
)
)
];

export default {
name: “add”,
permission: 1,

async execute(message, args) {
    const group = args[0]?.toLowerCase();
    const targetInput = args[1];
    // =========================
    // VALIDACIÓN DEL GRUPO
    // =========================
    if (
        !group ||
        !["red", "blue", "gold", "black", "silver", "guest"].includes(group)
    ) {
        await message.react("❌");
        return;
    }
    // =========================
    // VALIDACIÓN DEL USUARIO
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
    try {
        // =========================
        // GUEST
        // =========================
        if (group === "guest") {
            const rolesToRemove = new Set([
                ...ALL_SQUADRON_ROLES,
                ...TYPE_3_ROLES,
                ...TYPE_5_ROLES,
                GUEST_ROLE
            ]);
            const removableRoles = member.roles.cache.filter(role =>
                rolesToRemove.has(role.id)
            );
            if (removableRoles.size > 0) {
                await member.roles.remove(removableRoles);
            }
            await member.roles.add(GUEST_ROLE);
            // Restaurar nickname original
            await member.setNickname(null);
            await message.react("✅");
            return;
        }
        const squadron = SQUADRONS[group];
        // =========================
        // DETECTAR ESCUADRÓN ACTUAL
        // =========================
        let currentSquadron = null;
        for (const [name, data] of Object.entries(SQUADRONS)) {
            const hasAllIdentifiers = data.identifiers.every(roleId =>
                member.roles.cache.has(roleId)
            );
            if (hasAllIdentifiers) {
                currentSquadron = name;
                break;
            }
        }
        // =========================
        // YA ESTÁ EN EL ESCUADRÓN
        // =========================
        if (currentSquadron === group) {
            const hasType3 = TYPE_3_ROLES.some(roleId =>
                member.roles.cache.has(roleId)
            );
            const hasType5 = TYPE_5_ROLES.some(roleId =>
                member.roles.cache.has(roleId)
            );
            // Ya tiene todo lo necesario.
            if (hasType3 && hasType5) {
                // Asegurar que no conserve Guest.
                if (member.roles.cache.has(GUEST_ROLE)) {
                    await member.roles.remove(GUEST_ROLE);
                }
                await message.react("✅");
                return;
            }
            // Reparar paquete de escuadrón.
            const missingRoles = squadron.roles.filter(roleId =>
                !member.roles.cache.has(roleId)
            );
            if (missingRoles.length > 0) {
                await member.roles.add(missingRoles);
            }
            // Un miembro de escuadrón no puede conservar Guest.
            if (member.roles.cache.has(GUEST_ROLE)) {
                await member.roles.remove(GUEST_ROLE);
            }
            await member.setNickname(squadron.nickname);
            await message.react("✅");
            return;
        }
        // =========================
        // CAMBIO DE ESCUADRÓN
        // =========================
        if (currentSquadron) {
            const oldSquadron = SQUADRONS[currentSquadron];
            /*
             * Eliminar únicamente los roles exclusivos
             * del escuadrón anterior.
             *
             * Los roles compartidos permanecen.
             */
            const oldExclusiveRoles = oldSquadron.roles.filter(
                roleId => !SHARED_SQUADRON_ROLES.includes(roleId)
            );
            const rolesToRemove = oldExclusiveRoles.filter(roleId =>
                member.roles.cache.has(roleId)
            );
            if (rolesToRemove.length > 0) {
                await member.roles.remove(rolesToRemove);
            }
        }
        // =========================
        // ELIMINAR GUEST
        // =========================
        if (member.roles.cache.has(GUEST_ROLE)) {
            await member.roles.remove(GUEST_ROLE);
        }
        // =========================
        // ASIGNAR NUEVO ESCUADRÓN
        // =========================
        const missingSquadronRoles = squadron.roles.filter(roleId =>
            !member.roles.cache.has(roleId)
        );
        if (missingSquadronRoles.length > 0) {
            await member.roles.add(missingSquadronRoles);
        }
        // =========================
        // NICKNAME
        // =========================
        await member.setNickname(squadron.nickname);
        // =========================
        // ÉXITO
        // =========================
        await message.react("✅");
    } catch (error) {
        await message.react("❌");
        throw error;
    }
}

};