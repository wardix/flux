-- Insert mock users
-- Password: password123 (hashed with argon2 or just dummy hash for development)
INSERT INTO users (email, password_hash, avatar_url) VALUES
('alice@example.com', '$argon2id$v=19$m=65536,t=3,p=4$q8QJpXp9m9S7uA2vU3oN+w$O2jY4vC/Hj4F+t8v5q/7Dw', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice'),
('bob@example.com', '$argon2id$v=19$m=65536,t=3,p=4$q8QJpXp9m9S7uA2vU3oN+w$O2jY4vC/Hj4F+t8v5q/7Dw', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob'),
('charlie@example.com', '$argon2id$v=19$m=65536,t=3,p=4$q8QJpXp9m9S7uA2vU3oN+w$O2jY4vC/Hj4F+t8v5q/7Dw', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie');

-- Insert workspaces
INSERT INTO workspaces (name, owner_id) VALUES
('Engineering Workspace', 1),
('Design Workspace', 2);

-- Insert workspace members
INSERT INTO workspace_members (user_id, workspace_id, role) VALUES
(1, 1, 'owner'),
(2, 1, 'member'),
(3, 1, 'viewer'),
(2, 2, 'owner'),
(1, 2, 'member');

-- Insert boards
INSERT INTO boards (workspace_id, title, visibility, background, created_by) VALUES
(1, 'Flux Development', 'public', '#4f46e5', 1),
(1, 'Sprint Planning', 'private', '#0891b2', 1),
(2, 'Website Redesign', 'public', '#db2777', 2);

-- Insert lists for 'Flux Development' Board (id = 1)
INSERT INTO lists (board_id, title, position) VALUES
(1, 'Backlog', 0),
(1, 'To Do', 1),
(1, 'In Progress', 2),
(1, 'Done', 3);

-- Insert lists for 'Website Redesign' Board (id = 3)
INSERT INTO lists (board_id, title, position) VALUES
(3, 'Research & Ideas', 0),
(3, 'In Progress', 1),
(3, 'Review', 2),
(3, 'Done', 3);

-- Insert cards for 'Flux Development' Board (id = 1)
-- Backlog (list_id = 1)
INSERT INTO cards (list_id, title, description, position, assignee_id, story_points) VALUES
(1, 'Research WebSocket Libraries', 'Look into Socket.io vs native WebSockets for Hono', 0, 1, 3),
(1, 'Integrate Rich Text Editor', 'Setup TipTap editor in Card Details modal', 1, 2, 5);

-- To Do (list_id = 2)
INSERT INTO cards (list_id, title, description, position, assignee_id, story_points) VALUES
(2, 'Design DB Schema', 'Define tables for boards, lists, cards, and users', 0, 1, 2),
(2, 'Setup Frontend Project', 'Initialize React App with Vite, Tailwind CSS, and DaisyUI', 1, 2, 1);

-- In Progress (list_id = 3)
INSERT INTO cards (list_id, title, description, position, assignee_id, story_points) VALUES
(3, 'Develop Authentication', 'Implement JWT login/register flow on backend and frontend', 0, 1, 3);

-- Done (list_id = 4)
INSERT INTO cards (list_id, title, description, position, assignee_id, story_points) VALUES
(4, 'Configure Biome', 'Setup Biome for formatting and linting instead of ESLint/Prettier', 0, 1, 1);
