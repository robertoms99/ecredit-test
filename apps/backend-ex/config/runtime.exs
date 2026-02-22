import Config
import Dotenvy

source!([
  Path.absname(".env", "./"),
  Path.absname(".env.#{config_env()}", ""),
  System.get_env()
  ])



if mexico_provider_url = env!("MEXICO_PROVIDER_URL") do
  config :ecredit, :mexico_provider_url, mexico_provider_url
end

if colombia_provider_url = env!("COLOMBIA_PROVIDER_URL") do
  config :ecredit, :colombia_provider_url, colombia_provider_url
end

if frontend_url = env!("FRONTEND_URL") do
  config :ecredit, :frontend_url, frontend_url
end

  database_url =
    env!("DATABASE_URL") ||
      raise """
      environment variable DATABASE_URL is missing.
      For example: ecto://USER:PASS@HOST/DATABASE
      """

  maybe_ipv6 =  []

  config :ecredit, Ecredit.Repo,
    # ssl: true,
    url: database_url,
    pool_size: 10,
    socket_options: maybe_ipv6

  secret_key_base =
    env!("JWT_SECRET") ||
      raise """
      environment variable JWT_SECRET is missing.
      You can generate one by calling: mix phx.gen.secret
      """


  port = String.to_integer(env!("PORT"))

  config :ecredit, :origin_api, env!("ORIGIN_API")

  config :ecredit, EcreditWeb.Endpoint,
    url: [host: "localhost", port: port, scheme: "https"],
    http: [
      ip: {0, 0, 0, 0},
      port: port
    ],
    secret_key_base: secret_key_base

  jwt_secret =
    env!("JWT_SECRET") ||
      raise """
      environment variable JWT_SECRET is missing.
      """

  config :ecredit, Ecredit.Guardian,
    issuer: "ecredit",
    secret_key: jwt_secret,
    ttl: {7, :days}
