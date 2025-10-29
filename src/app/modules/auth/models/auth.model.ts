export class AuthModel {
  authToken: string;

  setAuth(auth: AuthModel) {
    this.authToken = auth.authToken;
  }
}