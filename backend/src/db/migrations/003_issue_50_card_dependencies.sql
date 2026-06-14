CREATE TABLE IF NOT EXISTS card_dependencies (
    id SERIAL PRIMARY KEY,
    blocking_card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    blocked_card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT prevent_self_dependency CHECK (blocking_card_id != blocked_card_id),
    UNIQUE (blocking_card_id, blocked_card_id)
);

CREATE INDEX IF NOT EXISTS idx_card_dependencies_blocking ON card_dependencies(blocking_card_id);
CREATE INDEX IF NOT EXISTS idx_card_dependencies_blocked ON card_dependencies(blocked_card_id);
