import fs from "fs";
import path from "path";
import {
    fileURLToPath,
    pathToFileURL
} from "url";

const __filename =
    fileURLToPath(import.meta.url);

const __dirname =
    path.dirname(__filename);

export async function loadCommands(client) {
    const commandsPath =
        path.join(
            __dirname,
            "../commands"
        );

    const files =
        fs
            .readdirSync(commandsPath)
            .filter(
                file =>
                    file.endsWith(".js")
            );

    for (const file of files) {
        const filePath =
            path.join(
                commandsPath,
                file
            );

        const fileUrl =
            pathToFileURL(
                filePath
            ).href;

        try {
            const command =
                await import(
                    fileUrl
                );

            const commandData =
                command.default;

            if (
                !commandData?.name ||
                typeof commandData.execute !==
                    "function"
            ) {
                console.warn(
                    `Invalid command file: ${file}`
                );

                continue;
            }

            const commandName =
                commandData.name
                    .toLowerCase();

            /*
             * ========================================================
             * COMANDO PRINCIPAL
             * ========================================================
             */

            if (
                client.commands.has(
                    commandName
                )
            ) {
                console.warn(
                    `Command already registered: ${commandName}`
                );

                continue;
            }

            client.commands.set(
                commandName,
                commandData
            );

            console.log(
                `Command loaded: ${commandName}`
            );

            /*
             * ========================================================
             * ALIASES
             * ========================================================
             */

            const aliases =
                Array.isArray(
                    commandData.aliases
                )
                    ? commandData.aliases
                    : [];

            for (
                const alias of aliases
            ) {
                if (
                    typeof alias !==
                    "string"
                ) {
                    console.warn(
                        `Invalid alias for command ${commandName}:`,
                        alias
                    );

                    continue;
                }

                const aliasName =
                    alias
                        .trim()
                        .toLowerCase();

                if (
                    !aliasName
                ) {
                    continue;
                }

                if (
                    client.commands.has(
                        aliasName
                    )
                ) {
                    console.warn(
                        `Alias "${aliasName}" for "${commandName}" was not registered because it is already in use.`
                    );

                    continue;
                }

                client.commands.set(
                    aliasName,
                    commandData
                );

                console.log(
                    `Alias loaded: ${aliasName} → ${commandName}`
                );
            }
        } catch (error) {
            console.error(
                `Failed to load command ${file}:`,
                error
            );
        }
    }
}