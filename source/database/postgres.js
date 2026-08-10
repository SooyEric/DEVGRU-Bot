import pg from "pg";
import config from "../config/config.js";
import logger from "../utils/logger.js";
const { Pool } = pg;
let pool = null;
export function getDatabase() {
    if (!config.database.url) {
        logger.warn("DATABASE_URL is not configured.");
        return null;
    }
    if (!pool) {
        pool = new Pool({
            connectionString: config.database.url,
            ssl: {
                rejectUnauthorized: false
            }
        });
        pool.on("error", (error) => {
            logger.error("Unexpected PostgreSQL error:", error);
        });
    }
    return pool;
}
export async function testDatabaseConnection() {
    const database = getDatabase();
    if (!database) {
        return false;
    }
    try {
        await database.query("SELECT 1");
        logger.info("PostgreSQL connection successful.");
        return true;
    } catch (error) {
        logger.error("PostgreSQL connection failed:", error);
        return false;
    }
}
