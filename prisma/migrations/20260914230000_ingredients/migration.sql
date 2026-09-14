-- Greenfield: enums Category/Unit и таблица ingredients с обязательным владельцем.
-- Без backfill/DELETE: дубликаты имён и «сироты» не перекладываются на первого пользователя.
--
-- Если `ingredients` уже есть после `db push`:
--   1) сверьте схему с prisma/schema.prisma вручную, либо
--   2) `npx prisma migrate reset` (dev), либо
--   3) отметьте baseline: `npx prisma migrate resolve --applied 20260914230000_ingredients`
--      после ручного приведения БД к этой схеме.

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('VEGETABLES', 'FRUITS', 'MEAT', 'DAIRY', 'SPICES', 'OTHER');

-- CreateEnum
CREATE TYPE "Unit" AS ENUM ('GRAMS', 'KILOGRAMS', 'LITERS', 'MILLILITERS', 'PIECES');

-- CreateTable
CREATE TABLE "ingredients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "unit" "Unit" NOT NULL,
    "price_per_unit" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ingredients_user_id_idx" ON "ingredients"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_user_id_name_key" ON "ingredients"("user_id", "name");

-- AddForeignKey
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
