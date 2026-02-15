import { pool } from '../src/db/pool';

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS credit_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      country TEXT NOT NULL,
      full_name TEXT NOT NULL,
      document_id TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      monthly_income NUMERIC NOT NULL,
      requested_at TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL,
      bank_info JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id BIGSERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    DO $$ BEGIN
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
    EXCEPTION WHEN OTHERS THEN NULL; END $$;

    -- Trigger functions to enqueue jobs on DB events
    CREATE OR REPLACE FUNCTION enqueue_risk_eval()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO jobs(type, payload) VALUES ('risk_eval', jsonb_build_object('requestId', NEW.id));
      PERFORM pg_notify('jobs_channel', jsonb_build_object('type','risk_eval')::text);
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION enqueue_status_transition()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO jobs(type, payload) VALUES ('status_transition', jsonb_build_object('requestId', NEW.id, 'status', NEW.status));
      PERFORM pg_notify('jobs_channel', jsonb_build_object('type','status_transition')::text);
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS credit_req_after_insert ON credit_requests;
    CREATE TRIGGER credit_req_after_insert
    AFTER INSERT ON credit_requests
    FOR EACH ROW EXECUTE FUNCTION enqueue_risk_eval();

    DROP TRIGGER IF EXISTS credit_req_after_update_status ON credit_requests;
    CREATE TRIGGER credit_req_after_update_status
    AFTER UPDATE OF status ON credit_requests
    FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION enqueue_status_transition();
  `);
  console.log('Migration completed');
  process.exit(0);
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
