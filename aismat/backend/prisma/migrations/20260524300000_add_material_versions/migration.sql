-- AlterTable Material — додаємо поля версіонування та soft delete
ALTER TABLE "materials" ADD COLUMN "current_version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "materials" ADD COLUMN "deleted_at" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "materials_deleted_at_idx" ON "materials"("deleted_at");

-- CreateTable material_versions — snapshot-history
CREATE TABLE "material_versions" (
    "id" SERIAL NOT NULL,
    "material_id" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "file_url" VARCHAR(512) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" VARCHAR(128) NOT NULL,
    "uploaded_by" INTEGER NOT NULL,
    "change_note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "material_versions_material_id_version_key" ON "material_versions"("material_id", "version");

-- CreateIndex
CREATE INDEX "material_versions_material_id_version_idx" ON "material_versions"("material_id", "version" DESC);

-- AddForeignKey
ALTER TABLE "material_versions" ADD CONSTRAINT "material_versions_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_versions" ADD CONSTRAINT "material_versions_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: для кожного існуючого матеріалу створити запис v1 з поточним станом
INSERT INTO "material_versions" (
  "material_id", "version", "title", "description", "file_url",
  "file_size", "mime_type", "uploaded_by", "change_note", "created_at"
)
SELECT
  m."id", 1, m."title", m."description", m."file_url",
  m."file_size", m."mime_type", m."author_id", 'Початкова версія', m."created_at"
FROM "materials" m;
