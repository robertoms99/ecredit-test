import Config

config :ecredit, Ecredit.Repo,
  username: "test",
  password: "test",
  hostname: "localhost",
  database: "test_db",
  port: 5432,
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 10

config :ecredit, Oban,
  engine: Oban.Engines.Basic,
  queues: [default: 10, credit_evaluation: 5],
  repo: Ecredit.Repo

config :ecredit, Ecredit.Guardian,
  issuer: "ecredit",
  secret_key: "xxxxxx",
  ttl: {7, :days}

config :ecredit, :mexico_provider_url, "http://localhost:3001/providers/mx"
config :ecredit, :colombia_provider_url, "http://localhost:3001/providers/co"
config :ecredit, :origin_api, "http://localhost:4000"

config :ecredit, :frontend_url, "http://localhost:5173"

config :ecredit, EcreditWeb.Endpoint,
  http: [ip: {0, 0, 0, 0}],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base: "xxxxxx",
  watchers: []

config :ecredit, dev_routes: true

config :logger, :default_formatter, format: "[$level] $message\n"

config :phoenix, :stacktrace_depth, 20

config :phoenix, :plug_init_mode, :runtime
