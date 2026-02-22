defmodule Ecredit.Release do
  @app :ecredit

  def migrate_and_seed do
    for repo <- repos() do
      run_migrations(repo)
      run_seeds(repo)
    end
  end

  defp repos do
    Application.fetch_env!(@app, :ecto_repos)
  end

  defp run_migrations(repo) do
    path = Application.app_dir(@app, "priv/repo/migrations")
    Ecto.Migrator.run(repo, path, :up, all: true)
  end

  defp run_seeds(repo) do
    seed = Application.app_dir(@app, "priv/repo/seeds.exs")
    if File.exists?(seed), do: Code.eval_file(seed)
  end
end
