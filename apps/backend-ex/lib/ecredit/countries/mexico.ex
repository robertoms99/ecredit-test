defmodule Ecredit.Countries.Mexico do
  @moduledoc """
  Mexico country strategy implementation.
  Handles CURP validation, Mexican credit bureau evaluation, and provider integration.
  """
  @behaviour Ecredit.Countries.Strategy

  # CURP format: 4 letters + 6 digits (YYMMDD) + 1 letter (H/M) + 5 alphanumeric + 1 digit
  @curp_pattern ~r/^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/

  @config %{
    code: "MX",
    name: "Mexico",
    icon: "🇲🇽",
    amount_limit: 500_000,
    currency: "MXN",
    document_id_label: "CURP",
    provider_name: "Mexico Bank Data Provider",
    min_credit_score: 600,
    max_debt_to_income_ratio: 0.4
  }

  @impl true
  def get_config, do: @config

  @impl true
  def validate_document_id(document_id) when is_binary(document_id) do
    normalized = String.upcase(String.trim(document_id))

    cond do
      String.length(normalized) != 18 ->
        {:error, "CURP must be exactly 18 characters"}

      not Regex.match?(@curp_pattern, normalized) ->
        {:error, "Invalid CURP format"}

      true ->
        {:ok, normalized}
    end
  end

  def validate_document_id(_), do: {:error, "Document ID must be a string"}

  @impl true
  def evaluate_credit(financial_data, requested_amount, _monthly_income) do
    credit_info = Map.get(financial_data, "informacion_crediticia", %{})
    financial_info = Map.get(financial_data, "informacion_financiera", %{})
    credit_score = Map.get(credit_info, "calificacion_buro", 0)
    current_debt = Map.get(financial_info, "deuda_mensual_mxn", 0)
    account_balance = Map.get(financial_info, "saldo_cuenta_mxn", 0)
    provider_income = Map.get(financial_info, "ingreso_mensual_mxn", 0)

    debt_to_income_ratio =
      if provider_income > 0, do: current_debt / provider_income, else: 1.0

    risk_level = calculate_risk_level(credit_score, debt_to_income_ratio)

    checks = %{
      credit_score_ok: credit_score >= @config.min_credit_score,
      debt_to_income_ok: debt_to_income_ratio <= @config.max_debt_to_income_ratio,
      amount_within_limit: requested_amount <= @config.amount_limit,
      sufficient_income: provider_income >= requested_amount * 0.15,
      positive_balance: account_balance >= 0
    }

    all_checks_pass = Enum.all?(Map.values(checks))
    approved = all_checks_pass and risk_level != "HIGH"

    reason =
      cond do
        not checks.credit_score_ok ->
          "Credit score too low (#{credit_score} < #{@config.min_credit_score})"

        not checks.debt_to_income_ok ->
          "Debt to income ratio too high (#{Float.round(debt_to_income_ratio * 100, 1)}%)"

        not checks.sufficient_income ->
          "Insufficient income for requested amount"

        not checks.positive_balance ->
          "Negative account balance"

        risk_level == "HIGH" ->
          "High risk profile"

        true ->
          nil
      end

      recommended_amount = 0
      if (!approved && provider_income > 0) do
        max_by_dti = (provider_income * 0.3 - current_debt) * 12;
        max_by_income = provider_income * 6.67;
        recommended_amount = max(0, Float.floor(min(min(max_by_dti, max_by_income), @config.amount_limit)));
      end

    %{
      approved: approved,
      risk_level: risk_level,
      checks: checks,
      reason: reason,
      recommended_amount: (if approved, do: nil, else: recommended_amount),
      metadata: {
        checks,
        debt_to_income_ratio,
        current_debt,
        account_balance,
        provider_income,
        requested_amount
      }
    }
  end

  defp calculate_risk_level(credit_score, debt_to_income_ratio) do
    cond do
      credit_score >= 750 and debt_to_income_ratio < 0.3 -> "LOW"
      credit_score >= 600 and debt_to_income_ratio < 0.4 -> "MEDIUM"
      true -> "HIGH"
    end
  end

  @impl true
  def provider_endpoint, do: Application.get_env(:ecredit, :mexico_provider_url)

  @impl true
  def request_bank_data(payload) do
    provider_url = provider_endpoint()

    body = %{
      document_id: payload.credit_request.document_id,
      credit_request_id: payload.credit_request.id,
      callback_url: payload.callback_url,
      extra_prop_mexico: "xxx"
    }

    Logger.info("Calling mexico bank provider at #{provider_url} for credit request #{payload.credit_request_id}")

    case Req.post(provider_url, json: body, receive_timeout: 30_000) do
      {:ok, %{status: status, body: response_body}} when status in 200..299 ->
        correlation_id = get_correlation_id(response_body)
        Logger.info("Bank provider accepted request, correlation_id: #{correlation_id}")
        {:ok, %{external_request_id: correlation_id, provider_name: get_config().provider_name, fetch_status: "PENDING"}}

      {:ok, %{status: status, body: body}} ->
        Logger.error("Bank provider returned error: #{status} - #{inspect(body)}")
        {:provider_known_error, "Provider returned status #{status}"}

      {:error, reason} ->
        Logger.error("Failed to call bank provider: #{inspect(reason)}")
        {:error, "Connection failed: #{inspect(reason)}"}
    end

  end

  defp get_correlation_id(%{"correlation_id" => id}), do: id
  defp get_correlation_id(_), do: {:error, "Provider did not return correlation_id"}

  @impl true
  def validate_provider_payload(payload) do
    required_fields = ["informacion_crediticia", "informacion_financiera"]
    missing =
      Enum.filter(required_fields, fn field ->
        not Map.has_key?(payload, field)
      end)

    if Enum.empty?(missing) do
      credit_info = payload.informacion_crediticia
      fin_info = payload.informacion_financiera

      if(!is_number(credit_info.calificacion_buro)) do
        {:error, "calificacion_buro debe ser un numero"}
      end

      if(!is_number(fin_info.ingreso_mensual_mxn ||fin_info.ingreso_mensual_mxn < 0)) do
        {:error, "ingreso_mensual_mxn debe ser un numero y mayor igual a 0"}
      end

      if(!is_number(fin_info.deuda_mensual_mxn || fin_info.deuda_mensual_mxn < 0)) do
        {:error, "deuda_mensual_mxn debe ser un numero y mayor igual a 0"}
      end

      if(!is_number(fin_info.saldo_cuenta_mxn )) do
        {:error, "saldo_cuenta_mxn debe ser un numero"}
      end

      {:ok, payload}

    else
      {:error, "Missing required fields: #{Enum.join(missing, ", ")}"}
    end
  end
end
