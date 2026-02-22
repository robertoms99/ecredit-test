defmodule Ecredit.Repo.Migrations.AddForeignKeys do
  use Ecto.Migration

  # Raw SQL is required here because Ecto's `modify` + `references()` will fail
  # if the FK constraints already exist (created by Bun's Drizzle migrations).
  # We use the same DO $$ EXCEPTION WHEN duplicate_object pattern that Bun uses.

  def up do
    # credit_requests -> users
    execute """
    DO $$ BEGIN
      ALTER TABLE "credit_requests"
        ADD CONSTRAINT "credit_requests_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
    """

    # credit_requests -> request_statuses
    execute """
    DO $$ BEGIN
      ALTER TABLE "credit_requests"
        ADD CONSTRAINT "credit_requests_status_id_request_statuses_id_fk"
        FOREIGN KEY ("status_id") REFERENCES "public"."request_statuses"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
    """

    # banking_info -> credit_requests
    execute """
    DO $$ BEGIN
      ALTER TABLE "banking_info"
        ADD CONSTRAINT "banking_info_credit_request_id_credit_requests_id_fk"
        FOREIGN KEY ("credit_request_id") REFERENCES "public"."credit_requests"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
    """

    # status_transitions -> credit_requests
    execute """
    DO $$ BEGIN
      ALTER TABLE "status_transitions"
        ADD CONSTRAINT "status_transitions_credit_request_id_credit_requests_id_fk"
        FOREIGN KEY ("credit_request_id") REFERENCES "public"."credit_requests"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
    """

    # status_transitions -> request_statuses (from_status_id)
    execute """
    DO $$ BEGIN
      ALTER TABLE "status_transitions"
        ADD CONSTRAINT "status_transitions_from_status_id_request_statuses_id_fk"
        FOREIGN KEY ("from_status_id") REFERENCES "public"."request_statuses"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
    """

    # status_transitions -> request_statuses (to_status_id)
    execute """
    DO $$ BEGIN
      ALTER TABLE "status_transitions"
        ADD CONSTRAINT "status_transitions_to_status_id_request_statuses_id_fk"
        FOREIGN KEY ("to_status_id") REFERENCES "public"."request_statuses"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
    """
  end

  def down do
    execute "ALTER TABLE \"credit_requests\" DROP CONSTRAINT IF EXISTS \"credit_requests_user_id_users_id_fk\""
    execute "ALTER TABLE \"credit_requests\" DROP CONSTRAINT IF EXISTS \"credit_requests_status_id_request_statuses_id_fk\""
    execute "ALTER TABLE \"banking_info\" DROP CONSTRAINT IF EXISTS \"banking_info_credit_request_id_credit_requests_id_fk\""
    execute "ALTER TABLE \"status_transitions\" DROP CONSTRAINT IF EXISTS \"status_transitions_credit_request_id_credit_requests_id_fk\""
    execute "ALTER TABLE \"status_transitions\" DROP CONSTRAINT IF EXISTS \"status_transitions_from_status_id_request_statuses_id_fk\""
    execute "ALTER TABLE \"status_transitions\" DROP CONSTRAINT IF EXISTS \"status_transitions_to_status_id_request_statuses_id_fk\""
  end
end
