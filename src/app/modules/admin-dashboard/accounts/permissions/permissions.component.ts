import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Permission, PermissionsService } from 'src/app/_fake/services/permissions/permissions.service';

@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrl: './permissions.component.scss'
})
export class PermissionsComponent  implements OnInit, OnDestroy {
  permissions: Permission[] = [];
  isLoading$: Observable<boolean>;
  private unsubscribe: Subscription[] = [];

  constructor(private permissionsService: PermissionsService) {
    this.isLoading$ = this.permissionsService.isLoading$;
  }

  ngOnInit(): void {
    this.getPermissionsList();
  }

  getPermissionsList() {
    const permSub = this.permissionsService.getPermissions().subscribe({
      next: (data: Permission[]) => {
        this.permissions = data;
        console.log('Permissions:', this.permissions);
      },
      error: (error) => {
        console.error('Failed to fetch permissions', error);
      }
    });
    this.unsubscribe.push(permSub);
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach(sb => sb.unsubscribe());
  }
}