-- CreateEnum
CREATE TYPE "plan_status" AS ENUM ('todo', 'in_progress', 'done');

-- CreateTable
CREATE TABLE "learning_plan_items" (
    "user_id" INTEGER NOT NULL,
    "material_id" INTEGER NOT NULL,
    "status" "plan_status" NOT NULL DEFAULT 'todo',
    "position" INTEGER NOT NULL DEFAULT 0,
    "added_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "learning_plan_items_pkey" PRIMARY KEY ("user_id", "material_id")
);

-- CreateIndex
CREATE INDEX "learning_plan_items_user_id_status_position_idx" ON "learning_plan_items"("user_id", "status", "position");

-- CreateIndex
CREATE INDEX "learning_plan_items_material_id_idx" ON "learning_plan_items"("material_id");

-- AddForeignKey
ALTER TABLE "learning_plan_items" ADD CONSTRAINT "learning_plan_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_plan_items" ADD CONSTRAINT "learning_plan_items_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
