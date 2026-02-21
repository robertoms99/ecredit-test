defmodule Ecredit.Countries.Colombia do
  @moduledoc """
  Colombia country strategy implementation.
  Handles Cedula validation, DataCredito evaluation, and provider integration.
  """
  require Logger
  @behaviour Ecredit.Countries.Strategy

  # Cedula: 6-10 numeric digits
  @cedula_pattern ~r/^\d{6,10}$/

  @config %{
    code: "CO",
    name: "Colombia",
    icon: "🇨🇴",
    amount_limit: 100_000_000,
    currency: "COP",
    document_id_label: "Cédula",
    provider_name: "Colombia Bank Data Provider",
    min_credit_score: 550,
    max_debt_to_income_ratio: 0.45
  }

  @impl true
  def get_config, do: @config

  # --- Document Validation ---

  @impl true
  def validate_document_id(document_id) when is_binary(document_id) do
    trimmed = String.trim(document_id)

    if trimmed == "" do
      {:error, "CC (Cédula de Ciudadanía) es requerida"}
    else
      cond do
        String.length(trimmed) < 6 or String.length(trimmed) > 10 ->
          {:error, "CC debe tener entre 6 y 10 dígitos"}

        not Regex.match?(@cedula_pattern, trimmed) ->
          {:error, "CC debe contener solo dígitos numéricos"}

        Regex.match?(~r/^0+$/, trimmed) ->
          {:error, "CC no puede ser todo ceros"}

        true ->
          {:ok, trimmed}
      end
    end
  end

  def validate_document_id(_), do: {:error, "CC (Cédula de Ciudadanía) es requerida"}

  @impl true
  def evaluate_credit(financial_data, requested_amount, monthly_income) do
    datacredito = financial_data["datacredito"]
    fin_info    = financial_data["datos_financieros"]

    credit_score    = datacredito["score"] || 0
    obligations     = fin_info["obligaciones_mensuales"] || 0
    account_balance = fin_info["balance_cuentas"] || 0
    provider_income = fin_info["ingresos_mensuales"] || monthly_income || 0

    debt_to_income_ratio =
      if provider_income > 0, do: obligations / provider_income, else: 1.0

    risk_level = calculate_risk_level(credit_score, debt_to_income_ratio)

    checks = %{
      credit_score_ok:     credit_score >= @config.min_credit_score,
      debt_to_income_ok:   dti_within_limit?(debt_to_income_ratio, @config.max_debt_to_income_ratio),
      amount_within_limit: requested_amount <= @config.amount_limit,
      sufficient_income:   provider_income >= requested_amount * 0.12,
      balance_not_critical: account_balance >= -50_000
    }

    all_checks_pass = Enum.all?(Map.values(checks))
    approved = all_checks_pass and risk_level != "HIGH"

    reason = build_reason(approved, risk_level, checks, credit_score, debt_to_income_ratio, requested_amount)

    recommended_amount =
      if not approved and provider_income > 0 do
        max_by_dti    = (provider_income * 0.35 - obligations) * 12
        max_by_income = provider_income * 8.33
        max(0, Float.floor(min(min(max_by_dti, max_by_income), @config.amount_limit)))
      else
        nil
      end

    %{
      approved: approved,
      risk_level: risk_level,
      checks: checks,
      reason: reason,
      recommended_amount: (if approved, do: nil, else: recommended_amount),
      metadata: %{
        checks: checks,
        debt_to_income_ratio: dti_to_float(debt_to_income_ratio),
        current_debt: obligations,
        balance: account_balance,
        provider_income: provider_income,
        requested_amount: requested_amount
      }
    }
  end

  @impl true
  def provider_endpoint, do: Application.get_env(:ecredit, :colombia_provider_url)

  @impl true
  def request_bank_data(payload) do
    provider_url = provider_endpoint()

    body = %{
      document_id:          payload.credit_request.document_id,
      credit_request_id:    payload.credit_request.id,
      callback_url:         payload.callback_url,
      extra_prop_colombia:  "xxx"
    }

    Logger.info("Calling colombia bank provider at #{provider_url} for credit request #{body.credit_request_id}")

    case Req.post(provider_url, json: body, receive_timeout: 30_000) do
      {:ok, %{status: status, body: response_body}} when status in 200..299 ->
        correlation_id = get_correlation_id(response_body)
        Logger.info("Bank provider accepted request, correlation_id: #{correlation_id}")
        {:ok, %{external_request_id: correlation_id, provider_name: get_config().provider_name, fetch_status: "PENDING"}}

      {:ok, %{status: status, body: body}} ->
        Logger.error("Bank provider returned error: #{status} - #{inspect(body)}")
        if is_map(body) and body["error"] do
          {:provider_known_error, body["error"]}
        else
          {:error, "Ocurrio algo inesperado al solicitar informacion al proveedor"}
        end

      {:error, reason} ->
        Logger.error("Failed to call bank provider: #{inspect(reason)}")
        {:error, "Connection failed: #{inspect(reason)}"}
    end
  end

  @impl true
  def validate_provider_payload(payload) do
    with :ok <- require_object_field(payload, "datacredito", "Falta datacredito en el payload del proveedor de Colombia"),
         :ok <- require_object_field(payload, "datos_financieros", "Falta datos_financieros en el payload del proveedor de Colombia") do

      datacredito = payload["datacredito"]
      fin_info    = payload["datos_financieros"]

      with :ok <- require_number(datacredito, "score", "datacredito.score debe ser un número"),
           :ok <- require_non_negative_number(fin_info, "ingresos_mensuales", "ingresos_mensuales debe ser un número no negativo"),
           :ok <- require_non_negative_number(fin_info, "obligaciones_mensuales", "obligaciones_mensuales debe ser un número no negativo"),
           :ok <- require_number(fin_info, "balance_cuentas", "balance_cuentas debe ser un número") do
        {:ok, payload}
      end
    end
  end

  defp calculate_risk_level(credit_score, :infinity), do: calculate_risk_level(credit_score, 1.0)

  defp calculate_risk_level(credit_score, debt_to_income_ratio) do
    cond do
      credit_score >= 700 and debt_to_income_ratio < 0.35 -> "LOW"
      credit_score >= 550 and debt_to_income_ratio < 0.45 -> "MEDIUM"
      true                                                  -> "HIGH"
    end
  end

  defp dti_within_limit?(:infinity, _limit), do: false
  defp dti_within_limit?(dti, limit), do: dti <= limit

  defp dti_to_float(:infinity), do: nil
  defp dti_to_float(dti), do: Float.round(dti * 100, 2)

  defp build_reason(true, risk_level, _checks, credit_score, debt_to_income_ratio, _requested_amount) do
    dti_pct = dti_to_display(debt_to_income_ratio)
    "Crédito aprobado. Nivel de riesgo: #{risk_level}, Puntaje crediticio: #{credit_score}, Ratio deuda/ingreso: #{dti_pct}%"
  end

  defp build_reason(false, risk_level, checks, credit_score, debt_to_income_ratio, requested_amount) do
    reasons =
      []
      |> maybe_add(not checks.credit_score_ok,
           "puntaje crediticio muy bajo (#{credit_score} < #{@config.min_credit_score})")
      |> maybe_add(not checks.debt_to_income_ok,
           "ratio deuda/ingreso muy alto (#{dti_to_display(debt_to_income_ratio)}% > #{round(@config.max_debt_to_income_ratio * 100)}%)")
      |> maybe_add(not checks.amount_within_limit,
           "monto solicitado excede el límite (#{requested_amount} > #{@config.amount_limit})")
      |> maybe_add(not checks.sufficient_income,
           "ingreso mensual insuficiente para el monto solicitado")
      |> maybe_add(not checks.balance_not_critical,
           "balance de cuenta críticamente bajo")
      |> maybe_add(risk_level == "HIGH",
           "perfil de alto riesgo")

    "Crédito rechazado: #{Enum.join(reasons, ", ")}"
  end

  defp maybe_add(list, true, msg), do: list ++ [msg]
  defp maybe_add(list, false, _msg), do: list

  defp dti_to_display(:infinity), do: "∞"
  defp dti_to_display(dti), do: Float.round(dti * 100, 1) |> :erlang.float_to_binary(decimals: 1)

  defp get_correlation_id(%{"correlation_id" => id}), do: id
  defp get_correlation_id(_), do: nil

  defp require_object_field(map, field, error_msg) do
    value = map[field]
    if is_map(value), do: :ok, else: {:error, error_msg}
  end

  defp require_number(map, field, error_msg) do
    if is_number(map[field]), do: :ok, else: {:error, error_msg}
  end

  defp require_non_negative_number(map, field, error_msg) do
    value = map[field]
    if is_number(value) and value >= 0, do: :ok, else: {:error, error_msg}
  end
end
