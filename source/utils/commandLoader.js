import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadCommands(client) {
    const commandsPath = path.join(__dirname, "../commands");

    const files = fs
        .readdirSync(commandsPath)
        .filter(file => file.endsWith(".js"));

    for (const file of files) {
        const filePath = path.join(commandsPath, file);
        const fileUrl = pathToFileURL(filePath).href;

        try {
            const command = await import(fileUrl);

            const commandData = command.default;

            if (!commandData?.name || typeof commandData.execute !== "function") {
                console.warn(`Invalid command file: ${file}`);
                continue;
            }

            client.commands.set(commandData.name, commandData);

            console.log(`Command loaded: ${commandData.name}`);
        } catch (error) {
            console.error(`Failed to load command ${file}:`, error);
        }
    }
}