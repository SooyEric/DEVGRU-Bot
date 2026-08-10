import { PermissionFlagsBits } from "discord.js";

// ============================================================
// ESCUADRONES
// ============================================================

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

// ============================================================
// ROL GUEST
// ============================================================

const GUEST_ROLE = "1373365890623602768";

// ============================================================
// ROLES COMPARTIDOS
// Estos roles NO se eliminan al cambiar de escuadron.
// ============================================================

const SHARED_ROLES = new Set([
    "1373365810910859265",
    "1373365831454556312",
    "1373365832914178179",
    "1373365840677703865",
    "1373365856524046488",
    "1373365865734738070",
    "1373365866657222819"
]);

// ============================================================
// TYPE 3
// ============================================================

const TYPE_3_ROLES = new Set([
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
]);

// ============================================================
// TYPE 5
// ============================================================

const TYPE_5_ROLES = new Set([
    "1373365833618690059",
    "1373365835862642713",
    "1373365837129318474",
    "1373365839037988894",
    "1373365839721529506",
    "1373365840677703865"
]);

// ============================================================
// ROLES PRINCIPALES / EXCLUSIVOS
//
// Son los roles que identifican a cada escuadron.
// Los roles compartidos NO se utilizan para detectar exclusividad.
// ============================================================

const SQUADRON_IDENTIFIER_ROLES = {
    red: new Set([
        "1373365804279791839",
        "1373365857928876243",
        "1373365867576033440"
    ]),

    blue: new Set([
        "1373365805693009920",
        "1373365858784514241",
        "1373365868569952298"
    ]),

    gold: new Set([
        "1373365806775406693",
        "1373365859640279124",
        "1373365870226571325"
    ]),

    black: new Set([
        "1373365808969023529",
        "1420221604020879463",
        "1420443645558919308"
    ]),

    silver: new Set([
        "1535720824257122476",
        "1535716558322540594",
        "1535716769417666653"
    ])
};

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

function getCurrentSquadron(member) {
    for (const [squadron, identifiers] of Object.entries(
        SQUADRON_IDENTIFIER_ROLES
    )) {
        if (identifiers.hasAny) {
            // No se utiliza; se mantiene fuera de la logica principal.
        }

        for (const roleId of identifiers) {
            if (member.roles.cache.has(roleId)) {
                return squadron;
            }
        }
    }

    return null;
}

function getAllSquadronRoles() {
    const roles = new Set();

    for (const squadron of Object.values(SQUADRONS)) {
        for (const roleId of squadron.roles) {
            roles.add(roleId);
        }
    }

    return roles;
}

const ALL_SQUADRON_ROLES = getAllSquadronRoles();

function getExistingType3(member) {
    return member.roles.cache.find(role =>
        TYPE_3_ROLES.has(role.id)
    );
}

function getExistingType5(member) {
    return member.roles.cache.find(role =>
        TYPE_5_ROLES.has(role.id)
    );
}

async function reactSuccess(message) {
    try {
        await message.react("✅");
    } catch {
        // Una falla al reaccionar no debe romper la ejecucion del comando.
    }
}

async function reactFailure(message) {
    try {
        await message.react("❌");
    } catch {
        // Una falla al reaccionar no debe ocultar el error original.
    }
}

// ============================================================
// RESOLVER USUARIO
// ============================================================

async function resolveMember(message, input) {
    if (!input) {
        return null;
    }

    // Primero intentamos una mencion.
    const mentionedMember = message.mentions.members.first();

    if (mentionedMember) {
        return mentionedMember;
    }

    // Si no hay mencion, intentamos ID.
    if (!/^\d{17,20}$/.test(input)) {
        return null;
    }

    try {
        return await message.guild.members.fetch(input);
    } catch {
        return null;
    }
}

// ============================================================
// ELIMINAR ROLES EXCLUSIVOS DE ESCUADRONES
//
// IMPORTANTE:
// - No elimina roles compartidos.
// - No elimina Type 3.
// - No elimina Type 5.
// - No elimina Guest aqui.
// ============================================================

async function removeExclusiveSquadronRoles(member) {
    const rolesToRemove = [];

    for (const role of member.roles.cache.values()) {
        if (!ALL_SQUADRON_ROLES.has(role.id)) {
            continue;
        }

        if (SHARED_ROLES.has(role.id)) {
            continue;
        }

        if (TYPE_3_ROLES.has(role.id)) {
            continue;
        }

        if (TYPE_5_ROLES.has(role.id)) {
            continue;
        }

        rolesToRemove.push(role.id);
    }

    if (rolesToRemove.length > 0) {
        await member.roles.remove(rolesToRemove);
    }
}

// ============================================================
// ELIMINAR TODO EL SISTEMA DE ESCUADRON + TYPE 3 + TYPE 5
//
// Utilizado exclusivamente para -add guest.
// ============================================================

async function removeEverythingForGuest(member) {
    const rolesToRemove = [];

    for (const role of member.roles.cache.values()) {
        const roleId = role.id;

        if (
            ALL_SQUADRON_ROLES.has(roleId) ||
            TYPE_3_ROLES.has(roleId) ||
            TYPE_5_ROLES.has(roleId)
        ) {
            rolesToRemove.push(roleId);
        }
    }

    if (rolesToRemove.length > 0) {
        await member.roles.remove(rolesToRemove);
    }
}

// ============================================================
// AÑADIR ESCUADRON
// ============================================================

async function assignSquadron(member, squadronName) {
    const squadron = SQUADRONS[squadronName];

    if (!squadron) {
        throw new Error(`Escuadron invalido: ${squadronName}`);
    }

    // Detectamos el rango existente ANTES de modificar roles.
    const existingType3 = getExistingType3(member);
    const existingType5 = getExistingType5(member);

    // Eliminamos roles exclusivos del escuadron anterior.
    await removeExclusiveSquadronRoles(member);

    // Guest nunca puede permanecer al pertenecer a un escuadron.
    if (member.roles.cache.has(GUEST_ROLE)) {
        await member.roles.remove(GUEST_ROLE);
    }

    // --------------------------------------------------------
    // TYPE 3
    // --------------------------------------------------------
    //
    // Si ya existe uno, no añadimos otro.
    //
    // Si no existe, se añade el Type 3 que forma parte
    // del paquete del escuadron.
    // --------------------------------------------------------

    const packageType3 = squadron.roles.find(roleId =>
        TYPE_3_ROLES.has(roleId)
    );

    // --------------------------------------------------------
    // TYPE 5
    // --------------------------------------------------------

    const packageType5 = squadron.roles.find(roleId =>
        TYPE_5_ROLES.has(roleId)
    );

    // Roles normales del paquete.
    const rolesToAdd = [];

    for (const roleId of squadron.roles) {
        // Type 3 existente: no añadir el del paquete.
        if (TYPE_3_ROLES.has(roleId)) {
            if (!existingType3) {
                rolesToAdd.push(roleId);
            }

            continue;
        }

        // Type 5 existente: no añadir el del paquete.
        if (TYPE_5_ROLES.has(roleId)) {
            if (!existingType5) {
                rolesToAdd.push(roleId);
            }

            continue;
        }

        // Roles normales.
        if (!member.roles.cache.has(roleId)) {
            rolesToAdd.push(roleId);
        }
    }

    if (rolesToAdd.length > 0) {
        await member.roles.add(rolesToAdd);
    }

    // --------------------------------------------------------
    // NICKNAME
    // --------------------------------------------------------

    await member.setNickname(squadron.nickname);
}

// ============================================================
// GUEST
// ============================================================

async function assignGuest(member) {
    await removeEverythingForGuest(member);

    // Añadir Guest si no lo tiene.
    if (!member.roles.cache.has(GUEST_ROLE)) {
        await member.roles.add(GUEST_ROLE);
    }

    // Restaurar nickname original.
    await member.setNickname(null);
}

// ============================================================
// COMANDO
// ============================================================

export default {
    name: "add",
    permission: 1,

    async execute(message, args) {
        // ----------------------------------------------------
        // VALIDACION BASICA
        // ----------------------------------------------------

        if (!message.guild) {
            await reactFailure(message);
            return;
        }

        if (args.length < 2) {
            await reactFailure(message);
            return;
        }

        const group = args[0]?.toLowerCase();
        const userInput = args[1];

        // ----------------------------------------------------
        // VALIDAR GRUPO
        // ----------------------------------------------------

        const validGroups = [
            "red",
            "blue",
            "gold",
            "black",
            "silver",
            "guest"
        ];

        if (!validGroups.includes(group)) {
            await reactFailure(message);
            return;
        }

        // ----------------------------------------------------
        // OBTENER MIEMBRO
        // ----------------------------------------------------

        const member = await resolveMember(message, userInput);

        if (!member) {
            await reactFailure(message);
            return;
        }

        // ----------------------------------------------------
        // GUEST
        // ----------------------------------------------------

        if (group === "guest") {
            try {
                await assignGuest(member);
                await reactSuccess(message);
                return;
            } catch (error) {
                await reactFailure(message);
                throw error;
            }
        }

        // ----------------------------------------------------
        // ESCUADRON
        // ----------------------------------------------------

        try {
            await assignSquadron(member, group);

            await reactSuccess(message);
        } catch (error) {
            await reactFailure(message);

            // app.js se encarga del logging universal.
            throw error;
        }
    }
};