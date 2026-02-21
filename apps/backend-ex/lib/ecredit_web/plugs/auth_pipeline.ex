defmodule EcreditWeb.Plugs.AuthPipeline do
  @moduledoc """
  Guardian pipeline for JWT authentication.
  """
  use Guardian.Plug.Pipeline,
    otp_app: :ecredit,
    module: Ecredit.Guardian,
    error_handler: EcreditWeb.Plugs.AuthErrorHandler

  plug Guardian.Plug.VerifyHeader, scheme: "Bearer"
  plug Guardian.Plug.EnsureAuthenticated
  plug Guardian.Plug.LoadResource
end
