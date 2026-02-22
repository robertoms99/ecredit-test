defmodule EcreditWeb.RequestStatusController do
  @moduledoc """
  Controller for listing request statuses.
  """
  use EcreditWeb, :controller

  alias Ecredit.Credits

  @doc """
  GET /api/request-statuses
  Lists all available request statuses.
  """
  def index(conn, _params) do
    statuses =
      Credits.list_request_statuses()
      |> Enum.map(fn status ->
        %{
          id: status.id,
          code: status.code,
          name: status.name,
          description: status.description,
          isFinal: status.is_final,
          displayOrder: status.display_order
        }
      end)

    json(conn, statuses)
  end
end
