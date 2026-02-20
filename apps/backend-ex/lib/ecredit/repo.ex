defmodule Ecredit.Repo do
  use Ecto.Repo,
    otp_app: :ecredit,
    adapter: Ecto.Adapters.Postgres
end
