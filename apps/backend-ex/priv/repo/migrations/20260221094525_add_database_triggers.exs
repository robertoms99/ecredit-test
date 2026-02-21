defmodule Ecredit.Repo.Migrations.AddDatabaseTriggers do
  use Ecto.Migration

  def up do
    # Create trigger function for status transitions
    execute("""
    CREATE OR REPLACE FUNCTION notify_status_transition()
    RETURNS TRIGGER AS $$
    DECLARE
      status_code VARCHAR(32);
      status_name VARCHAR(64);
      notification_payload TEXT;
    BEGIN
      SELECT code, name INTO status_code, status_name
      FROM request_statuses
      WHERE id = NEW.to_status_id;

      notification_payload := json_build_object(
        'credit_request_id', NEW.credit_request_id::text,
        'status_transition_id', NEW.id::text,
        'from_status_id', NEW.from_status_id::text,
        'to_status_id', NEW.to_status_id::text,
        'status_code', status_code,
        'status_name', status_name,
        'reason', NEW.reason,
        'changed_by_user_id', NEW.triggered_by::text,
        'created_at', NEW.created_at::text
      )::text;

      PERFORM pg_notify('status_transition', notification_payload);

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    # Create trigger for status transitions
    execute("""
    CREATE OR REPLACE TRIGGER status_transition_notify_trigger
    AFTER INSERT
    ON status_transitions
    FOR EACH ROW
    EXECUTE FUNCTION notify_status_transition();
    """)

    # Create trigger function for users updated_at
    execute("""
    CREATE OR REPLACE FUNCTION update_users_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    # Create trigger for users updated_at
    execute("""
    CREATE OR REPLACE TRIGGER users_updated_at_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();
    """)
  end

  def down do
    # Drop triggers
    execute("DROP TRIGGER IF EXISTS status_transition_notify_trigger ON status_transitions;")
    execute("DROP TRIGGER IF EXISTS users_updated_at_trigger ON users;")

    # Drop functions
    execute("DROP FUNCTION IF EXISTS notify_status_transition();")
    execute("DROP FUNCTION IF EXISTS update_users_updated_at();")
  end
end
