import { getDatabase } from "../database/postgres.js";

export async function initializeBanTable() {
    const database = getDatabase();

    if (!database) return;

    await database.query(`
        CREATE TABLE IF NOT EXISTS banned_members (
            user_id TEXT PRIMARY KEY,
            role_ids TEXT[] NOT NULL,
            nickname TEXT,
            log_message_id TEXT,
            restored BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    `);

    /*
     * Si la tabla ya existía antes de añadir nickname,
     * PostgreSQL agregará la columna sin borrar los datos existentes.
     */
    await database.query(`
        ALTER TABLE banned_members
        ADD COLUMN IF NOT EXISTS nickname TEXT
    `);
}

export async function saveBannedMember(
    userId,
    roleIds,
    nickname,
    logMessageId
) {
    const database = getDatabase();

    if (!database) {
        throw new Error("DATABASE_URL is not configured.");
    }

    await database.query(
        `
        INSERT INTO banned_members
            (
                user_id,
                role_ids,
                nickname,
                log_message_id,
                restored
            )
        VALUES
            ($1, $2, $3, $4, FALSE)

        ON CONFLICT (user_id)
        DO UPDATE SET
            role_ids = EXCLUDED.role_ids,
            nickname = EXCLUDED.nickname,
            log_message_id = EXCLUDED.log_message_id,
            restored = FALSE,
            created_at = NOW()
        `,
        [
            userId,
            roleIds,
            nickname,
            logMessageId
        ]
    );
}

export async function getBannedMember(userId) {
    const database = getDatabase();

    if (!database) return null;

    const result = await database.query(
        `
        SELECT *
        FROM banned_members
        WHERE user_id = $1
        `,
        [userId]
    );

    return result.rows[0] || null;
}

export async function getAllBannedMembers() {
    const database = getDatabase();

    if (!database) return [];

    const result = await database.query(`
        SELECT *
        FROM banned_members
        WHERE restored = FALSE
    `);

    return result.rows;
}

export async function markRestored(userId) {
    const database = getDatabase();

    if (!database) return;

    await database.query(
        `
        UPDATE banned_members
        SET restored = TRUE
        WHERE user_id = $1
        `,
        [userId]
    );
}