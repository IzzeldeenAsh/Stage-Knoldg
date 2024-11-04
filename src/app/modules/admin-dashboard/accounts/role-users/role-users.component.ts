// staff.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { StaffService, Staff } from 'src/app/_fake/services/staff/staff.service';
import { Observable, Subscription } from 'rxjs';
import { Table } from 'primeng/table';
import { MessageService, Message } from 'primeng/api';
import { FormBuilder } from '@angular/forms';
import { Role, RolesService } from 'src/app/_fake/services/roles/roles.service';

@Component({
  selector: 'app-role-users',
  templateUrl: './role-users.component.html',
  styleUrl: './role-users.component.scss'
})
export class RoleUsersComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  private unsubscribe: Subscription[] = [];
  listOfStaff: Staff[] = [];
  isLoading$: Observable<boolean>;
  visible: boolean = false; // For dialog visibility
  selectedStaffId: number | null = null;
  listOfRoles: Role[] = []; // All available roles
  userRoles: number[] = []; // Selected user's role IDs

  constructor(
    private staffService: StaffService,
    private rolesService: RolesService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private fb: FormBuilder
  ) {
    this.isLoading$ = this.rolesService.isLoading$;
  }

  ngOnInit() {
    this.getStaffList();
  }

  getStaffList() {
    const listSub = this.staffService.getStaffList().subscribe({
      next: (data: Staff[]) => {
        this.listOfStaff = data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.messages = [];

        if (error.validationMessages) {
          this.messages = error.validationMessages;
        } else {
          this.messages.push({
            severity: "error",
            summary: "Error",
            detail: "An unexpected error occurred.",
          });
        }
      },
    });
    this.unsubscribe.push(listSub);
  }

  editRoles(staff: Staff) {
    this.selectedStaffId = staff.id;
    this.visible = true;
    this.userRoles = [];
    this.getAllRoles();
    this.getUserRoles(staff.id);
  }

  getAllRoles() {
    const rolesSub = this.rolesService.getRoles().subscribe({
      next: (data: Role[]) => {
        this.listOfRoles = data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching roles', error);
      }
    });
    this.unsubscribe.push(rolesSub);
  }
 // ViewChild to reference the table
 @ViewChild('dt') table: Table;

 // Method to apply the filter to the table
 applyFilter(event: any) {
   const value = event.target.value.trim().toLowerCase();
   this.table.filterGlobal(value, 'contains');
 }

  getUserRoles(userId: number) {
    const userRolesSub = this.rolesService.getRolesByUserId(userId).subscribe({
      next: (data: Role[]) => {
        this.userRoles = data.map(role => role.id);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching user roles', error);
      }
    });
    this.unsubscribe.push(userRolesSub);
  }

  submitRoles() {
    if (this.selectedStaffId) {
      const updateSub = this.rolesService.syncRolesForUser(this.selectedStaffId, this.userRoles).subscribe({
        next: (res: any) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Roles updated successfully.'
          });
          this.visible = false; // Close dialog;
          this.getStaffList();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update roles.'
          });
        }
      });
      this.unsubscribe.push(updateSub);
    }
  }

  ngOnDestroy() {
    this.unsubscribe.forEach(sb => sb.unsubscribe());
  }
}



