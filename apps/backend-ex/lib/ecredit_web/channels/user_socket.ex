defmodule EcreditWeb.UserSocket do
  @moduledoc """
  WebSocket for real-time credit request updates.
  Replaces Socket.IO from the Bun backend.
  """
  use Phoenix.Socket

  require Logger
  alias Ecredit.Guardian

  # Channels
  channel "credit_requests:*", EcreditWeb.CreditRequestChannel

  @impl true
  def connect(%{"token" => token}, socket, _connect_info) do
    case Guardian.decode_and_verify(token) do
      {:ok, claims} ->
        case Guardian.resource_from_claims(claims) do
          {:ok, user} ->
            {:ok, assign(socket, :current_user, user)}

          {:error, _reason} ->
            :error
        end

      {:error, _reason} ->
        :error
    end
  end

  def connect(_params, _socket, _connect_info) do
    Logger.warning("Intento de conexión WebSocket sin token, rechazando")
    :error
  end

  @impl true
  def id(socket), do: "user_socket:#{socket.assigns.current_user.id}"
end
