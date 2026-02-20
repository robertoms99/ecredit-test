defmodule Ecredit.StatusTransitionListener do
  @moduledoc """
  Listens to PostgreSQL NOTIFY events on status_transition channel
  and broadcasts updates via Phoenix Channels.
  """
  use GenServer

  require Logger

  alias Ecredit.Repo
  alias Ecredit.Credits
  alias EcreditWeb.CreditRequestChannel
  alias Ecredit.Jobs.StatusTransitionWorker

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl true
  def init(_opts) do
    {:ok, pid} = Postgrex.Notifications.start_link(Repo.config())
    {:ok, _ref} = Postgrex.Notifications.listen(pid, "status_transition")

    Logger.info("StatusTransitionListener started and listening to status_transition channel")
    {:ok, %{pg_notifications: pid}}
  end

  @impl true
  def handle_info({:notification, _pid, _ref, "status_transition", payload}, state) do
    Logger.debug("Received status_transition notification: #{payload}")

    case Jason.decode(payload) do
      {:ok, data} ->
        handle_transition_notification(data)

      {:error, reason} ->
        Logger.error("Failed to decode notification payload: #{inspect(reason)}")
    end

    {:noreply, state}
  end

  def handle_info(_msg, state) do
    {:noreply, state}
  end

  defp handle_transition_notification(%{
    "credit_request_id" => credit_request_id,
    "to_status_id" => to_status_id,
    "status_code" => status_code,
    "status_name" => status_name,
    "created_at" => updated_at,
    "reason" => reason,
    "from_status_id" => from_status_id,
    "status_transition_id" => status_transition_id
  }) do

    StatusTransitionWorker.enqueue(%{ credit_request_id: credit_request_id, updated_at: updated_at,request_status_id: to_status_id,request_status_code: status_code, request_status_name: status_name })

    CreditRequestChannel.broadcast_status_update(credit_request_id, %{
      status_transition_id: status_transition_id,
      to_status_id: to_status_id,
      status_code: status_code,
      status_name: status_name,
      updated_at: updated_at,
      reason: reason,
      from_status_id: from_status_id
    })
    Logger.info("Broadcasted status update for credit request #{credit_request_id}")
  end

  defp handle_transition_notification(data) do
    Logger.warning("Unexpected notification format: #{inspect(data)}")
  end

  defp get_transition_with_statuses(transition_id) do
    import Ecto.Query

    Credits.StatusTransition
    |> where([t], t.id == ^transition_id)
    |> preload([:from_status, :to_status])
    |> Repo.one()
  end
end
