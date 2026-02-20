defmodule EcreditWeb.CreditRequestChannel do
  @moduledoc """
  Channel for real-time credit request updates.
  """
  use EcreditWeb, :channel

  @impl true
  def join("credit_requests:lobby", _payload, socket) do
    {:ok, socket}
  end

  def join("credit_requests:" <> _credit_request_id, _payload, socket) do
    {:ok, socket}
  end

  @impl true
  def handle_in("ping", payload, socket) do
    {:reply, {:ok, payload}, socket}
  end

  @doc """
  Broadcasts a credit request status update to all subscribers.
  """
  def broadcast_status_update(credit_request_id, transition) do
    payload = %{
      creditRequestId: credit_request_id,
      statusId: transition.to_status_id,
      statusName: transition.status_name,
      statusCode: transition.status_code,
      updatedAt: transition.updated_at,
      reason: transition.reason,
      statusTransitionId: transition.status_transition_id,
      fromStatusId: transition.from_status_id
    }

    EcreditWeb.Endpoint.broadcast("credit_requests:lobby", "credit-request-updated", payload)

    EcreditWeb.Endpoint.broadcast(
      "credit_requests:#{credit_request_id}",
      "credit-request-updated",
      payload
    )
  end
end
