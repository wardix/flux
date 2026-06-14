-- Public Forms Table
CREATE TABLE public_forms (
    id SERIAL PRIMARY KEY,
    board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_public_forms_updated_at BEFORE UPDATE ON public_forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_public_forms_board_id ON public_forms(board_id);
