defmodule EcreditWeb.HealthController do
  @moduledoc """
  Health check endpoint.
  """
  use EcreditWeb, :controller

  def index(conn, _params) do
    json(conn, %{status: "ok", timestamp: DateTime.utc_now()})
  end
end
