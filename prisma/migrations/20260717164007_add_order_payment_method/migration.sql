-- CreateEnum
CREATE TYPE "OrderPaymentMethod" AS ENUM ('counter', 'qris');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "payment_method" "OrderPaymentMethod" NOT NULL DEFAULT 'counter';
