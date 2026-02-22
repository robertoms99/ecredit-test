defmodule EcreditWeb.CreditRequestController do
  @moduledoc """
  Controller for credit request operations.
  """
  use EcreditWeb, :controller
  require Logger

  alias Ecredit.Credits
  alias Ecredit.Countries
  alias Ecredit.Guardian

  action_fallback EcreditWeb.FallbackController

  @doc """
  GET /api/credit-requests
  Lists credit requests with optional filters.
  """
  def index(conn, params) do
    user = Guardian.Plug.current_resource(conn)

    opts =
      []
      |> maybe_add_filter(:user_id, user.id)
      |> maybe_add_filter(:country, params["country"])
      |> maybe_add_filter(:status_id, params["status"])
      |> maybe_add_filter(:document_id, params["documentId"])
      |> maybe_add_date_filter(:from, params["from"])
      |> maybe_add_date_filter(:to, params["to"])
      |> maybe_add_integer(:limit, params["limit"], 50, 1, 100)
      |> maybe_add_integer(:offset, params["offset"], 0, 0, nil)

    %{data: data, total: total, limit: limit, offset: offset} =
      Credits.list_credit_requests(opts)

    json(conn, %{
      data: Enum.map(data, &serialize_credit_request/1),
      total: total,
      limit: limit,
      offset: offset
    })
  end

  @doc """
  GET /api/credit-requests/:id
  Gets a single credit request.
  """
  def show(conn, %{"id" => id}) do
    user_auth = Guardian.Plug.current_resource(conn)

    case Credits.get_credit_request(id) do
      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{code: "NOT_FOUND", message: "Solicitud de crédito no encontrada"})

      credit_request ->
        if(credit_request.user.id !== user_auth.id) do
          conn
          |> put_status(:forbidden)
          |> json(%{
            code: "FORBIDDEN",
            message: "Solo puedes ver solicitudes de crédito que creaste"
          })
        end

        json(conn, serialize_credit_request(credit_request))
    end
  end

  @doc """
  POST /api/credit-requests
  Creates a new credit request.
  """
  def create(conn, params) do
    user = Guardian.Plug.current_resource(conn)

    with {:ok, country} <- validate_country(params["country"]),
         {:ok, document_id} <- Countries.validate_document_id(country, params["documentId"]),
         {:ok, _} <- validate_name(params["fullName"]),
         {:ok, requested_amount} <- validate_amount(params["requestedAmount"], country),
         {:ok, monthly_income} <- validate_income(params["monthlyIncome"]) do
      attrs = %{
        "country" => country,
        "document_id" => document_id,
        "full_name" => params["fullName"],
        "requested_amount" => requested_amount,
        "monthly_income" => monthly_income
      }

      case Credits.create_credit_request(attrs, user.id) do
        {:ok, credit_request} ->
          conn
          |> put_status(:created)
          |> json(serialize_credit_request(credit_request))

        {:error, changeset} ->
          conn
          |> put_status(:bad_request)
          |> json(%{
            code: "VALIDATION_FAILED",
            message: "Solicitud de crédito inválida",
            details: format_changeset_errors(changeset)
          })
      end
    else
      {:error, message} ->
        conn
        |> put_status(:bad_request)
        |> json(%{code: "VALIDATION_FAILED", message: message})
    end
  end

  @doc """
  PATCH /api/credit-requests/:id/status
  Updates the status of a credit request.
  """
  def update_status(conn, %{"id" => id, "status" => status_code} = params) do
    user_auth = Guardian.Plug.current_resource(conn)
    reason = params["reason"]

    case Credits.get_credit_request(id) do
      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{code: "NOT_FOUND", message: "Solicitud de crédito no encontrada"})

      credit_request ->
        if(credit_request.user.id !== user_auth.id) do
          conn
          |> put_status(:forbidden)
          |> json(%{
            code: "FORBIDDEN",
            message: "Solo puedes actualizar solicitudes de crédito que creaste"
          })
        end

        case Credits.update_credit_request_status(credit_request, status_code, "user", reason) do
          {:ok, updated} ->
            json(conn, serialize_credit_request(updated))

          {:error, :invalid_status_transition} ->
            conn
            |> put_status(:conflict)
            |> json(%{
              code: "INVALID_STATUS_TRANSITION",
              message: "No se puede cambiar el estado desde un estado final"
            })

          {:error, :status_not_found} ->
            conn
            |> put_status(:bad_request)
            |> json(%{code: "VALIDATION_FAILED", message: "Código de estado inválido"})

          {:error, _changeset} ->
            conn
            |> put_status(:bad_request)
            |> json(%{code: "VALIDATION_FAILED", message: "Error al actualizar el estado"})
        end
    end
  end

  def update_status(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{code: "VALIDATION_FAILED", message: "El código de estado es requerido"})
  end

  @doc """
  GET /api/credit-requests/:id/history
  Gets the status transition history for a credit request.
  """
  def history(conn, %{"id" => id}) do
    user_auth = Guardian.Plug.current_resource(conn)

    case Credits.get_credit_request(id) do
      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{code: "NOT_FOUND", message: "Solicitud de crédito no encontrada"})

      credit_request ->
        if(credit_request.user.id !== user_auth.id) do
          conn
          |> put_status(:forbidden)
          |> json(%{
            code: "FORBIDDEN",
            message: "Solo puedes ver el historial de solicitudes que creaste"
          })
        end

        transitions = Credits.get_transition_history(id)

        history =
          Enum.map(transitions, fn t ->
            %{
              id: t.id,
              fromStatus:
                if(t.from_status,
                  do: %{id: t.from_status.id, code: t.from_status.code, name: t.from_status.name}
                ),
              toStatus: %{id: t.to_status.id, code: t.to_status.code, name: t.to_status.name},
              reason: t.reason,
              triggeredBy: t.triggered_by,
              metadata: t.metadata,
              createdAt: t.created_at
            }
          end)

        json(conn, history)
    end
  end

  defp serialize_credit_request(cr) do
    %{
      id: cr.id,
      country: cr.country,
      fullName: cr.full_name,
      documentId: cr.document_id,
      requestedAmount: cr.requested_amount,
      monthlyIncome: cr.monthly_income,
      requestedAt: cr.requested_at,
      status: %{
        id: cr.status.id,
        code: cr.status.code,
        name: cr.status.name,
        isFinal: cr.status.is_final
      },
      user: %{
        id: cr.user.id,
        email: cr.user.email,
        fullName: cr.user.full_name
      },
      createdAt: cr.created_at,
      updatedAt: cr.updated_at
    }
  end

  defp validate_country(nil), do: {:error, "El país es requerido"}

  defp validate_country(country) do
    if Countries.supported?(country) do
      {:ok, String.upcase(country)}
    else
      {:error, "País no soportado: #{country}"}
    end
  end

  defp validate_name(nil), do: {:error, "El nombre completo es requerido"}

  defp validate_name(name) when byte_size(name) < 2,
    do: {:error, "El nombre debe tener al menos 2 caracteres"}

  defp validate_name(name) when byte_size(name) > 100,
    do: {:error, "El nombre debe tener máximo 100 caracteres"}

  defp validate_name(_name), do: {:ok, :valid}

  defp validate_amount(nil, _), do: {:error, "El monto solicitado es requerido"}

  defp validate_amount(amount, country) when is_number(amount) do
    strategy = Countries.get_strategy(country)
    config = strategy.get_config()

    cond do
      amount <= 0 ->
        {:error, "El monto solicitado debe ser positivo"}

      amount > config.amount_limit ->
        {:error, "El monto excede el límite de #{config.amount_limit} #{config.currency}"}

      true ->
        {:ok, amount}
    end
  end

  defp validate_amount(_, _), do: {:error, "El monto solicitado debe ser un número"}

  defp validate_income(nil), do: {:error, "El ingreso mensual es requerido"}
  defp validate_income(income) when is_number(income) and income > 0, do: {:ok, income}
  defp validate_income(_), do: {:error, "El ingreso mensual debe ser un número positivo"}

  defp maybe_add_filter(opts, _key, nil), do: opts
  defp maybe_add_filter(opts, _key, ""), do: opts
  defp maybe_add_filter(opts, key, value), do: Keyword.put(opts, key, value)

  defp maybe_add_date_filter(opts, _key, nil), do: opts
  defp maybe_add_date_filter(opts, _key, ""), do: opts

  defp maybe_add_date_filter(opts, key, value) do
    case DateTime.from_iso8601(value) do
      {:ok, datetime, _offset} -> Keyword.put(opts, key, datetime)
      _ -> opts
    end
  end

  defp maybe_add_integer(opts, key, nil, default, _min, _max), do: Keyword.put(opts, key, default)

  defp maybe_add_integer(opts, key, value, default, min, max) when is_binary(value) do
    case Integer.parse(value) do
      {int, _} -> maybe_add_integer(opts, key, int, default, min, max)
      :error -> Keyword.put(opts, key, default)
    end
  end

  defp maybe_add_integer(opts, key, value, _default, min, max) when is_integer(value) do
    clamped =
      value
      |> max(min || value)
      |> then(fn v -> if max, do: min(v, max), else: v end)

    Keyword.put(opts, key, clamped)
  end

  defp format_changeset_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end
end
