import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService, Message } from 'primeng/api';
import Swal from 'sweetalert2';
import { Role, RolesService } from 'src/app/_fake/services/role.service';
import { DialogService } from 'primeng/dynamicdialog';
import { EditPermissionsDialogComponent } from './edit-permissions-dialog/edit-permissions-dialog.component';
@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})
export class RolesComponent implements OnInit, OnDestroy {
  roles: Role[] = [];
  isLoading$: Observable<boolean>;
  private unsubscribe: Subscription[] = [];
  roleForm: FormGroup;
  messages: Message[] = [];
  isEditMode: boolean = false;
  selectedRoleId: number | null = null;
  visible: boolean = false;

  constructor(
    private rolesService: RolesService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private dialogService: DialogService // Inject DialogService
  ) {
    this.isLoading$ = this.rolesService.isLoading$;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.getRolesList();
  }

  initializeForm() {
    this.roleForm = this.fb.group({
      displayName: ['', Validators.required],
      description: ['', Validators.required],
    });
  }
  openEditPermissionsDialog(role: Role) {
    const ref = this.dialogService.open(EditPermissionsDialogComponent, {
      header: 'Edit Permissions',
      width: '50%',
      data: {
        roleId: role.id,
        roleName: role.display_name,
      },
    });

    ref.onClose.subscribe((updated) => {
      if (updated) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Permissions updated successfully.',
        });
        this.getRolesList()
        // Optionally refresh roles or permissions data
      }
    });
  }
  getRolesList() {
    const rolesSub = this.rolesService.getRoles().subscribe({
      next: (data: Role[]) => {
        this.roles = data;
      },
      error: (error) => {
        this.handleServerErrors(error);
      },
    });
    this.unsubscribe.push(rolesSub);
  }

  showDialog() {
    this.visible = true;
    this.selectedRoleId = null;
    this.isEditMode = false;
    this.roleForm.reset();
  }

  editRole(role: Role) {
    this.visible = true;
    this.selectedRoleId = role.id;
    this.isEditMode = true;
    this.roleForm.patchValue({
      displayName: role.display_name,
      description: role.description,
    });
  }

  submit() {
    this.messages = [];

    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    const formValues = this.roleForm.value;

    if (this.selectedRoleId) {
      // Update existing role
      const updateSub = this.rolesService
        .updateRole(this.selectedRoleId, {
          display_name: formValues.displayName,
          description: formValues.description,
        })
        .subscribe({
          next: (res: Role) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Role updated successfully.',
            });
            this.getRolesList();
            this.visible = false;
            this.roleForm.reset();
          },
          error: (error) => {
            this.handleServerErrors(error);
          },
        });
      this.unsubscribe.push(updateSub);
    } else {
      // Create new role
      const createSub = this.rolesService
        .createRole({
          display_name: formValues.displayName,
          description: formValues.description,
        })
        .subscribe({
          next: (res: any) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Role created successfully.',
            });
            this.getRolesList();
            this.visible = false;
            this.roleForm.reset();
          },
          error: (error) => {
            this.handleServerErrors(error);
          },
        });
      this.unsubscribe.push(createSub);
    }
  }

  deleteRole(roleId: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this role? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        const deleteSub = this.rolesService.deleteRole(roleId).subscribe({
          next: (res: any) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Role deleted successfully.',
            });
            this.getRolesList();
          },
          error: (error) => {
            this.handleServerErrors(error);
          },
        });
        this.unsubscribe.push(deleteSub);
      }
    });
  }

  private handleServerErrors(error: any) {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      const errorKeyToFormControlName: any = {
        display_name: 'displayName',
        description: 'description',
      };

      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          const formControlName = errorKeyToFormControlName[key];
          if (formControlName) {
            const control = this.roleForm.get(formControlName);
            if (control) {
              control.setErrors({ serverError: messages[0] });
              control.markAsTouched();
            }
          } else {
            // General messages
            this.messages.push({
              severity: 'error',
              summary: '',
              detail: messages.join(', '),
            });
          }
        }
      }
    } else {
      // Handle non-validation errors
      this.messages.push({
        severity: 'error',
        summary: 'Error',
        detail: 'An unexpected error occurred.',
      });
    }
  }

  onCancel() {
    this.visible = false;
    this.roleForm.reset();
  }

  // Getters for form controls
  get displayName() {
    return this.roleForm.get('displayName');
  }

  get description() {
    return this.roleForm.get('description');
  }

  get hasSuccessMessage(){
    return this.messages.some(msg=>msg.severity ==='success')
   }
  
   get hasErrorMessage() {
    return this.messages.some(msg => msg.severity === 'error');
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
