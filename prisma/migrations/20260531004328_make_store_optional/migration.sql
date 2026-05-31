-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_storeId_fkey";

-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "storeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
