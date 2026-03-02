/*
  Warnings:

  - You are about to drop the column `darkMode` on the `Settings` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "userId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "checklistPublic" BOOLEAN NOT NULL DEFAULT false,
    "ascSort" BOOLEAN NOT NULL DEFAULT false,
    "theme" TEXT NOT NULL DEFAULT 'lightClassic',
    "olympiadOrder" JSONB,
    "platformPref" JSONB,
    "hiddenOlympiads" JSONB,
    "platformUsernames" JSONB,
    CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Settings" ("ascSort", "checklistPublic", "hiddenOlympiads", "olympiadOrder", "platformPref", "platformUsernames", "theme", "userId") SELECT "ascSort", "checklistPublic", "hiddenOlympiads", "olympiadOrder", "platformPref", "platformUsernames", "theme", "userId" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
