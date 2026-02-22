defmodule Ecredit.Accounts do
  @moduledoc """
  The Accounts context.
  Handles user management and authentication.
  """
  import Ecto.Query

  alias Ecredit.Repo
  alias Ecredit.Accounts.User

  @doc """
  Gets a user by ID.
  """
  def get_user(id) do
    Repo.get(User, id)
  end

  @doc """
  Gets a user by email.
  """
  def get_user_by_email(email) when is_binary(email) do
    Repo.get_by(User, email: email)
  end

  @doc """
  Authenticates a user by email and password.
  Returns {:ok, user} or {:error, :invalid_credentials}.
  """
  def authenticate_user(email, password) do
    user = get_user_by_email(email)

    cond do
      user && User.valid_password?(user, password) && user.is_active ->
        {:ok, user}

      user && !user.is_active ->
        {:error, :account_disabled}

      true ->
        # Prevent timing attacks
        Bcrypt.no_user_verify()
        {:error, :invalid_credentials}
    end
  end

  @doc """
  Creates a new user.
  """
  def create_user(attrs) do
    %User{}
    |> User.registration_changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a user.
  """
  def update_user(%User{} = user, attrs) do
    user
    |> User.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Lists all users.
  """
  def list_users do
    Repo.all(User)
  end

  @doc """
  Lists active users.
  """
  def list_active_users do
    User
    |> where([u], u.is_active == true)
    |> Repo.all()
  end
end
