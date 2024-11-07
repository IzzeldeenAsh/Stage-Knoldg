import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from 'src/app/modules/auth/services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.currentUser$.pipe(
    map(user=>{
      if(user &&(user.roles.includes('admin') || user.roles.includes('staff'))){
      return true
      }else{
        router.navigate(['/auth/login']); // Redirect to login if not authorized
        return false; // Deny access
      }
    })
  )

};
