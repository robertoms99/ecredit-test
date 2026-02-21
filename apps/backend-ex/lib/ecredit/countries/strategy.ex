defmodule Ecredit.Countries.Strategy do
  @moduledoc """
  Behaviour for country-specific credit evaluation strategies.
  Each country implements its own validation, evaluation, and provider integration.
  """

  @type config :: %{
          code: String.t(),
          name: String.t(),
          icon: String.t(),
          amount_limit: number(),
          currency: String.t(),
          document_id_label: String.t(),
          provider_name: String.t(),
          min_credit_score: number(),
          max_debt_to_income_ratio: float()
        }

  @type validation_result :: {:ok, String.t()} | {:error, String.t()}

  @type evaluation_result :: %{
          approved: boolean(),
          risk_level: String.t(),
          checks: map(),
          reason: String.t() | nil
        }

  @doc """
  Returns the country configuration.
  """
  @callback get_config() :: config()

  @doc """
  Validates the document ID format for this country.
  Returns {:ok, normalized_document_id} or {:error, reason}.
  """
  @callback validate_document_id(document_id :: String.t()) :: validation_result()

  @doc """
  Evaluates credit risk based on financial data from the provider.
  """
  @callback evaluate_credit(
              financial_data :: map(),
              requested_amount :: number(),
              monthly_income :: number()
            ) :: evaluation_result()

  @doc """
  Returns the provider endpoint path for this country.
  """
  @callback provider_endpoint() :: String.t()

  @doc """
  Validates the external data payload from the provider.
  """
  @callback validate_provider_payload(payload :: map()) :: {:ok, map()} | {:error, String.t()}

  @doc """
  Call provider bank for data for a specific country
  """
  @callback request_bank_data(payload :: map()) ::
              {:ok, map()} | {:error, String.t()} | {:provider_known_error, String.t()}
end
