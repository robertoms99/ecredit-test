defmodule Ecredit.Credits.StatusTransition do
  @moduledoc """
  Schema for status_transitions table.
  Audit log for all status changes on credit requests.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime]

  @triggered_by_values ~w(user system webhook provider)

  schema "status_transitions" do
    field :reason, :string
    field :triggered_by, :string
    field :metadata, :map, default: %{}

    belongs_to :credit_request, Ecredit.Credits.CreditRequest
    belongs_to :from_status, Ecredit.Credits.RequestStatus
    belongs_to :to_status, Ecredit.Credits.RequestStatus

    timestamps(inserted_at: :created_at, updated_at: false)
  end

  @doc """
  Changeset for creating a status transition.
  """
  def changeset(transition, attrs) do
    transition
    |> cast(attrs, [
      :reason,
      :triggered_by,
      :metadata,
      :credit_request_id,
      :from_status_id,
      :to_status_id
    ])
    |> validate_required([:triggered_by, :credit_request_id, :to_status_id])
    |> validate_inclusion(:triggered_by, @triggered_by_values)
    |> validate_length(:reason, max: 1000)
    |> foreign_key_constraint(:credit_request_id)
    |> foreign_key_constraint(:from_status_id)
    |> foreign_key_constraint(:to_status_id)
  end
end
