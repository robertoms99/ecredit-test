defmodule Ecredit.Credits.CreditRequest do
  @moduledoc """
  Schema for credit_requests table.
  Represents a credit application submitted by a user.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime]

  schema "credit_requests" do
    field :country, :string
    field :full_name, :string
    field :document_id, :string
    field :requested_amount, :float
    field :monthly_income, :float
    field :requested_at, :utc_datetime

    belongs_to :user, Ecredit.Accounts.User
    belongs_to :status, Ecredit.Credits.RequestStatus

    has_one :banking_info, Ecredit.Banking.BankingInfo
    has_many :status_transitions, Ecredit.Credits.StatusTransition

    timestamps(inserted_at: :created_at, updated_at: :updated_at)
  end

  @doc """
  Changeset for creating a new credit request.
  """
  def create_changeset(credit_request, attrs) do
    credit_request
    |> cast(attrs, [:country, :full_name, :document_id, :requested_amount, :monthly_income])
    |> validate_required([:country, :full_name, :document_id, :requested_amount, :monthly_income])
    |> validate_length(:country, is: 2)
    |> validate_length(:full_name, min: 1, max: 255)
    |> validate_length(:document_id, min: 1, max: 64)
    |> validate_number(:requested_amount, greater_than: 0)
    |> validate_number(:monthly_income, greater_than: 0)
    |> put_change(:requested_at, DateTime.utc_now() |> DateTime.truncate(:second))
  end

  @doc """
  Changeset for updating status.
  """
  def status_changeset(credit_request, %{status_id: _} = attrs) do
    credit_request
    |> cast(attrs, [:status_id])
    |> validate_required([:status_id])
  end
end
