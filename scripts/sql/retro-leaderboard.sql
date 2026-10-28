-- Isolated, server-only tables. No existing application tables are changed.
CREATE SCHEMA IF NOT EXISTS arcade;
REVOKE ALL ON SCHEMA arcade FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS arcade.runs (
 id uuid PRIMARY KEY,
 score integer NOT NULL CHECK (score >= 0),
 nickname varchar(18),
 ip_hash text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 submitted_at timestamptz,
 CHECK (nickname IS NULL OR char_length(nickname) BETWEEN 2 AND 18)
);
CREATE INDEX IF NOT EXISTS arcade_scores_idx ON arcade.runs (score DESC, submitted_at, id) WHERE nickname IS NOT NULL;
CREATE INDEX IF NOT EXISTS arcade_pending_idx ON arcade.runs (created_at) WHERE nickname IS NULL;

CREATE TABLE IF NOT EXISTS arcade.rate_limits (
 key text PRIMARY KEY,
 window_start timestamptz NOT NULL DEFAULT now(),
 requests integer NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS arcade_rate_expiry_idx ON arcade.rate_limits (window_start);
ALTER TABLE arcade.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE arcade.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA arcade FROM PUBLIC, anon, authenticated;
