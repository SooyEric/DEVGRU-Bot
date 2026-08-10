import fs from "fs";
import { execSync } from "child_process";

const VERSION_FILE = "source/config/version.js";

const currentVersionFile = fs.readFileSync(VERSION_FILE, "utf8");

const versionMatch = currentVersionFile.match(
    /number:\s*"(\d+)\.(\d+)\.(\d+)"/
);

if (!versionMatch) {
    throw new Error("No se pudo encontrar la versión actual.");
}

let major = Number(versionMatch[1]);
let minor = Number(versionMatch[2]);
let patch = Number(versionMatch[3]);

const previousCommit = process.env.GITHUB_EVENT_BEFORE;

if (!previousCommit || /^0+$/.test(previousCommit)) {
    console.log("Primer commit detectado. No se modifica la versión.");
    process.exit(0);
}

const changedFiles = execSync(
    `git diff --name-status ${previousCommit} HEAD`,
    { encoding: "utf8" }
)
    .trim()
    .split("\n")
    .filter(Boolean);

if (changedFiles.length === 0) {
    console.log("No hubo cambios.");
    process.exit(0);
}

let patchChanges = 0;
let minorChanges = 0;
let majorChanges = 0;

for (const line of changedFiles) {
    const [status, file] = line.split("\t");

    if (!file) continue;

    // Ignorar archivos que no forman parte del código del bot.
    if (
        file === VERSION_FILE ||
        file === "package-lock.json" ||
        file === "package.json" ||
        file === "README.md"
    ) {
        continue;
    }

    // Nueva categoría/directorio dentro de source/
    if (
        status === "A" &&
        /^source\/[^/]+\/$/.test(file)
    ) {
        majorChanges++;
        continue;
    }

    // Nuevo script
    if (
        status === "A" &&
        file.startsWith("source/") &&
        file.endsWith(".js")
    ) {
        minorChanges++;
        continue;
    }

    // Modificación de script existente
    if (
        status === "M" &&
        file.startsWith("source/") &&
        file.endsWith(".js")
    ) {
        patchChanges++;
    }
}

if (majorChanges > 0) {
    major += majorChanges;
    minor = 0;
    patch = 0;
} else if (minorChanges > 0) {
    minor += minorChanges;
    patch = 0;
} else if (patchChanges > 0) {
    patch += patchChanges;

    // Cada 10 modificaciones de scripts:
    // 1.0.10 -> 1.1.0
    while (patch >= 10) {
        patch -= 10;
        minor++;
    }
}

const newVersion = `${major}.${minor}.${patch}`;

let type = "Actualización";
let description = "Actualización del bot.";

if (majorChanges > 0) {
    type = "Nueva categoría";
    description = "Se añadió una nueva categoría o sistema principal.";
} else if (minorChanges > 0) {
    type = "Nuevo script";
    description = "Se añadió uno o más scripts nuevos.";
} else if (patchChanges > 0) {
    type = "Modificación";
    description = `Se modificaron ${patchChanges} script${patchChanges === 1 ? "" : "s"}.`;
} else {
    console.log("No hay cambios relevantes para actualizar la versión.");
    process.exit(0);
}

const newContent = `const version = {
    number: "${newVersion}",
    type: "${type}",
    description: "${description}"
};

export default version;
`;

fs.writeFileSync(VERSION_FILE, newContent);

console.log(`Versión actualizada: ${newVersion}`);
