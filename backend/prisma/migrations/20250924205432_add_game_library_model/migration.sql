-- CreateTable
CREATE TABLE "games" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "igdbId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "coverUrl" TEXT,
    "releaseDate" DATETIME,
    "platforms" TEXT,
    "genres" TEXT,
    "developer" TEXT,
    "publisher" TEXT,
    "rating" REAL,
    "status" TEXT NOT NULL DEFAULT 'wishlist',
    "userRating" REAL,
    "notes" TEXT,
    "progress" TEXT,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "games_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "games_userId_igdbId_key" ON "games"("userId", "igdbId");
