defmodule Ecredit.Banking do
  @moduledoc """
  The Banking context.
  Handles communication with external bank providers and banking data.
  """
  import Ecto.Query

  alias Ecredit.Repo
  alias Ecredit.Banking.BankingInfo

  @doc """
  Creates a banking info record when requesting data from provider.
  """
  def create_banking_info(attrs) do
    %BankingInfo{}
    |> BankingInfo.create_changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Gets banking info by ID.
  """
  def get_banking_info(id) do
    Repo.get(BankingInfo, id)
  end

  @doc """
  Gets banking info by external request ID (correlation_id from provider).
  """
  def get_banking_info_by_external_id(external_request_id) do
    BankingInfo
    |> where([bi], bi.external_request_id == ^external_request_id)
    |> preload(credit_request: [:status])
    |> Repo.one()
  end

  @doc """
  Gets banking info by credit request ID.
  """
  def get_banking_info_by_credit_request(credit_request_id) do
    BankingInfo
    |> where([bi], bi.credit_request_id == ^credit_request_id)
    |> Repo.one()
  end

  @doc """
  Marks banking info as completed with financial data.
  """
  def complete_banking_info(%BankingInfo{} = banking_info, financial_data) do
    banking_info
    |> BankingInfo.complete_changeset(financial_data)
    |> Repo.update()
  end

  @doc """
  Marks banking info as failed with an error message.
  """
  def fail_banking_info(%BankingInfo{} = banking_info, error_message) do
    banking_info
    |> BankingInfo.fail_changeset(error_message)
    |> Repo.update()
  end

  @doc """
  Updates banking info with provider response.
  """
  def update_banking_info(%BankingInfo{} = banking_info, attrs) do
    banking_info
    |> BankingInfo.update_changeset(attrs)
    |> Repo.update()
  end
end
