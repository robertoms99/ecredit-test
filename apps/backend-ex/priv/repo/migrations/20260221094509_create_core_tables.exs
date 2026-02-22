defmodule Ecredit.Repo.Migrations.CreateCoreTables do
  use Ecto.Migration

  def change do
    create_if_not_exists table(:users, primary_key: false) do
      add :id, :uuid, primary_key: true, default: fragment("gen_random_uuid()")
      add :email, :string, size: 255, null: false
      add :password_hash, :string, size: 255, null: false
      add :full_name, :string, size: 255, null: false
      add :role, :string, size: 32, null: false, default: "user"
      add :is_active, :boolean, null: false, default: true
      add :created_at, :utc_datetime, null: false, default: fragment("now()")
      add :updated_at, :utc_datetime, null: false, default: fragment("now()")
    end

    create_if_not_exists unique_index(:users, [:email])

    create_if_not_exists table(:request_statuses, primary_key: false) do
      add :id, :uuid, primary_key: true, default: fragment("gen_random_uuid()")
      add :code, :string, size: 64, null: false
      add :name, :string, size: 255, null: false
      add :description, :text
      add :is_final, :boolean, null: false, default: false
      add :display_order, :integer
      add :created_at, :utc_datetime, null: false, default: fragment("now()")
      add :updated_at, :utc_datetime, null: false, default: fragment("now()")
    end

    create_if_not_exists unique_index(:request_statuses, [:code])

    create_if_not_exists table(:credit_requests, primary_key: false) do
      add :id, :uuid, primary_key: true, default: fragment("gen_random_uuid()")
      add :country, :string, size: 2, null: false
      add :full_name, :string, size: 255, null: false
      add :document_id, :string, size: 64, null: false
      add :requested_amount, :float, null: false
      add :monthly_income, :float, null: false
      add :requested_at, :utc_datetime, null: false, default: fragment("now()")
      add :user_id, :uuid, null: false
      add :status_id, :uuid, null: false
      add :created_at, :utc_datetime, null: false, default: fragment("now()")
      add :updated_at, :utc_datetime, null: false, default: fragment("now()")
    end

    create_if_not_exists index(:credit_requests, [:country])
    create_if_not_exists index(:credit_requests, [:status_id])
    create_if_not_exists index(:credit_requests, [:requested_at])

    create_if_not_exists table(:banking_info, primary_key: false) do
      add :id, :uuid, primary_key: true, default: fragment("gen_random_uuid()")
      add :provider_name, :string, size: 255, null: false
      add :provider_response_at, :utc_datetime
      add :financial_data, :jsonb, null: false, default: "{}"
      add :fetch_status, :string, size: 64, null: false, default: "pending"
      add :error_message, :text
      add :retry_count, :integer, null: false, default: 0
      add :external_request_id, :uuid, null: false
      add :credit_request_id, :uuid, null: false
      add :created_at, :utc_datetime, null: false, default: fragment("now()")
      add :updated_at, :utc_datetime, null: false, default: fragment("now()")
    end

    create_if_not_exists table(:status_transitions, primary_key: false) do
      add :id, :uuid, primary_key: true, default: fragment("gen_random_uuid()")
      add :reason, :text
      add :triggered_by, :string, size: 32, null: false
      add :metadata, :jsonb, null: false, default: "{}"
      add :credit_request_id, :uuid, null: false
      add :from_status_id, :uuid
      add :to_status_id, :uuid, null: false
      add :created_at, :utc_datetime, null: false, default: fragment("now()")
    end

    create_if_not_exists index(:status_transitions, [:credit_request_id])
    create_if_not_exists index(:status_transitions, [:to_status_id])
  end
end
