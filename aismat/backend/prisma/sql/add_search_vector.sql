-- Повнотекстовий пошук для таблиці materials.
-- Ідемпотентний скрипт — можна виконувати повторно.
--
-- Створює: розширення unaccent + pg_trgm, функцію materials_search_vector_update,
-- тригер на INSERT/UPDATE та GIN-індекс на колонці search_vector.

CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION materials_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', unaccent(coalesce(NEW.title::text, ''))), 'A') ||
    setweight(to_tsvector('simple', unaccent(coalesce(NEW.description::text, ''))), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS materials_search_vector_trigger ON materials;

CREATE TRIGGER materials_search_vector_trigger
BEFORE INSERT OR UPDATE OF title, description ON materials
FOR EACH ROW EXECUTE FUNCTION materials_search_vector_update();

-- Перерахувати search_vector для існуючих рядків (на випадок, якщо тригер додано пізніше).
UPDATE materials
SET title = title
WHERE search_vector IS NULL;

CREATE INDEX IF NOT EXISTS idx_materials_search_vector
  ON materials USING GIN (search_vector);

-- Trigram-індекс на title для часткових збігів (LIKE/ILIKE).
CREATE INDEX IF NOT EXISTS idx_materials_title_trgm
  ON materials USING GIN (title gin_trgm_ops);
