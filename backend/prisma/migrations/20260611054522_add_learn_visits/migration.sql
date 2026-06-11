-- CreateTable
CREATE TABLE "learn_visits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "zoneId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learn_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "learn_visits_userId_idx" ON "learn_visits"("userId");

-- CreateIndex
CREATE INDEX "learn_visits_zoneId_createdAt_idx" ON "learn_visits"("zoneId", "createdAt");

-- AddForeignKey
ALTER TABLE "learn_visits" ADD CONSTRAINT "learn_visits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
