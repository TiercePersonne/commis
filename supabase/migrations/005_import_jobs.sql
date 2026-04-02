CREATE TABLE import_jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'pending',
  source_url    text NOT NULL,
  source_type   text NOT NULL,
  result        jsonb,
  error_message text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own import jobs"
  ON import_jobs FOR ALL
  USING (user_id = auth.uid());

CREATE INDEX import_jobs_user_status_idx ON import_jobs(user_id, status);
