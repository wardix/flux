CREATE TABLE IF NOT EXISTS approval_rules (
    id SERIAL PRIMARY KEY,
    board_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
    from_list_id INTEGER REFERENCES lists(id) ON DELETE CASCADE,
    to_list_id INTEGER REFERENCES lists(id) ON DELETE CASCADE,
    min_approvals INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (from_list_id, to_list_id)
);

CREATE TABLE IF NOT EXISTS approval_votes (
    id SERIAL PRIMARY KEY,
    card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
    rule_id INTEGER REFERENCES approval_rules(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('approved', 'rejected')),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (card_id, rule_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_approval_rules_board_id ON approval_rules(board_id);
CREATE INDEX IF NOT EXISTS idx_approval_votes_card_rule ON approval_votes(card_id, rule_id);
