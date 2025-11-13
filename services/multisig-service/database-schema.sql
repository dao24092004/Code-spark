-- Multisig Service database schema (PostgreSQL)
-- Run inside the target database (e.g., multisig_db)

BEGIN;

-- UUID helpers --------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Wallet table -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "MultisigWallets" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "contractAddress" VARCHAR(255) NOT NULL UNIQUE,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "creatorId" UUID,
    "owners" VARCHAR(255)[] NOT NULL,
    "threshold" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ENUM type for transaction status ----------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'enum_multisigtransactions_status'
    ) THEN
        CREATE TYPE "enum_MultisigTransactions_status" AS ENUM ('submitted', 'confirmed', 'executed', 'failed');
    END IF;
END$$;

-- Transaction table --------------------------------------------------------
CREATE TABLE IF NOT EXISTS "MultisigTransactions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "walletId" UUID REFERENCES "MultisigWallets" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
    "txIndexOnChain" INTEGER NOT NULL,
    "txHash" VARCHAR(255),
    "destination" VARCHAR(255) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "data" TEXT NOT NULL DEFAULT '0x',
    "status" "enum_MultisigTransactions_status" NOT NULL DEFAULT 'submitted',
    "confirmations" VARCHAR(255)[] NOT NULL DEFAULT '{}'::VARCHAR(255)[],
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("walletId", "txIndexOnChain")
);

-- Helpful indexes ---------------------------------------------------------
CREATE INDEX IF NOT EXISTS "MultisigTransactions_walletId_createdAt_idx"
    ON "MultisigTransactions" ("walletId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "MultisigTransactions_status_idx"
    ON "MultisigTransactions" ("status");

COMMIT;
