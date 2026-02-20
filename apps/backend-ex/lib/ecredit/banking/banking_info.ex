defmodule Ecredit.Banking.BankingInfo do
  @moduledoc """
  Schema for banking_info table.
  Stores financial data received from external bank providers.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime]

  @fetch_statuses ~w(PENDING COMPLETED FAILED)

  schema "banking_info" do
    field :external_request_id, :binary_id
    field :provider_name, :string
    field :provider_response_at, :utc_datetime
    field :financial_data, :map, default: %{}
    field :fetch_status, :string, default: "PENDING"
    field :error_message, :string
    field :retry_count, :integer, default: 0

    belongs_to :credit_request, Ecredit.Credits.CreditRequest

    timestamps(inserted_at: :created_at, updated_at: :updated_at)
  end

  @doc """
  Changeset for creating banking info when requesting from provider.
  """
  def create_changeset(banking_info, attrs) do
    banking_info
    |> cast(attrs, [:external_request_id, :provider_name, :credit_request_id])
    |> validate_required([:provider_name, :credit_request_id])
    |> put_change(:fetch_status, "PENDING")
    |> foreign_key_constraint(:credit_request_id)
  end

  @doc """
  Changeset for updating with provider response.
  """
  def update_changeset(banking_info, attrs) do
    banking_info
    |> cast(attrs, [:financial_data, :fetch_status, :provider_response_at, :error_message, :retry_count])
    |> validate_inclusion(:fetch_status, @fetch_statuses)
  end

  @doc """
  Changeset for marking as completed with financial data.
  """
  def complete_changeset(banking_info, financial_data) do
    banking_info
    |> change()
    |> put_change(:financial_data, financial_data)
    |> put_change(:fetch_status, "COMPLETED")
    |> put_change(:provider_response_at, DateTime.utc_now() |> DateTime.truncate(:second))
  end

  @doc """
  Changeset for marking as failed.
  """
  def fail_changeset(banking_info, error_message) do
    banking_info
    |> change()
    |> put_change(:fetch_status, "FAILED")
    |> put_change(:error_message, error_message)
    |> put_change(:provider_response_at, DateTime.utc_now() |> DateTime.truncate(:second))
    |> update_change(:retry_count, &(&1 + 1))
  end
end
