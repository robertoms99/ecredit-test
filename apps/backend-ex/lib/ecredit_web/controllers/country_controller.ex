defmodule EcreditWeb.CountryController do
  @moduledoc """
  Controller for listing supported countries.
  """
  use EcreditWeb, :controller

  alias Ecredit.Countries

  @doc """
  GET /api/countries
  Lists all supported countries with their configurations.
  """
  def index(conn, _params) do
    countries =
      Countries.list_countries()
      |> Enum.map(fn config ->
        %{
          code: config.code,
          name: config.name,
          icon: config.icon,
          amountLimit: config.amount_limit,
          currency: config.currency,
          documentIdLabel: config.document_id_label
        }
      end)

    json(conn, countries)
  end
end
