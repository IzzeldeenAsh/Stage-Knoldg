import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { first, map } from 'rxjs';
import { AuthService } from 'src/app/modules/auth/services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  authService.getProfile().pipe(first()).subscribe({
    next:(user)=>{
      if(user &&(user.roles.includes('admin') || user.roles.includes('staff'))){
        return true
      }else{
        router.navigate(['/auth/login']);
        return false;
      }
    },
    error:(error)=>{
      router.navigate(['/auth/login']);
      return false;
    }
  })

  router.navigate(['/auth/login']);
  return false;
};
