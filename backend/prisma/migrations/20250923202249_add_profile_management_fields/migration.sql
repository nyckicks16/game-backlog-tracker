-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "googleId" TEXT,
    "profilePicture" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'google',
    "displayName" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "preferences" TEXT,
    "lastLogin" DATETIME,
    "refreshToken" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("createdAt", "email", "failedLoginAttempts", "firstName", "googleId", "id", "lastLogin", "lastName", "lockedUntil", "profilePicture", "provider", "refreshToken", "updatedAt", "username") SELECT "createdAt", "email", "failedLoginAttempts", "firstName", "googleId", "id", "lastLogin", "lastName", "lockedUntil", "profilePicture", "provider", "refreshToken", "updatedAt", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
