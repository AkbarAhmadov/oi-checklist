-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "userId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "checklistPublic" BOOLEAN NOT NULL DEFAULT false,
    "ascSort" BOOLEAN NOT NULL DEFAULT false,
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "theme" TEXT NOT NULL DEFAULT 'lightClassic',
    "olympiadOrder" JSONB,
    "platformPref" JSONB,
    "hiddenOlympiads" JSONB,
    "platformUsernames" JSONB,
    CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Settings" ("ascSort", "checklistPublic", "darkMode", "hiddenOlympiads", "olympiadOrder", "platformPref", "platformUsernames", "userId") SELECT "ascSort", "checklistPublic", "darkMode", "hiddenOlympiads", "olympiadOrder", "platformPref", "platformUsernames", "userId" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
UPDATE "Settings"
SET "theme" = 'darkClassic'
WHERE "darkMode" = 1;
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
