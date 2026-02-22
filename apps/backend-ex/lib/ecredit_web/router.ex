defmodule EcreditWeb.Router do
  use EcreditWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  pipeline :authenticated do
    plug EcreditWeb.Plugs.AuthPipeline
  end

  scope "/api", EcreditWeb do
    pipe_through :api

    post "/auth/login", AuthController, :login
    get "/countries", CountryController, :index
    get "/request-statuses", RequestStatusController, :index
    post "/webhook/process-bank-data", WebhookController, :process_bank_data
  end

  scope "/api", EcreditWeb do
    pipe_through [:api, :authenticated]

    get "/auth/me", AuthController, :me
    resources "/credit-requests", CreditRequestController, only: [:index, :show, :create]
    patch "/credit-requests/:id/status", CreditRequestController, :update_status
    get "/credit-requests/:id/history", CreditRequestController, :history
  end

  scope "/" do
    pipe_through :api

    get "/health", EcreditWeb.HealthController, :index
  end
end
