defmodule EcreditWeb.Plugs.AuthErrorHandler do
  @moduledoc """
  Error handler for Guardian authentication errors.
  """
  import Plug.Conn
  import Phoenix.Controller, only: [json: 2]

  @behaviour Guardian.Plug.ErrorHandler

  @impl Guardian.Plug.ErrorHandler
  def auth_error(conn, {type, _reason}, _opts) do
    {status, code, message} =
      case type do
        :unauthenticated ->
          {401, "AUTH_REQUIRED", "Authentication required"}

        :invalid_token ->
          {401, "AUTH_FAILED", "Invalid or expired token"}

        :no_resource_found ->
          {401, "AUTH_FAILED", "User not found"}

        _ ->
          {401, "AUTH_FAILED", "Authentication failed"}
      end

    conn
    |> put_status(status)
    |> json(%{code: code, message: message})
    |> halt()
  end
end
