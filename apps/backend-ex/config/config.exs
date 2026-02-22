import Config

config :ecredit,
  ecto_repos: [Ecredit.Repo],
  generators: [timestamp_type: :utc_datetime, binary_id: true]

  config :ecredit, EcreditWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [json: EcreditWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: Ecredit.PubSub,
  live_view: [signing_salt: "KDibu0cd"],
  server: true

config :ecredit, Oban,
  engine: Oban.Engines.Basic,
  queues: [default: 10, credit_evaluation: 5],
  repo: Ecredit.Repo

config :logger, :default_formatter,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

config :phoenix, :json_library, Jason

import_config "#{config_env()}.exs"
