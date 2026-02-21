defmodule EcreditWeb.FallbackController do
  @moduledoc """
  Fallback controller for handling errors from action_fallback.
  """
  use EcreditWeb, :controller

  def call(conn, {:error, :not_found}) do
    conn
    |> put_status(:not_found)
    |> json(%{code: "NOT_FOUND", message: "Recurso no encontrado"})
  end

  def call(conn, {:error, :unauthorized}) do
    conn
    |> put_status(:unauthorized)
    |> json(%{code: "AUTH_REQUIRED", message: "Autenticación requerida"})
  end

  def call(conn, {:error, %Ecto.Changeset{} = changeset}) do
    errors =
      Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
        Enum.reduce(opts, msg, fn {key, value}, acc ->
          String.replace(acc, "%{#{key}}", to_string(value))
        end)
      end)

    conn
    |> put_status(:unprocessable_entity)
    |> json(%{code: "VALIDATION_FAILED", message: "Validación fallida", details: errors})
  end

  def call(conn, {:error, message}) when is_binary(message) do
    conn
    |> put_status(:bad_request)
    |> json(%{code: "BAD_REQUEST", message: message})
  end
end
