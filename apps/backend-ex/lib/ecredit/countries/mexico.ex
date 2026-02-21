defmodule Ecredit.Countries.Mexico do
  @moduledoc """
  Mexico country strategy implementation.
  Handles CURP validation, Mexican credit bureau evaluation, and provider integration.
  """
  require Logger
  @behaviour Ecredit.Countries.Strategy

  # CURP format: 4 letters + 6 digits (YYMMDD) + 1 letter (H/M) + 5 alphanumeric + 1 digit
  @curp_pattern ~r/^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/

  @config %{
    code: "MX",
    name: "México",
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

  # --- Document Validation ---

  @impl true
  def validate_document_id(document_id) when is_binary(document_id) do
    trimmed = String.trim(document_id)

    if trimmed == "" do
      {:error, "CURP es requerido"}
    else
      curp = String.upcase(trimmed)

      cond do
        String.length(curp) != 18 ->
          {:error, "CURP debe tener exactamente 18 caracteres"}

        not Regex.match?(@curp_pattern, curp) ->
          {:error, "Formato de CURP inválido. Formato esperado: AAAA######HHHHH##"}

        true ->
          {:ok, curp}
      end
    end
  end

  def validate_document_id(_), do: {:error, "CURP es requerido"}

  @impl true
  def evaluate_credit(financial_data, requested_amount, monthly_income) do
    credit_info = financial_data["informacion_crediticia"]
    financial_info = financial_data["informacion_financiera"]

    credit_score = credit_info["calificacion_buro"] || 0
    current_debt = financial_info["deuda_mensual_mxn"] || 0
    account_balance = financial_info["saldo_cuenta_mxn"] || 0
    provider_income = financial_info["ingreso_mensual_mxn"] || monthly_income || 0

    debt_to_income_ratio =
      if provider_income > 0, do: current_debt / provider_income, else: :infinity

    risk_level = calculate_risk_level(credit_score, debt_to_income_ratio)

    checks = %{
      credit_score_ok: credit_score >= @config.min_credit_score,
      debt_to_income_ok:
        dti_within_limit?(debt_to_income_ratio, @config.max_debt_to_income_ratio),
      amount_within_limit: requested_amount <= @config.amount_limit,
      sufficient_income: provider_income >= requested_amount * 0.15,
      positive_balance: account_balance >= 0
    }

    all_checks_pass = Enum.all?(Map.values(checks))
    approved = all_checks_pass and risk_level != "HIGH"

    reason =
      build_reason(
        approved,
        risk_level,
        checks,
        credit_score,
        debt_to_income_ratio,
        requested_amount
      )

    recommended_amount =
      if not approved and provider_income > 0 do
        max_by_dti = (provider_income * 0.3 - current_debt) * 12
        max_by_income = provider_income * 6.67
        max(0, Float.floor(min(min(max_by_dti, max_by_income), @config.amount_limit)))
      else
        nil
      end

    %{
      approved: approved,
      risk_level: risk_level,
      checks: checks,
      reason: reason,
      recommended_amount: if(approved, do: nil, else: recommended_amount),
      metadata: %{
        checks: checks,
        debtToIncomeRatio: dti_to_float(debt_to_income_ratio),
        currentDebt: current_debt,
        accountBalance: account_balance,
        monthlyIncome: provider_income,
        requestedAmount: requested_amount
      }
    }
  end

  @impl true
  def provider_endpoint, do: Application.get_env(:ecredit, :mexico_provider_url)

  @impl true
  def request_bank_data(payload) do
    provider_url = provider_endpoint()

    body = %{
      document_id: payload.credit_request.document_id,
      credit_request_id: payload.credit_request.id,
      callback_url: payload.callback_url
    }

    Logger.info(
      "Llamando al proveedor bancario de México en #{provider_url} para la solicitud #{body.credit_request_id}"
    )

    case Req.post(provider_url, json: body, receive_timeout: 30_000) do
      {:ok, %{status: status, body: response_body}} when status in 200..299 ->
        correlation_id = get_correlation_id(response_body)
        Logger.info("Proveedor bancario aceptó la solicitud, correlation_id: #{correlation_id}")

        {:ok,
         %{
           external_request_id: correlation_id,
           provider_name: get_config().provider_name,
           fetch_status: "PENDING"
         }}

      {:ok, %{status: status, body: body}} ->
        Logger.error("El proveedor bancario devolvió un error: #{status} - #{inspect(body)}")

        if is_map(body) and body["error"] do
          {:provider_known_error, body["error"]}
        else
          {:error, "Ocurrió algo inesperado al solicitar información al proveedor"}
        end

      {:error, reason} ->
        Logger.error("Fallo al llamar al proveedor bancario: #{inspect(reason)}")
        {:error, "Fallo de conexión: #{inspect(reason)}"}
    end
  end

  @impl true
  def validate_provider_payload(payload) do
    with :ok <-
           require_object_field(
             payload,
             "informacion_crediticia",
             "Falta informacion_crediticia en el payload del proveedor de México"
           ),
         :ok <-
           require_object_field(
             payload,
             "informacion_financiera",
             "Falta informacion_financiera en el payload del proveedor de México"
           ) do
      credit_info = payload["informacion_crediticia"]
      fin_info = payload["informacion_financiera"]

      with :ok <-
             require_number(
               credit_info,
               "calificacion_buro",
               "calificacion_buro debe ser un número"
             ),
           :ok <-
             require_non_negative_number(
               fin_info,
               "ingreso_mensual_mxn",
               "ingreso_mensual_mxn debe ser un número no negativo"
             ),
           :ok <-
             require_non_negative_number(
               fin_info,
               "deuda_mensual_mxn",
               "deuda_mensual_mxn debe ser un número no negativo"
             ),
           :ok <-
             require_number(fin_info, "saldo_cuenta_mxn", "saldo_cuenta_mxn debe ser un número") do
        {:ok, payload}
      end
    end
  end

  defp calculate_risk_level(credit_score, :infinity), do: calculate_risk_level(credit_score, 1.0)

  defp calculate_risk_level(credit_score, debt_to_income_ratio) do
    cond do
      credit_score >= 750 and debt_to_income_ratio < 0.3 -> "LOW"
      credit_score >= 600 and debt_to_income_ratio < 0.4 -> "MEDIUM"
      true -> "HIGH"
    end
  end

  defp dti_within_limit?(:infinity, _limit), do: false
  defp dti_within_limit?(dti, limit), do: dti <= limit

  defp dti_to_float(:infinity), do: nil
  defp dti_to_float(dti), do: Float.round(dti * 100, 2)

  defp build_reason(
         true,
         risk_level,
         _checks,
         credit_score,
         debt_to_income_ratio,
         _requested_amount
       ) do
    dti_pct = dti_to_display(debt_to_income_ratio)

    "Crédito aprobado. Nivel de riesgo: #{risk_level}, Puntaje crediticio: #{credit_score}, Relación deuda/ingreso: #{dti_pct}%"
  end

  defp build_reason(
         false,
         risk_level,
         checks,
         credit_score,
         debt_to_income_ratio,
         requested_amount
       ) do
    reasons =
      []
      |> maybe_add(
        not checks.credit_score_ok,
        "puntaje crediticio muy bajo (#{credit_score} < #{@config.min_credit_score})"
      )
      |> maybe_add(
        not checks.debt_to_income_ok,
        "relación deuda/ingreso muy alta (#{dti_to_display(debt_to_income_ratio)}% > #{round(@config.max_debt_to_income_ratio * 100)}%)"
      )
      |> maybe_add(
        not checks.amount_within_limit,
        "monto solicitado excede el límite (#{requested_amount} > #{@config.amount_limit})"
      )
      |> maybe_add(
        not checks.sufficient_income,
        "ingreso mensual insuficiente para el monto solicitado"
      )
      |> maybe_add(
        not checks.positive_balance,
        "saldo de cuenta negativo"
      )
      |> maybe_add(
        risk_level == "HIGH",
        "perfil de alto riesgo"
      )

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
