defmodule EcreditWeb.AuthController do
  @moduledoc false
  use EcreditWeb, :controller

  alias Ecredit.Accounts
  alias Ecredit.Guardian

  action_fallback EcreditWeb.FallbackController

  @doc """
  POST /api/auth/login
  """
  def login(conn, %{"email" => email, "password" => password}) do
    case Accounts.authenticate_user(email, password) do
      {:ok, user} ->
        {:ok, token, _claims} = Guardian.create_token(user)

        conn
        |> put_status(:ok)
        |> json(%{
          token: token,
          user: %{
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role
          }
        })

      {:error, :invalid_credentials} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{code: "AUTH_FAILED", message: "Correo o contrasenia invalida"})

      {:error, :account_disabled} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{code: "AUTH_FAILED", message: "Cuenta desactivada"})
    end
  end

  def login(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{code: "VALIDATION_FAILED", message: "Email y contrasenia son requeridas"})
  end

  @doc """
  GET /api/auth/me
  """
  def me(conn, _params) do
    user = Guardian.Plug.current_resource(conn)

    conn
    |> put_status(:ok)
    |> json(%{
      user: %{
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    })
  end
end
