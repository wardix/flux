ALTER TABLE checklist_items ADD COLUMN IF NOT EXISTS assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE checklist_items ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_checklist_items_assignee_id ON checklist_items(assignee_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_due_date ON checklist_items(due_date);
