-- CreateEnum
CREATE TYPE "material_event_type" AS ENUM ('view', 'download', 'save', 'unsave');

-- CreateTable
CREATE TABLE "material_events" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER,
    "material_id" INTEGER NOT NULL,
    "event_type" "material_event_type" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "material_events_created_at_idx" ON "material_events"("created_at");

-- CreateIndex
CREATE INDEX "material_events_event_type_created_at_idx" ON "material_events"("event_type", "created_at");

-- CreateIndex
CREATE INDEX "material_events_material_id_event_type_idx" ON "material_events"("material_id", "event_type");

-- AddForeignKey
ALTER TABLE "material_events" ADD CONSTRAINT "material_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_events" ADD CONSTRAINT "material_events_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
