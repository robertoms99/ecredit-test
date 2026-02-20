defmodule Ecredit.Accounts.User do
  @moduledoc """
  Schema for users table.
  Maps to the existing users table created by the Bun backend.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime]

  schema "users" do
    field :email, :string
    field :password_hash, :string
    field :full_name, :string
    field :role, :string, default: "user"
    field :is_active, :boolean, default: true
    field :password, :string, virtual: true

    has_many :credit_requests, Ecredit.Credits.CreditRequest

    timestamps(inserted_at: :created_at, updated_at: :updated_at)
  end

  @doc """
  Changeset for user registration.
  """
  def registration_changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :password, :full_name, :role])
    |> validate_required([:email, :password, :full_name])
    |> validate_email()
    |> validate_password()
    |> hash_password()
  end

  @doc """
  Changeset for updating user profile (without password).
  """
  def changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :full_name, :role, :is_active])
    |> validate_required([:email, :full_name])
    |> validate_email()
  end

  defp validate_email(changeset) do
    changeset
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+$/, message: "must be a valid email")
    |> validate_length(:email, max: 255)
    |> unique_constraint(:email)
  end

  defp validate_password(changeset) do
    changeset
    |> validate_required([:password])
    |> validate_length(:password, min: 6, max: 72)
  end

  defp hash_password(changeset) do
    case get_change(changeset, :password) do
      nil ->
        changeset

      password ->
        changeset
        |> put_change(:password_hash, Bcrypt.hash_pwd_salt(password))
        |> delete_change(:password)
    end
  end

  @doc """
  Verifies the password against the stored hash.
  """
  def valid_password?(%__MODULE__{password_hash: hash}, password)
      when is_binary(hash) and byte_size(password) > 0 do
    Bcrypt.verify_pass(password, hash)
  end

  def valid_password?(_, _), do: Bcrypt.no_user_verify()
end
