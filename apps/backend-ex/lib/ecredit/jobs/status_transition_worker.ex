defmodule Ecredit.Jobs.StatusTransitionWorker do
  @moduledoc """
  Oban worker for processing credit request status transitions.
  Replaces pg-boss from the Bun backend.
  """
  use Oban.Worker,
    queue: :credit_evaluation,
    max_attempts: 5,
    unique: [period: 30, states: [:available, :scheduled, :executing]]

  alias Ecredit.Credits
  alias Ecredit.Banking
  alias Ecredit.Countries
  alias Ecredit.BankProviderClient

  require Logger

  @doc """
  Enqueues a status transition job for a credit request.
  """
  def enqueue(payload) do
    payload
    |> new()
    |> Oban.insert()
  end

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"credit_request_id" => id, "request_status_code" => status_code, "request_status_id" => request_status_id}}) do
    Logger.info("Processing status transition for credit request #{id}, status: #{status_code}")

    case Credits.get_credit_request(id) do
      nil ->
        Logger.error("Credit request #{id} not found")
        {:error, :not_found}

      credit_request ->
        if credit_request.status.code != status_code do
          Logger.info("Status already changed for #{id}, skipping")
          :ok
        else
          execute_transition(credit_request)
        end
    end
  end

  defp execute_transition(%{status: %{code: "CREATED"}} = credit_request) do
    Logger.info("Processing CREATED status for #{credit_request.id}")

    case Countries.request_bank_data(
      credit_request.country,
      %{credit_request: credit_request, callback_url: build_callback_url()}
    ) do
        {:ok, initial_bank_info} ->
          {:ok, _banking_info} = Banking.create_banking_info(%{credit_request_id: credit_request.id, fetch_status: initial_bank_info.fetch_status, external_request_id: initial_bank_info.external_request_id, provider_name: initial_bank_info.provider_name})

          {:ok, _updated} =
            Credits.update_credit_request_status(
              credit_request,
              "PENDING_FOR_BANK_DATA",
              "system",
              "Bank data requested"
            )
          :ok

      {:provider_known_error, reason} ->
        Logger.error("Failed from bank provider: #{inspect(reason)}")

        Credits.update_credit_request_status(
          credit_request,
          "FAILED_FROM_PROVIDER",
          "system",
          "Provider error: #{reason}"
        )

        :ok

      {:error, reason} ->
        Logger.error("Failed to call bank provider: #{inspect(reason)}")

        if (credit_request.status.code !== "FAILED_FROM_PROVIDER") do
          Credits.update_credit_request_status(
            credit_request,
            "FAILED_FROM_PROVIDER",
            "system",
            "Provider error: #{reason}"
          )
        end

        {:error, reason}

    end
  end

  defp execute_transition(%{status: %{code: "EVALUATING"}} = credit_request) do
    Logger.info("Processing EVALUATING status for #{credit_request.id}")

    banking_info = Banking.get_banking_info_by_credit_request(credit_request.id)
    if banking_info && banking_info.fetch_status == "COMPLETED" do
      case Countries.evaluate_credit(
             credit_request.country,
             banking_info.financial_data,
             credit_request.requested_amount,
             credit_request.monthly_income
           ) do
        {:ok, %{approved: true} = result} ->
          Credits.update_credit_request_status(
            credit_request,
            "APPROVED",
            "system",
            "Credit approved. Risk level: #{result.risk_level}"
          )

          :ok

        {:ok, %{approved: false, reason: reason}} ->
          Credits.update_credit_request_status(
            credit_request,
            "REJECTED",
            "system",
            reason || "Credit rejected based on evaluation criteria"
          )

          :ok

        {:error, reason} ->
          Logger.error("Evaluation error: #{reason}")
          {:error, reason}
      end
    else
      Logger.error("Banking info not available or not completed for #{credit_request.id}")
      {:error, :banking_info_not_ready}
    end
  end

  defp execute_transition(%{status: %{is_final: true}} = credit_request) do
    Logger.info("Credit request #{credit_request.id} is in final status, no action needed")
    :ok
  end

  defp execute_transition(credit_request) do
    Logger.warning("No transition handler for status #{credit_request.status.code}")
    :ok
  end

  defp build_callback_url do
    origin_url = Application.get_env(:ecredit, :origin_api)

    "#{origin_url}/api/webhook/process-bank-data"
  end


end
