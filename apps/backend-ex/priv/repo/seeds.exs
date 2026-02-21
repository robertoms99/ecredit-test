# Script for populating the database. You can run it as:
#
#     mix run priv/repo/seeds.exs
#
# Inside the script, you can read and write to any of your
# repositories directly:
#
#     Ecredit.Repo.insert!(%Ecredit.SomeSchema{})
#
# We recommend using the bang functions (`insert!`, `update!`
# and so on) as they will fail if something goes wrong.

import Ecto.Query

alias Ecredit.Repo
alias Ecredit.Accounts.User
alias Ecredit.Credits.RequestStatus

# Seed request statuses
statuses = [
  %{
    code: "CREATED",
    name: "Creada",
    description: "Solicitud creada",
    is_final: false,
    display_order: 1
  },
  %{
    code: "PENDING_FOR_BANK_DATA",
    name: "Pendiente de datos bancarios",
    description: "Esperando respuesta del proveedor",
    is_final: false,
    display_order: 2
  },
  %{
    code: "EVALUATING",
    name: "En evaluación",
    description: "En revisión",
    is_final: false,
    display_order: 3
  },
  %{
    code: "APPROVED",
    name: "Aprobada",
    description: "Aprobada",
    is_final: true,
    display_order: 4
  },
  %{
    code: "REJECTED",
    name: "Rechazada",
    description: "Rechazada",
    is_final: true,
    display_order: 5
  },
  %{
    code: "FAILED_FROM_PROVIDER",
    name: "Error del proveedor",
    description: "Error al consultar datos bancarios",
    is_final: true,
    display_order: 6
  }
]

Enum.each(statuses, fn status_attrs ->
  case Repo.get_by(RequestStatus, code: status_attrs.code) do
    nil ->
      %RequestStatus{}
      |> RequestStatus.changeset(status_attrs)
      |> Repo.insert!()

    _existing ->
      :ok
  end
end)

# Seed administrator users
admin_users = [
  %{
    email: "admin1@ecredit.com",
    password: "admin123456",
    full_name: "Administrador Principal",
    role: "admin"
  },
  %{
    email: "admin2@ecredit.com",
    password: "admin123456",
    full_name: "Administrador Secundario",
    role: "admin"
  }
]

Enum.each(admin_users, fn admin_attrs ->
  case Repo.get_by(User, email: admin_attrs.email) do
    nil ->
      %User{}
      |> User.registration_changeset(admin_attrs)
      |> Repo.insert!()

      IO.puts("✓ Created admin user: #{admin_attrs.email}")

    _existing ->
      :ok
  end
end)

IO.puts("\n✅ Seed completed")
IO.puts("\n📋 Administrator Users:")
IO.puts("   These administrators manage credit requests on behalf of clients.")
IO.puts("   Each admin can only see their own created requests.\n")
IO.puts("   Admin 1:")
IO.puts("     - Email: admin1@ecredit.com")
IO.puts("     - Password: admin123456")
IO.puts("")
IO.puts("   Admin 2:")
IO.puts("     - Email: admin2@ecredit.com")
IO.puts("     - Password: admin123456")
