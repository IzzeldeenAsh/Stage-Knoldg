import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { first } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthGuard  {
  constructor(private authService: AuthService, private router:Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const currentUser = this.authService.getProfile().pipe(first()).subscribe({
      next:(user)=>{
      if(user.verified){
        return true
      }
      },
      error:(error)=>{
        this.router.navigate(['auth'])
        return false;
      }
    })
    this.router.navigate(['auth'])
    return false;
  }
}
