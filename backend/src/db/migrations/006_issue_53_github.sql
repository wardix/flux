CREATE TABLE github_installations (
  id SERIAL PRIMARY KEY,
  board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  repo_full_name VARCHAR(255) NOT NULL,
  webhook_secret VARCHAR(255) NOT NULL,
  in_progress_list_id INTEGER REFERENCES lists(id) ON DELETE SET NULL,
  review_list_id INTEGER REFERENCES lists(id) ON DELETE SET NULL,
  done_list_id INTEGER REFERENCES lists(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(board_id, repo_full_name)
);

CREATE TABLE github_links (
  id SERIAL PRIMARY KEY,
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'branch', 'pull_request'
  github_id VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  url VARCHAR(1024) NOT NULL,
  state VARCHAR(50), -- 'open', 'closed', 'merged'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(card_id, type, url)
);

CREATE INDEX idx_github_links_card_id ON github_links(card_id);
CREATE INDEX idx_github_installations_repo ON github_installations(repo_full_name);
