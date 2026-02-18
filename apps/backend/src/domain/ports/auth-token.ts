export interface IAuthTokenSigner {
  sign(payload: Record<string, any>): Promise<string>;
}

export interface IPasswordHasher {
  verify(password: string, hash: string): Promise<boolean>;
}
