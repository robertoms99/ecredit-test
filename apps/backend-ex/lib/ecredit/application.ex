defmodule Ecredit.Application do
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      Ecredit.Repo,
      {DNSCluster, query: Application.get_env(:ecredit, :dns_cluster_query) || :ignore},
      #{Phoenix.PubSub, name: Ecredit.PubSub},
      {Oban, Application.fetch_env!(:ecredit, Oban)},
      Ecredit.StatusTransitionListener,
      EcreditWeb.Endpoint
    ]

    opts = [strategy: :one_for_one, name: Ecredit.Supervisor]
    Supervisor.start_link(children, opts)
  end

  @impl true
  def config_change(changed, _new, removed) do
    EcreditWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
