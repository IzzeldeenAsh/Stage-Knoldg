import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap, filter, take } from 'rxjs/operators';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { CountryUpdateModalService } from 'src/app/reusable-components/country-update-modal/country-update-modal.component';

@Injectable({ providedIn: 'root' })
export class CountryGuard {
  constructor(
    private profileService: ProfileService,
    private countryModalService: CountryUpdateModalService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.profileService.getProfile().pipe(
      switchMap(user => {
        // Check if user has a country
        if (!user.country_id) {
          console.log('Country Guard - User missing country, showing modal');
          this.countryModalService.showModal();

          // Wait for profile to be updated (when user updates country)
          return this.profileService.profileUpdate$.pipe(
            switchMap(() => this.profileService.getProfile()),
            map(updatedUser => {
              if (updatedUser.country_id) {
                console.log('Country Guard - Country updated, allowing access');
                return true;
              }
              // Still no country, keep blocking
              return false;
            }),
            filter(result => result === true), // Only continue when true
            take(1) // Take only the first success
          );
        }
        return of(true); // User has country, allow access
      })
    );
  }
}