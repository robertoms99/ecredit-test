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
          {401, "AUTH_REQUIRED", "Autenticación requerida"}

        :invalid_token ->
          {401, "AUTH_FAILED", "Token inválido o expirado"}

        :no_resource_found ->
          {401, "AUTH_FAILED", "Usuario no encontrado"}

        _ ->
          {401, "AUTH_FAILED", "Error de autenticación"}
      end

    conn
    |> put_status(status)
    |> json(%{code: code, message: message})
    |> halt()
  end
end
