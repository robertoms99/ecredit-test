import Config


config :ecredit, Oban,
  engine: Oban.Engines.Basic,
  queues: [default: 10, credit_evaluation: 5],
  repo: Ecredit.Repo

config :logger, level: :info
