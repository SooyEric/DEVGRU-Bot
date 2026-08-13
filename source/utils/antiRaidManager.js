import { getDatabase } from "../database/postgres.js";

export async function initializeAntiRaidTable() {
    const database = getDatabase();

    if (!database) return;

    await database.query(`
        CREATE TABLE IF NOT EXISTS antiraid_members (
            user_id TEXT PRIMARY KEY,
            role_ids TEXT[] NOT NULL DEFAULT '{}',
            restored BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    `);
}

export async function saveAntiRaidRoles(
    userId,
    roleIds
) {
    const database = getDatabase();

    if (!database) {
        throw new Error(
            "DATABASE_URL is not configured."
        );
    }

    await database.query(
        `
        INSERT INTO antiraid_members (
            user_id,
            role_ids,
            restored
        )
        VALUES (
            $1,
            $2,
            FALSE
        )

        ON CONFLICT (user_id)
        DO UPDATE SET
            role_ids = EXCLUDED.role_ids,
            restored = FALSE,
            created_at = NOW()
        `,
        [
            userId,
            roleIds
        ]
    );
}

export async function getAntiRaidMember(
    userId
) {
    const database = getDatabase();

    if (!database) return null;

    const result =
        await database.query(
            `
            SELECT
                user_id,
                role_ids,
                restored,
                created_at
            FROM antiraid_members
            WHERE user_id = $1
            `,
            [userId]
        );

    return result.rows[0] || null;
}

export async function getAllAntiRaidMembers() {
    const database = getDatabase();

    if (!database) return [];

    const result =
        await database.query(
            `
            SELECT
                user_id,
                role_ids,
                restored,
                created_at
            FROM antiraid_members
            WHERE restored = FALSE
            `
        );

    return result.rows;
}

export async function markAntiRaidRestored(
    userId
) {
    const database = getDatabase();

    if (!database) return;

    await database.query(
        `
        UPDATE antiraid_members
        SET restored = TRUE
        WHERE user_id = $1
        `,
        [userId]
    );
}