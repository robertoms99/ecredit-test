defmodule EcreditWeb.WebhookController do
  @moduledoc """
  Controller for handling webhooks from external providers.
  """
  use EcreditWeb, :controller
  require Logger
  alias Ecredit.Banking
  alias Ecredit.Credits
  alias Ecredit.Countries

  @doc """
  POST /api/webhook/process-bank-data
  Receives bank data from external providers.
  """
  def process_bank_data(conn, %{"correlation_id" => correlation_id} = params) do
    case Banking.get_banking_info_by_external_id(correlation_id) do
      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{
          code: "NOT_FOUND",
          message: "No se encontró solicitud pendiente para el correlation_id"
        })

      banking_info ->
        credit_request = banking_info.credit_request
        country = credit_request.country

        payload = Map.delete(params, "correlation_id")

        case Countries.validate_provider_payload(country, payload) do
          {:ok, validated_payload} ->
            {:ok, _updated} = Banking.complete_banking_info(banking_info, validated_payload)

            {:ok, _updated_request} =
              Credits.update_credit_request_status(
                credit_request,
                "EVALUATING",
                "webhook",
                "Transición automática: Datos bancarios recibidos del proveedor"
              )

            conn
            |> put_status(:ok)
            |> json(%{status: "ok", message: "Datos bancarios recibidos y procesándose"})

          {:error, reason} ->
            conn
            |> put_status(:bad_request)
            |> json(%{code: "VALIDATION_FAILED", message: reason})
        end
    end
  end

  def process_bank_data(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{code: "VALIDATION_FAILED", message: "correlation_id es requerido"})
  end
end
