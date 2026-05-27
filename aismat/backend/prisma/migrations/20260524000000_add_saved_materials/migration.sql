-- CreateTable
CREATE TABLE "saved_materials" (
    "user_id" INTEGER NOT NULL,
    "material_id" INTEGER NOT NULL,
    "saved_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_materials_pkey" PRIMARY KEY ("user_id", "material_id")
);

-- CreateIndex
CREATE INDEX "saved_materials_material_id_idx" ON "saved_materials"("material_id");

-- CreateIndex
CREATE INDEX "saved_materials_user_id_saved_at_idx" ON "saved_materials"("user_id", "saved_at" DESC);

-- AddForeignKey
ALTER TABLE "saved_materials" ADD CONSTRAINT "saved_materials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_materials" ADD CONSTRAINT "saved_materials_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
