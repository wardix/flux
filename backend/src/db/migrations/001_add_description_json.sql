ALTER TABLE cards ADD COLUMN IF NOT EXISTS description_json JSONB;
CREATE INDEX IF NOT EXISTS idx_cards_description_json ON cards USING GIN (description_json);
