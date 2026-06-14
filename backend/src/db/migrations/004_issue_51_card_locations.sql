ALTER TABLE cards
ADD COLUMN latitude NUMERIC(10, 8),
ADD COLUMN longitude NUMERIC(11, 8),
ADD COLUMN address TEXT;

CREATE INDEX idx_cards_location ON cards(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
