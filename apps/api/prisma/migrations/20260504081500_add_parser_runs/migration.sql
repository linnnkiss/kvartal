CREATE TABLE "ParserRun" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "city" TEXT,
    "dealType" "DealType",
    "requestedLimit" INTEGER NOT NULL,
    "total" INTEGER NOT NULL DEFAULT 0,
    "saved" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "ParserRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ParserRun_startedAt_idx" ON "ParserRun"("startedAt");
