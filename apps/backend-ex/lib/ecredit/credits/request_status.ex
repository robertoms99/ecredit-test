defmodule Ecredit.Credits.RequestStatus do
  @moduledoc """
  Schema for request_statuses table.
  Represents the possible statuses for a credit request.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime]

  @status_codes ~w(CREATED PENDING_FOR_BANK_DATA EVALUATING APPROVED REJECTED FAILED_FROM_PROVIDER)

  schema "request_statuses" do
    field :code, :string
    field :name, :string
    field :description, :string
    field :is_final, :boolean, default: false
    field :display_order, :integer

    has_many :credit_requests, Ecredit.Credits.CreditRequest, foreign_key: :status_id
    has_many :transitions_from, Ecredit.Credits.StatusTransition, foreign_key: :from_status_id
    has_many :transitions_to, Ecredit.Credits.StatusTransition, foreign_key: :to_status_id

    timestamps(inserted_at: :created_at, updated_at: :updated_at)
  end

  @doc """
  Returns all valid status codes.
  """
  def status_codes, do: @status_codes

  @doc """
  Checks if a status code is final (cannot transition from).
  """
  def final?(status_code) when status_code in ~w(APPROVED REJECTED FAILED_FROM_PROVIDER), do: true
  def final?(_), do: false

  @doc """
  Changeset for creating/updating a request status.
  """
  def changeset(status, attrs) do
    status
    |> cast(attrs, [:code, :name, :description, :is_final, :display_order])
    |> validate_required([:code, :name])
    |> validate_inclusion(:code, @status_codes)
    |> unique_constraint(:code)
  end
end
