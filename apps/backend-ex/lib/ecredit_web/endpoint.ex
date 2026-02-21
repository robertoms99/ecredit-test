defmodule EcreditWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :ecredit

  @session_options [
    store: :cookie,
    key: "_ecredit_key",
    signing_salt: "BLkBAAsd",
    same_site: "Lax"
  ]

  socket "/ws", EcreditWeb.UserSocket,
    websocket: [timeout: 45_000],
    longpoll: false,
    pubsub_server: Ecredit.PubSub

  plug CORSPlug,
    origin: &__MODULE__.cors_origin/0,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    headers: ["Authorization", "Content-Type"],
    expose: ["Authorization"],
    max_age: 86400

  plug Plug.Static,
    at: "/",
    from: :ecredit,
    gzip: not code_reloading?,
    only: EcreditWeb.static_paths(),
    raise_on_missing_only: code_reloading?

  if code_reloading? do
    plug Phoenix.CodeReloader
    plug Phoenix.Ecto.CheckRepoStatus, otp_app: :ecredit
  end

  plug Plug.RequestId
  plug Plug.Telemetry, event_prefix: [:phoenix, :endpoint]

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()

  plug Plug.MethodOverride
  plug Plug.Head
  plug Plug.Session, @session_options
  plug EcreditWeb.Router

  def cors_origin do
    Application.get_env(:ecredit, :frontend_url)
  end
end
