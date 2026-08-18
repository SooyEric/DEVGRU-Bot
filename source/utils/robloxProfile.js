import { getDatabase } from "../database/postgres.js";

export async function initializeRobloxProfileTable() {
    const database =
        getDatabase();

    if (!database) {
        return;
    }

    await database.query(`
        CREATE TABLE IF NOT EXISTS roblox_profiles (
            discord_id TEXT PRIMARY KEY,
            roblox_id TEXT NOT NULL UNIQUE,
            roblox_username TEXT NOT NULL,
            roblox_profile_url TEXT NOT NULL,
            linked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
    `);
}

export async function getRobloxProfile(
    discordId
) {
    const database =
        getDatabase();

    if (!database) {
        return null;
    }

    const result =
        await database.query(
            `
            SELECT
                discord_id,
                roblox_id,
                roblox_username,
                roblox_profile_url,
                linked_at
            FROM roblox_profiles
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

export async function getRobloxProfileByRobloxId(
    robloxId
) {
    const database =
        getDatabase();

    if (!database) {
        return null;
    }

    const result =
        await database.query(
            `
            SELECT
                discord_id,
                roblox_id,
                roblox_username,
                roblox_profile_url,
                linked_at
            FROM roblox_profiles
            WHERE roblox_id = $1
            `,
            [
                robloxId
            ]
        );

    return (
        result.rows[0] ||
        null
    );
}

export async function saveRobloxProfile(
    discordId,
    robloxId,
    robloxUsername
) {
    const database =
        getDatabase();

    if (!database) {
        throw new Error(
            "DATABASE_URL is not configured."
        );
    }

    const robloxProfileUrl =
        `https://www.roblox.com/users/${robloxId}/profile`;

    await database.query(
        `
        INSERT INTO roblox_profiles
            (
                discord_id,
                roblox_id,
                roblox_username,
                roblox_profile_url
            )
        VALUES
            ($1, $2, $3, $4)

        ON CONFLICT (discord_id)
        DO UPDATE SET
            roblox_id = EXCLUDED.roblox_id,
            roblox_username = EXCLUDED.roblox_username,
            roblox_profile_url = EXCLUDED.roblox_profile_url
        `,
        [
            discordId,
            robloxId,
            robloxUsername,
            robloxProfileUrl
        ]
    );

    return {
        discordId,
        robloxId,
        robloxUsername,
        robloxProfileUrl
    };
}

export async function deleteRobloxProfile(
    discordId
) {
    const database =
        getDatabase();

    if (!database) {
        return;
    }

    await database.query(
        `
        DELETE FROM roblox_profiles
        WHERE discord_id = $1
        `,
        [
            discordId
        ]
    );
}