import { FirebaseAuthService } from '../auth/FirebaseAuthService';

export const authService = {
  login: FirebaseAuthService.loginWithEmail.bind(FirebaseAuthService),
  logout: FirebaseAuthService.logout.bind(FirebaseAuthService),
  googleLogin: FirebaseAuthService.loginWithGoogle.bind(FirebaseAuthService),
  resetPassword: FirebaseAuthService.resetPassword.bind(FirebaseAuthService),
  changePassword: FirebaseAuthService.changePassword.bind(FirebaseAuthService),
  createAuthAccount: FirebaseAuthService.createAuthAccount.bind(FirebaseAuthService)
};
