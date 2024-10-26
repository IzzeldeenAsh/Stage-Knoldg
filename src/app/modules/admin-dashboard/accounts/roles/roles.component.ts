import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { RolesService, Role } from 'src/app/_fake/services/roles/roles.service';

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'],
})
export class RolesComponent implements OnInit, OnDestroy {
  roles: Role[] = [];
  isLoading$: Observable<boolean>;
  private unsubscribe: Subscription[] = [];

  constructor(private rolesService: RolesService) {
    this.isLoading$ = this.rolesService.isLoading$;
  }

  ngOnInit(): void {
    this.getRolesList();
  }

  getRolesList() {
    const rolesSub = this.rolesService.getRoles().subscribe({
      next: (data: Role[]) => {
        this.roles = data;
        console.log('Roles:', this.roles);
      },
      error: (error) => {
        console.error('Failed to fetch roles', error);
      }
    });
    this.unsubscribe.push(rolesSub);
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach(sb => sb.unsubscribe());
  }
}
