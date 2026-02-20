import Config

if System.get_env("PHX_SERVER") do
  config :ecredit, EcreditWeb.Endpoint, server: true
end

if mexico_provider_url = System.get_env("MEXICO_PROVIDER_URL") do
  config :ecredit, :mexico_provider_url, mexico_provider_url
end

if colombia_provider_url = System.get_env("COLOMBIA_PROVIDER_URL") do
  config :ecredit, :colombia_provider_url, colombia_provider_url
end


if frontend_url = System.get_env("FRONTEND_URL") do
  config :ecredit, :frontend_url, frontend_url
end

if config_env() == :prod do
  database_url =
    System.get_env("DATABASE_URL") ||
      raise """
      environment variable DATABASE_URL is missing.
      For example: ecto://USER:PASS@HOST/DATABASE
      """

  maybe_ipv6 = if System.get_env("ECTO_IPV6") in ~w(true 1), do: [:inet6], else: []

  config :ecredit, Ecredit.Repo,
    # ssl: true,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
    socket_options: maybe_ipv6

  secret_key_base =
    System.get_env("JWT_SECRET") ||
      raise """
      environment variable JWT_SECRET is missing.
      You can generate one by calling: mix phx.gen.secret
      """

  config :ecredit, :dns_cluster_query, System.get_env("DNS_CLUSTER_QUERY")

  host = System.get_env("PHX_HOST") || "example.com"
  port = String.to_integer(System.get_env("PORT", "4000"))

  config :ecredit, :origin_api, System.get_env("ORIGIN_API")

  config :ecredit, EcreditWeb.Endpoint,
    url: [host: host, port: port, scheme: "https"],
    http: [
      ip: {0, 0, 0, 0}
    ],
    secret_key_base: secret_key_base

  jwt_secret =
    System.get_env("JWT_SECRET") ||
      raise """
      environment variable JWT_SECRET is missing.
      """

  config :ecredit, Ecredit.Guardian,
    issuer: "ecredit",
    secret_key: jwt_secret,
    ttl: {7, :days}
end
