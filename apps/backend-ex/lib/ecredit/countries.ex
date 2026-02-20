defmodule Ecredit.Countries do
  @moduledoc """
  Registry for country strategies.
  Provides a unified interface to access country-specific implementations.
  """

  alias Ecredit.Countries.{Mexico, Colombia}

  @strategies %{
    Mexico.get_config().code => Mexico,
    Colombia.get_config().code => Colombia
  }

  @doc """
  Returns the strategy module for a given country code.
  """
  def get_strategy(country_code) when is_binary(country_code) do
    Map.get(@strategies, String.upcase(country_code))
  end

  @doc """
  Returns all supported countries with their configurations.
  """
  def list_countries do
    @strategies
    |> Map.values()
    |> Enum.map(fn strategy -> strategy.get_config() end)
  end

  @doc """
  Checks if a country code is supported.
  """
  def supported?(country_code) do
    Map.has_key?(@strategies, String.upcase(country_code))
  end

  @doc """
  Returns all supported country codes.
  """
  def supported_codes do
    Map.keys(@strategies)
  end

  @doc """
  Validates document ID for a specific country.
  """
  def validate_document_id(country_code, document_id) do
    case get_strategy(country_code) do
      nil -> {:error, "Unsupported country: #{country_code}"}
      strategy -> strategy.validate_document_id(document_id)
    end
  end

  @doc """
  Evaluates credit for a specific country.
  """
  def evaluate_credit(country_code, financial_data, requested_amount, monthly_income) do
    case get_strategy(country_code) do
      nil -> {:error, "Unsupported country: #{country_code}"}
      strategy -> {:ok, strategy.evaluate_credit(financial_data, requested_amount, monthly_income)}
    end
  end

  @doc """
  Gets provider endpoint for a specific country.
  """
  def provider_endpoint(country_code) do
    case get_strategy(country_code) do
      nil -> {:error, "Unsupported country: #{country_code}"}
      strategy -> {:ok, strategy.provider_endpoint()}
    end
  end

  @doc """
  Call provider bank for data for a specific country
  """
  def request_bank_data(country_code, payload) do
    case get_strategy(country_code) do
      nil -> {:error, "Unsupported country: #{country_code}"}
      strategy -> {:ok, strategy.request_bank_data(payload)}
    end
  end

  @doc """
  Validates provider payload for a specific country.
  """
  def validate_provider_payload(country_code, payload) do
    case get_strategy(country_code) do
      nil -> {:error, "Unsupported country: #{country_code}"}
      strategy -> strategy.validate_provider_payload(payload)
    end
  end
end
