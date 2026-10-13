-- XOF has no minor unit. Round any legacy fractional values to the nearest
-- whole franc, then store money as PostgreSQL INTEGER/Prisma Int.
-- A value outside the supported Int range (or a non-finite legacy value)
-- causes this migration to fail instead of silently truncating or overflowing.
ALTER TABLE "Tenant"
  ALTER COLUMN "rentAmount" TYPE INTEGER
  USING ROUND("rentAmount")::INTEGER;

ALTER TABLE "Payment"
  ALTER COLUMN "amount" TYPE INTEGER
  USING ROUND("amount")::INTEGER;

ALTER TABLE "Expense"
  ALTER COLUMN "amount" TYPE INTEGER
  USING ROUND("amount")::INTEGER;
