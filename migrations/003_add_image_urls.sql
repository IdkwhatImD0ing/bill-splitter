-- Migration: Allow multiple images per receipt
-- Adds an ordered `image_urls` array to receipts, backfilled from the existing
-- single `image_url` column (useful when one receipt spans several photos).
--
-- The legacy `image_url` column is intentionally kept and is written on every
-- update as a mirror of image_urls[1]. That keeps OpenGraph cards and any
-- not-yet-deployed code reading the old column working. `image_urls` is the
-- source of truth; nothing should write `image_url` on its own.

ALTER TABLE receipts ADD COLUMN image_urls TEXT[] NOT NULL DEFAULT '{}';

-- Backfill: a receipt that already has an image starts as a one-item array
UPDATE receipts
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL AND image_url <> '';

COMMENT ON COLUMN receipts.image_urls IS 'Ordered list of receipt image URLs in Supabase Storage. Source of truth for receipt images.';
COMMENT ON COLUMN receipts.image_url IS 'DEPRECATED: legacy single-image column. Mirrors image_urls[1]; read only as a fallback for un-migrated rows.';
