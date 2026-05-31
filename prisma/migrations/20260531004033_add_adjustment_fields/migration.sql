-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "adjustedBy" TEXT,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'PAYMENT';
