defmodule Ecredit.Guardian do
  @moduledoc """
  Guardian implementation for JWT authentication.
  """
  use Guardian, otp_app: :ecredit

  alias Ecredit.Accounts

  @doc """
  Generates the subject for the JWT from a user.
  """
  def subject_for_token(%Ecredit.Accounts.User{id: id}, _claims) do
    {:ok, to_string(id)}
  end

  def subject_for_token(_, _) do
    {:error, :invalid_resource}
  end

  @doc false
  def resource_from_claims(%{"sub" => id}) do
    case Accounts.get_user(id) do
      nil -> {:error, :user_not_found}
      user -> {:ok, user}
    end
  end

  def resource_from_claims(_) do
    {:error, :invalid_claims}
  end

  @doc """
  Generates a token with additional claims for the user.
  """
  def create_token(user) do
    claims = %{
      "email" => user.email,
      "role" => user.role
    }

    encode_and_sign(user, claims)
  end
end
