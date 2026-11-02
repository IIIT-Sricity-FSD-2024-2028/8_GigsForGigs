-- One-time backfill: services posted before categories existed get one guessed from
-- the title keywords the old client-side filter used. Rows that match nothing stay NULL
-- (they still show under "All Categories"). New services choose a category when posted.
UPDATE "SERVICE" SET "category" = 'design'
  WHERE "category" IS NULL AND ("title" ILIKE '%design%' OR "title" ILIKE '%configurator%');
UPDATE "SERVICE" SET "category" = 'dev'
  WHERE "category" IS NULL AND ("title" ILIKE '%dashboard%' OR "title" ILIKE '%developer%' OR "title" ILIKE '%api%');
UPDATE "SERVICE" SET "category" = 'writing'
  WHERE "category" IS NULL AND ("title" ILIKE '%copywriting%' OR "title" ILIKE '%content%');
