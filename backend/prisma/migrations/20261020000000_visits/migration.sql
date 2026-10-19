-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "deviceType" TEXT NOT NULL,
    "browser" TEXT,
    "os" TEXT,
    "userAgent" TEXT,
    "referrerHost" TEXT,
    "path" TEXT,
    "language" TEXT,
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "pageViews" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Visit_createdAt_idx" ON "Visit"("createdAt");

-- CreateIndex
CREATE INDEX "Visit_ip_createdAt_idx" ON "Visit"("ip", "createdAt");

-- CreateIndex
CREATE INDEX "Visit_ip_userAgent_lastSeenAt_idx" ON "Visit"("ip", "userAgent", "lastSeenAt");
