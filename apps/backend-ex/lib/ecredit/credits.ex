defmodule Ecredit.Credits do
  @moduledoc """
  The Credits context.
  Handles credit requests, statuses, and transitions.
  """
  import Ecto.Query

  require Logger
  alias Ecredit.Repo
  alias Ecredit.Credits.{CreditRequest, RequestStatus, StatusTransition}
  alias Ecredit.Banking.BankingInfo

  # ============================================
  # Credit Requests
  # ============================================

  @doc """
  Gets a credit request by ID.
  """
  def get_credit_request(id) do
    CreditRequest
    |> Repo.get(id)
    |> Repo.preload([:status, :user, :banking_info])
  end

  @doc """
  Gets a credit request by ID, raises if not found.
  """
  def get_credit_request!(id) do
    CreditRequest
    |> Repo.get!(id)
    |> Repo.preload([:status, :user, :banking_info])
  end

  @doc """
  Lists credit requests with optional filters.

  Options:
    - :country - Filter by country code
    - :status_id - Filter by status UUID
    - :document_id - Partial match on document ID
    - :from - Filter by requested_at >= from
    - :to - Filter by requested_at <= to
    - :limit - Max records (default 50)
    - :offset - Offset for pagination (default 0)
  """
  def list_credit_requests(opts \\ []) do
    limit = Keyword.get(opts, :limit, 50)
    offset = Keyword.get(opts, :offset, 0)

    query =
      CreditRequest
      |> order_by([cr], desc: cr.requested_at)
      |> maybe_filter_country(opts[:country])
      |> maybe_filter_status(opts[:status_id])
      |> maybe_filter_user_id(opts[:user_id])
      |> maybe_filter_document_id(opts[:document_id])
      |> maybe_filter_from(opts[:from])
      |> maybe_filter_to(opts[:to])

    total = Repo.aggregate(query, :count)

    data =
      query
      |> limit(^limit)
      |> offset(^offset)
      |> preload([:status, :user])
      |> Repo.all()

    %{data: data, total: total, limit: limit, offset: offset}
  end

  defp maybe_filter_country(query, nil), do: query
  defp maybe_filter_country(query, country), do: where(query, [cr], cr.country == ^country)

  defp maybe_filter_status(query, nil), do: query
  defp maybe_filter_status(query, status_id), do: where(query, [cr], cr.status_id == ^status_id)

  defp maybe_filter_user_id(query, nil), do: query
  defp maybe_filter_user_id(query, user_id), do: where(query, [cr], cr.user_id == ^user_id)

  defp maybe_filter_document_id(query, nil), do: query

  defp maybe_filter_document_id(query, doc_id) do
    pattern = "%#{doc_id}%"
    where(query, [cr], ilike(cr.document_id, ^pattern))
  end

  defp maybe_filter_from(query, nil), do: query
  defp maybe_filter_from(query, from), do: where(query, [cr], cr.requested_at >= ^from)

  defp maybe_filter_to(query, nil), do: query
  defp maybe_filter_to(query, to), do: where(query, [cr], cr.requested_at <= ^to)

  @doc """
  Creates a new credit request.
  """
  def create_credit_request(attrs, user_id) do
    case get_status_by_code("CREATED") do
      nil ->
        {:error, :status_not_found}

      status ->
        %CreditRequest{}
        |> CreditRequest.create_changeset(attrs)
        |> Ecto.Changeset.put_change(:user_id, user_id)
        |> Ecto.Changeset.put_change(:status_id, status.id)
        |> Repo.insert()
        |> case do
          {:ok, credit_request} ->
            credit_request = Repo.preload(credit_request, [:status, :user])
            log_transition(credit_request.id, nil, status.id, "user", "Solicitud creada")
            {:ok, credit_request}

          {:error, changeset} ->
            {:error, changeset}
        end
    end
  end

  @doc """
  Updates the status of a credit request.
  """
  def update_credit_request_status(
        credit_request,
        new_status_code,
        triggered_by,
        reason \\ nil,
        metadata \\ %{}
      ) do
    current_status = credit_request.status

    if RequestStatus.final?(current_status.code) do
      {:error, :invalid_status_transition}
    else
      case get_status_by_code(new_status_code) do
        nil ->
          {:error, :status_not_found}

        new_status ->
          credit_request
          |> CreditRequest.status_changeset(%{status_id: new_status.id})
          |> Repo.update()
          |> case do
            {:ok, updated} ->
              updated = Repo.preload(updated, [:status, :user], force: true)

              log_transition(
                updated.id,
                current_status.id,
                new_status.id,
                triggered_by,
                reason,
                metadata
              )

              {:ok, updated}

            {:error, changeset} ->
              {:error, changeset}
          end
      end
    end
  end

  # ============================================
  # Request Statuses
  # ============================================

  @doc """
  Lists all request statuses.
  """
  def list_request_statuses do
    RequestStatus
    |> order_by([s], s.display_order)
    |> Repo.all()
  end

  @doc """
  Gets a status by code.
  """
  def get_status_by_code(code) do
    Repo.get_by(RequestStatus, code: code)
  end

  @doc """
  Gets a status by ID.
  """
  def get_status(id) do
    Repo.get(RequestStatus, id)
  end

  # ============================================
  # Status Transitions
  # ============================================

  @doc """
  Logs a status transition.
  """
  def log_transition(
        credit_request_id,
        from_status_id,
        to_status_id,
        triggered_by,
        reason \\ nil,
        metadata \\ %{}
      ) do
    %StatusTransition{}
    |> StatusTransition.changeset(%{
      credit_request_id: credit_request_id,
      from_status_id: from_status_id,
      to_status_id: to_status_id,
      triggered_by: triggered_by,
      reason: reason,
      metadata: metadata
    })
    |> Repo.insert()
  end

  @doc """
  Gets the transition history for a credit request.
  """
  def get_transition_history(credit_request_id) do
    StatusTransition
    |> where([t], t.credit_request_id == ^credit_request_id)
    |> order_by([t], desc: t.created_at)
    |> preload([:from_status, :to_status])
    |> Repo.all()
  end

  # ============================================
  # Banking Info helpers
  # ============================================

  @doc """
  Gets banking info for a credit request.
  """
  def get_banking_info_by_credit_request(credit_request_id) do
    Repo.get_by(BankingInfo, credit_request_id: credit_request_id)
  end

  @doc """
  Gets banking info by external request ID (correlation_id).
  """
  def get_banking_info_by_external_id(external_request_id) do
    BankingInfo
    |> where([bi], bi.external_request_id == ^external_request_id)
    |> preload(:credit_request)
    |> Repo.one()
  end
end
