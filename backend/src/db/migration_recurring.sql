-- Recurring Tasks Table
CREATE TABLE recurring_tasks (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    frequency VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly'
    next_run TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_recurring_tasks_updated_at BEFORE UPDATE ON recurring_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_recurring_tasks_card_id ON recurring_tasks(card_id);
CREATE INDEX idx_recurring_tasks_next_run ON recurring_tasks(next_run);

-- Add is_recurring to cards
ALTER TABLE cards ADD COLUMN is_recurring BOOLEAN NOT NULL DEFAULT FALSE;
