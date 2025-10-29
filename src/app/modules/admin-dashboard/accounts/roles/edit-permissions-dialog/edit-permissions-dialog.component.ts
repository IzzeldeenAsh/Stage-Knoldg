import { Component, OnInit, Inject } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { Permission, PermissionsService } from 'src/app/_fake/services/permissions/permissions.service';
import { RolesService } from 'src/app/_fake/services/roles/roles.service';

@Component({
  selector: 'app-edit-permissions-dialog',
  templateUrl: './edit-permissions-dialog.component.html',
  styleUrls: ['./edit-permissions-dialog.component.scss'],
})
export class EditPermissionsDialogComponent implements OnInit {
  roleId: number;
  roleName: string;
  permissions: Permission[] = [];
  selectedPermissions: number[] = [];
  isLoading = false;

  constructor(
    private permissionsService: PermissionsService,
    private rolesService: RolesService,
    private config: DynamicDialogConfig,
    private ref: DynamicDialogRef,
    private messageService: MessageService
  ) {
    this.roleId = this.config.data.roleId;
    this.roleName = this.config.data.roleName;
  }

  ngOnInit(): void {
    this.loadPermissions();
  }

  loadPermissions() {
    this.isLoading = true;
    // Fetch all permissions
    this.permissionsService.getPermissions().subscribe({
      next: (allPermissions) => {
        this.permissions = allPermissions;
        // Fetch permissions assigned to the role
        this.rolesService.getRolePermissions(this.roleId).subscribe({
          next: (rolePermissions) => {
            this.selectedPermissions = rolePermissions.map((p) => p.id);
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
          },
        });
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  save() {
    this.isLoading = true;
    const payload = {
      permissions: this.selectedPermissions,
    };
    this.rolesService.updateRolePermissions(this.roleId, payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.ref.close(true); // Indicate that an update was made
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  cancel() {
    this.ref.close();
  }
}
