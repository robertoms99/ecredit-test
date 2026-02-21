defmodule Ecredit.Repo.Migrations.AddForeignKeys do
  use Ecto.Migration

  def change do
    # Add foreign key for credit_requests -> users
    alter table(:credit_requests) do
      modify :user_id, references(:users, type: :uuid, on_delete: :restrict, on_update: :update_all)
    end

    # Add foreign key for credit_requests -> request_statuses
    alter table(:credit_requests) do
      modify :status_id, references(:request_statuses, type: :uuid, on_delete: :restrict, on_update: :update_all)
    end

    # Add foreign key for banking_info -> credit_requests
    alter table(:banking_info) do
      modify :credit_request_id, references(:credit_requests, type: :uuid, on_delete: :delete_all, on_update: :update_all)
    end

    # Add foreign key for status_transitions -> credit_requests
    alter table(:status_transitions) do
      modify :credit_request_id, references(:credit_requests, type: :uuid, on_delete: :delete_all, on_update: :update_all)
    end

    # Add foreign key for status_transitions -> request_statuses (from_status_id)
    alter table(:status_transitions) do
      modify :from_status_id, references(:request_statuses, type: :uuid, on_delete: :nilify_all, on_update: :update_all)
    end

    # Add foreign key for status_transitions -> request_statuses (to_status_id)
    alter table(:status_transitions) do
      modify :to_status_id, references(:request_statuses, type: :uuid, on_delete: :restrict, on_update: :update_all)
    end
  end
end
