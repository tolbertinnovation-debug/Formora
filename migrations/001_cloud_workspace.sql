BEGIN;
CREATE TABLE IF NOT EXISTS formora_forms (
  id uuid PRIMARY KEY,
  owner_id text NOT NULL,
  document jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1,
  public_id text UNIQUE,
  published_document jsonb,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS formora_forms_owner ON formora_forms(owner_id, updated_at DESC) WHERE deleted_at IS NULL;
CREATE TABLE IF NOT EXISTS formora_responses (
  id uuid PRIMARY KEY,
  form_id uuid NOT NULL REFERENCES formora_forms(id),
  submission_key uuid NOT NULL,
  answers jsonb NOT NULL,
  question_snapshot jsonb NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(form_id, submission_key)
);
CREATE INDEX IF NOT EXISTS formora_responses_form ON formora_responses(form_id, submitted_at DESC);
CREATE TABLE IF NOT EXISTS formora_rate_limits (
  bucket text NOT NULL,
  window_start timestamptz NOT NULL,
  requests integer NOT NULL,
  PRIMARY KEY(bucket, window_start)
);
COMMIT;
