defmodule Ecredit.Countries.Colombia do
  @moduledoc """
  Colombia country strategy implementation.
  Handles Cedula validation, DataCredito evaluation, and provider integration.
  """
  @behaviour Ecredit.Countries.Strategy

  # Cedula: 6-10 numeric digits
  @cedula_pattern ~r/^\d{6,10}$/

  @config %{
    code: "CO",
    name: "Colombia",
    icon: "🇨🇴",
    amount_limit: 100_000_000,
    currency: "COP",
    document_id_label: "Cedula",
    provider_name: "Colombia Bank Data Provider",
    min_credit_score: 550,
    max_debt_to_income_ratio: 0.45
  }

  @impl true
  def get_config, do: @config

  @impl true
  def validate_document_id(document_id) when is_binary(document_id) do
    normalized = String.trim(document_id)

    cond do
      not Regex.match?(@cedula_pattern, normalized) ->
        {:error, "Cedula must be 6-10 numeric digits"}

      String.match?(normalized, ~r/^0+$/) ->
        {:error, "Cedula cannot be all zeros"}

      true ->
        {:ok, normalized}
    end
  end

  def validate_document_id(_), do: {:error, "Document ID must be a string"}

  @impl true
  def evaluate_credit(financial_data, requested_amount, _monthly_income) do
    credit_score = Map.get(financial_data, "datacredito", %{score: 0}).score
    provider_income = Map.get(financial_data, "ingresos_mensuales", 0)
    obligations = Map.get(financial_data, "obligaciones_mensuales", 0)
    balance = Map.get(financial_data, "balance_cuentas", 0)
    risk_category = Map.get(financial_data, "categoria_riesgo", "D")
    payment_behavior = Map.get(financial_data, "comportamiento_pago", "")

    debt_to_income_ratio =
      if provider_income > 0, do: obligations / provider_income, else: 1.0

    risk_level = calculate_risk_level(credit_score, debt_to_income_ratio, risk_category)

    checks = %{
      credit_score_ok: credit_score >= @config.min_credit_score,
      debt_to_income_ok: debt_to_income_ratio <= @config.max_debt_to_income_ratio,
      amount_within_limit: requested_amount <= @config.amount_limit,
      sufficient_income: provider_income >= requested_amount * 0.10,
      positive_balance: balance >= 0,
      good_payment_behavior: payment_behavior in ["AL_DIA", "MORA_MENOR_30_DIAS"],
      acceptable_risk_category: risk_category in ["A", "B", "C"]
    }

    all_checks_pass = Enum.all?(Map.values(checks))
    approved = all_checks_pass and risk_level != "HIGH"

    reason =
      cond do
        not checks.credit_score_ok ->
          "Credit score too low (#{credit_score} < #{@config.min_credit_score})"

        not checks.debt_to_income_ok ->
          "Debt to income ratio too high (#{Float.round(debt_to_income_ratio * 100, 1)}%)"

        not checks.good_payment_behavior ->
          "Payment history indicates delays (#{payment_behavior})"

        not checks.acceptable_risk_category ->
          "Risk category too high (#{risk_category})"

        not checks.positive_balance ->
          "Negative account balance"

        risk_level == "HIGH" ->
          "High risk profile"

        true ->
          nil
      end

      recommended_amount = 0
      if (!approved && provider_income > 0) do
        max_by_dti = (provider_income * 0.35 - obligations) * 12;
        max_by_income = provider_income * 8.33;
        recommended_amount = max(0, Float.floor(min(min(max_by_dti, max_by_income), @config.amount_limit)));
      end

      current_debt = obligations

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
        balance,
        provider_income,
        requested_amount
      }
    }
  end

  defp calculate_risk_level(credit_score, debt_to_income_ratio, risk_category) do
    cond do
      credit_score >= 700 and debt_to_income_ratio < 0.3 and risk_category == "A" -> "LOW"
      credit_score >= 550 and debt_to_income_ratio < 0.45 and risk_category in ["A", "B", "C"] -> "MEDIUM"
      true -> "HIGH"
    end
  end

  @impl true
  def provider_endpoint, do: Application.get_env(:ecredit, :colombia_provider_url)

  @impl true
  def request_bank_data(payload) do
    provider_url = provider_endpoint()

    body = %{
      document_id: payload.credit_request.document_id,
      credit_request_id: payload.credit_request.id,
      callback_url: payload.callback_url,
      extra_prop_colombia: "xxx"
    }

    Logger.info("Calling colombia bank provider at #{provider_url} for credit request #{payload.credit_request_id}")

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
    required_fields = ["datacredito", "datos_financieros"]

    missing =
      Enum.filter(required_fields, fn field ->
        not Map.has_key?(payload, field)
      end)

    if Enum.empty?(missing) do
      datacredito = payload.datacredito
      fin_info = payload.datos_financieros

      if(!is_number(datacredito.score)) do
        {:error, "datacredito.score debe ser un numero"}
      end

      if(!is_number(fin_info.ingresos_mensuales || fin_info.ingresos_mensuales < 0)) do
        {:error, "ingresos_mensuales debe ser un numero y mayor igual a 0"}
      end

      if(!is_number(fin_info.obligaciones_mensuales ||fin_info.obligaciones_mensuales < 0)) do
        {:error, "obligaciones_mensuales debe ser un numero y mayor igual a 0"}
      end

      if(!is_number(fin_info.balance_cuentas )) do
        {:error, "balance_cuentas debe ser un numero"}
      end

      {:ok, payload}

    else
      {:error, "Missing required fields: #{Enum.join(missing, ", ")}"}
    end
  end
end
