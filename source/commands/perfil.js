import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from "discord.js";

import { getDatabase } from "../database/postgres.js";

import {
    createProfileRobloxAuthorization
} from "../utils/robloxProfileOAuth.js";

const EMBED_COLOR =
    "#ffaf1a";

const ROBLOX_TABLE =
    "discord_roblox_profiles";

const SQUADRONS = [
    {
        id:
            "1373365857928876243",
        name:
            "Red Squadron"
    },
    {
        id:
            "1373365858784514241",
        name:
            "Blue Squadron"
    },
    {
        id:
            "1373365859640279124",
        name:
            "Gold Squadron"
    },
    {
        id:
            "1420221604020879463",
        name:
            "Black Squadron"
    },
    {
        id:
            "1535716558322540594",
        name:
            "Silver Squadron"
    }
];

const RANKS = [
    {
        id: "1373365831454556312",
        name: "Seaman Recruit",
        short: "SOE1"
    },
    {
        id: "1373365830359847036",
        name: "Seaman Apprentice",
        short: "SOE2"
    },
    {
        id: "1373365829860593735",
        name: "Seaman",
        short: "SOE3"
    },
    {
        id: "1373365828388655196",
        name: "Petty Officer Third Class",
        short: "SOE4"
    },
    {
        id: "1373365827239280751",
        name: "Petty Officer Second Class",
        short: "SOE5"
    },
    {
        id: "1373365824932548679",
        name: "Petty Officer First Class",
        short: "SOE6"
    },
    {
        id: "1373365823841894531",
        name: "Chief Petty Officer",
        short: "SOE7"
    },
    {
        id: "1373365822281748637",
        name: "Senior Chief Petty Officer",
        short: "SOE8"
    },
    {
        id: "1373365821543284796",
        name: "Master Chief Petty Officer",
        short: "SOE9"
    },
    {
        id: "1373365820217884815",
        name: "Ensign",
        short: "SO1"
    },
    {
        id: "1373365819383480370",
        name: "Lieutenant Junior Grade",
        short: "SO2"
    },
    {
        id: "1373365818112348235",
        name: "Lieutenant",
        short: "SO3"
    },
    {
        id: "1373365817386860729",
        name: "Lieutenant Commander",
        short: "SO4"
    },
    {
        id: "1373365816539480267",
        name: "Commander",
        short: "SO5"
    },
    {
        id: "1373365815524724966",
        name: "Captain",
        short: "SO6"
    }
];

let databaseInitialized =
    false;

let databaseInitializing =
    null;

async function initializeDatabase() {
    if (databaseInitialized) {
        return;
    }

    if (databaseInitializing) {
        await databaseInitializing;
        return;
    }

    databaseInitializing =
        (async () => {
            const database =
                getDatabase();

            if (!database) {
                throw new Error(
                    "PostgreSQL no está disponible."
                );
            }

            await database.query(`
                CREATE TABLE IF NOT EXISTS ${ROBLOX_TABLE} (
                    discord_id TEXT PRIMARY KEY,
                    roblox_id TEXT NOT NULL,
                    roblox_username TEXT NOT NULL,
                    verified_at BIGINT NOT NULL
                )
            `);

            databaseInitialized =
                true;
        })();

    try {
        await databaseInitializing;
    } finally {
        databaseInitializing =
            null;
    }
}

async function getLinkedAccount(
    discordId
) {
    await initializeDatabase();

    const database =
        getDatabase();

    const result =
        await database.query(
            `
                SELECT
                    discord_id,
                    roblox_id,
                    roblox_username,
                    verified_at
                FROM ${ROBLOX_TABLE}
                WHERE discord_id = $1
            `,
            [
                discordId
            ]
        );

    return (
        result.rows[0] ||
        null
    );
}

async function saveLinkedAccount(
    discordId,
    robloxId,
    robloxUsername
) {
    await initializeDatabase();

    const database =
        getDatabase();

    await database.query(
        `
            INSERT INTO ${ROBLOX_TABLE} (
                discord_id,
                roblox_id,
                roblox_username,
                verified_at
            )
            VALUES (
                $1,
                $2,
                $3,
                $4
            )
            ON CONFLICT (discord_id)
            DO UPDATE SET
                roblox_id =
                    EXCLUDED.roblox_id,
                roblox_username =
                    EXCLUDED.roblox_username,
                verified_at =
                    EXCLUDED.verified_at
        `,
        [
            discordId,
            String(robloxId),
            robloxUsername,
            Date.now()
        ]
    );
}

function getRank(
    member
) {
    for (
        const rank of RANKS
    ) {
        if (
            member.roles.cache.has(
                rank.id
            )
        ) {
            return rank.short;
        }
    }

    return "Sin rango";
}

function getSquadron(
    member
) {
    for (
        const squadron of SQUADRONS
    ) {
        if (
            member.roles.cache.has(
                squadron.id
            )
        ) {
            return squadron.name;
        }
    }

    return "Sin escuadrón";
}

function getProfileEmbed(
    member,
    robloxAccount
) {
    return new EmbedBuilder()
        .setColor(
            EMBED_COLOR
        )
        .setTitle(
            `Perfil de @${member.user.username}`
        )
        .setThumbnail(
            member.user.displayAvatarURL({
                size: 256,
                extension: "png"
            })
        )
        .setDescription(
            `<:persona:1538099937391288380> **Usuario de Discord**: \`${member.user.username}\`\n` +
            `<:roblox:1538379754414145536> **Usuario de Roblox**: \`${robloxAccount.roblox_username}\`\n\n` +
            `<:rango:1538381219631464448> **Rango**: \`${getRank(member)}\`\n` +
            `<:squad:1538380150746521651> **Escuadrón**: \`${getSquadron(member)}\``
        )
        .setFooter({
            text:
                `Información solicitada • ${new Date().toLocaleString(
                    "es-MX",
                    {
                        dateStyle:
                            "short",
                        timeStyle:
                            "short"
                    }
                )}`
        });
}

function getNotLinkedEmbed() {
    return new EmbedBuilder()
        .setColor(
            EMBED_COLOR
        )
        .setTitle(
            "Perfil"
        )
        .setDescription(
            "Para continuar, primero vincula una cuenta de Roblox válida."
        );
}

function getNotLinkedButtons() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    "perfil_link"
                )
                .setLabel(
                    "Vincular"
                )
                .setStyle(
                    ButtonStyle.Secondary
                )
        );
}

function getVerificationEmbed(
    username
) {
    return new EmbedBuilder()
        .setColor(
            EMBED_COLOR
        )
        .setTitle(
            "Vincular cuenta de Roblox"
        )
        .setDescription(
            `<:roblox:1538379754414145536> **Cuenta encontrada**\n\n` +
            `**Usuario:** \`${username}\`\n\n` +
            "Verifica que esta sea tu cuenta antes de continuar."
        );
}

function getVerificationButtons(
    verifyUrl
) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel(
                    "Verificar"
                )
                .setStyle(
                    ButtonStyle.Link
                )
                .setURL(
                    verifyUrl
                ),

            new ButtonBuilder()
                .setCustomId(
                    "perfil_link_cancel"
                )
                .setLabel(
                    "X"
                )
                .setStyle(
                    ButtonStyle.Danger
                )
        );
}

function getUsernameModal() {
    const modal =
        new ModalBuilder()
            .setCustomId(
                "perfil_roblox_modal"
            )
            .setTitle(
                "Vincular cuenta de Roblox"
            );

    const usernameInput =
        new TextInputBuilder()
            .setCustomId(
                "perfil_roblox_username"
            )
            .setLabel(
                "Usuario de Roblox"
            )
            .setPlaceholder(
                "Escribe tu usuario de Roblox"
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setRequired(
                true
            )
            .setMaxLength(
                50
            );

    modal.addComponents(
        new ActionRowBuilder()
            .addComponents(
                usernameInput
            )
    );

    return modal;
}

async function getTargetMember(
    message,
    args
) {
    let member =
        message.mentions.members.first();

    if (member) {
        return member;
    }

    if (
        args[0] &&
        /^\d{17,20}$/.test(
            args[0]
        )
    ) {
        try {
            return await message.guild.members.fetch(
                args[0]
            );
        } catch {
            return null;
        }
    }

    return message.member;
}

export default {
    name:
        "perfil",

    permission:
        2,

    async execute(
        message,
        args
    ) {
        const target =
            await getTargetMember(
                message,
                args
            );

        if (!target) {
            return;
        }

        const linkedAccount =
            await getLinkedAccount(
                target.id
            );

        if (!linkedAccount) {
            await message.reply({
                embeds: [
                    getNotLinkedEmbed()
                ],
                components:
                    target.id ===
                    message.author.id
                        ? [
                            getNotLinkedButtons()
                        ]
                        : []
            });

            return;
        }

        await message.reply({
            embeds: [
                getProfileEmbed(
                    target,
                    linkedAccount
                )
            ]
        });
    },

    async handleInteraction(
        interaction
    ) {
        if (
            interaction.customId ===
            "perfil_link"
        ) {
            if (
                !interaction.isButton()
            ) {
                return;
            }

            await interaction.showModal(
                getUsernameModal()
            );

            return;
        }

        if (
            interaction.customId ===
            "perfil_link_cancel"
        ) {
            if (
                !interaction.isButton()
            ) {
                return;
            }

            await interaction.update({
                embeds: [],
                components: []
            });

            return;
        }

        if (
            interaction.customId !==
            "perfil_roblox_modal"
        ) {
            return;
        }

        if (
            !interaction.isModalSubmit()
        ) {
            return;
        }

        const username =
            interaction.fields
                .getTextInputValue(
                    "perfil_roblox_username"
                )
                .trim();

        if (!username) {
            await interaction.reply({
                content:
                    "Debes escribir un usuario de Roblox válido.",
                ephemeral:
                    true
            });

            return;
        }

        const verifyUrl =
            createProfileRobloxAuthorization(
                interaction.user.id,
                username,
                interaction.channelId,
                interaction.message.id
            );

        await interaction.update({
            embeds: [
                getVerificationEmbed(
                    username
                )
            ],
            components: [
                getVerificationButtons(
                    verifyUrl
                )
            ]
        });
    },

    getLinkedAccount,
    saveLinkedAccount
};