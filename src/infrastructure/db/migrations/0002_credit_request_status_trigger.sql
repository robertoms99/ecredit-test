CREATE OR REPLACE FUNCTION notify_credit_request_status_change()
RETURNS TRIGGER AS $$
DECLARE
  status_code VARCHAR(32);
  status_name VARCHAR(64);
  notification_payload TEXT;
BEGIN
  SELECT code, name INTO status_code, status_name
  FROM request_statuses
  WHERE id = NEW.status_id;

  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.status_id IS DISTINCT FROM NEW.status_id) THEN
    notification_payload := json_build_object(
      'credit_request_id', NEW.id::text,
      'request_status_id', NEW.status_id::text,
      'request_status_code', status_code,
      'request_status_name', status_name,
      'updated_at', NEW.updated_at::text
    )::text;

    PERFORM pg_notify('credit_request_status_change', notification_payload);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER credit_request_status_change_trigger
AFTER INSERT OR UPDATE OF status_id
ON credit_requests
FOR EACH ROW
EXECUTE FUNCTION notify_credit_request_status_change();
