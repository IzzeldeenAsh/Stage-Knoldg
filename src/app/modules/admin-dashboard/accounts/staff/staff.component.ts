import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Message, MessageService } from "primeng/api";
import { Table } from "primeng/table";
import { Observable, Subscription } from "rxjs";
import Swal from 'sweetalert2';
import { Staff, StaffService } from "src/app/_fake/services/staff/staff.service";
import { Department, DepartmentsService } from "src/app/_fake/services/department/departments.service";
import { Position, PositionsService } from "src/app/_fake/services/positions/positions.service";
import { RolesService, Role } from "src/app/_fake/services/roles/roles.service"; // Ensure Role is imported

@Component({
  selector: 'app-staff',
  templateUrl: './staff.component.html',
  styleUrls: ['./staff.component.scss'],
  providers: [MessageService] // Add MessageService if not already provided
})
export class StaffComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  private unsubscribe: Subscription[] = [];
  listOfStaff: Staff[] = [];
  listOfDepartments: Department[] = [];
  listOfPositions: Position[] = [];
  isEditMode: boolean = false;
  isLoading$: Observable<boolean>;
  selectedStaffId: number | null = null;
  visible: boolean = false;
  newStaffName: string = '';
  newStaffEmail: string = '';
  newDepartmentId: number | null = null;
  newPositionId: number | null = null;

  // Variables for Role Management
  rolesDialogVisible: boolean = false;
  listOfRoles: Role[] = []; // All available roles
  userRoles: number[] = []; // Selected user's role IDs

  @ViewChild("dt") table: Table;

  constructor(
    private staffService: StaffService,
    private departmentsService: DepartmentsService,
    private positionsService: PositionsService,
    private rolesService: RolesService, // Inject RolesService
    private messageService: MessageService, // Inject MessageService
    private cdr: ChangeDetectorRef
  ) {
    this.isLoading$ = this.staffService.isLoading$;
  }

  ngOnInit(): void {
    this.getStaffList();
    this.getDepartmentsList();
    this.getPositionsList();
  }

  showDialog() {
    this.visible = true;
    this.newStaffName = '';
    this.newStaffEmail = '';
    this.newDepartmentId = null;
    this.newPositionId = null;
    this.selectedStaffId = null;
    this.isEditMode = false;
  }

  editStaff(staff: Staff) {
    this.visible = true;
    this.newStaffName = staff.name;
    this.newStaffEmail = staff.email;
    this.newDepartmentId = staff.department?.id || null;
    this.newPositionId = staff.position?.id || null; // Corrected to position.id
    this.selectedStaffId = staff.id;
    this.isEditMode = true;
  }

  // New Method to Edit Roles
  editRoles(staff: Staff) {
    this.selectedStaffId = staff.id;
    this.rolesDialogVisible = true;
    this.userRoles = [];
    this.getAllRoles();
    this.getUserRoles(staff.id);
  }

  private handleServerErrors(error: any) {
    this.messages = [];
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          this.messages.push({ severity: 'error', summary: '', detail: messages.join(', ') });
        }
      }
    } else {
      this.messages.push({
        severity: 'error',
        summary: 'Error',
        detail: 'An unexpected error occurred.'
      });
    }
  }

  getStaffList() {
    const listSub = this.staffService.getStaffList().subscribe({
      next: (data: Staff[]) => {
        this.listOfStaff = data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.handleServerErrors(error);
      },
    });
    this.unsubscribe.push(listSub);
  }

  getDepartmentsList() {
    const depSub = this.departmentsService.getDepartments().subscribe({
      next: (data: Department[]) => {
        this.listOfDepartments = data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error("Failed to fetch departments", error);
      }
    });
    this.unsubscribe.push(depSub);
  }

  getPositionsList() {
    const posSub = this.positionsService.getPositions().subscribe({
      next: (data: Position[]) => {
        this.listOfPositions = data;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error("Failed to fetch positions", error);
      }
    });
    this.unsubscribe.push(posSub);
  }

  applyFilter(event: any) {
    const value = event.target.value.trim().toLowerCase();
    this.table.filterGlobal(value, "contains");
  }

  get hasSuccessMessage(){
    return this.messages.some(msg => msg.severity === 'success');
  }

  get hasErrorMessage() {
    return this.messages.some(msg => msg.severity === 'error');
  }

  submit() {
    this.messages = [];
    const staffData = {
      name: this.newStaffName,
      email: this.newStaffEmail,
      department_id: this.newDepartmentId?.toString(),
      position_id: this.newPositionId?.toString()
    };

    const staffObservable = this.selectedStaffId
      ? this.staffService.updateStaff(this.selectedStaffId, staffData)
      : this.staffService.createStaff(staffData);

    const staffSub = staffObservable.subscribe({
      next: (res: Staff) => {
        this.messages.push({
          severity: 'success',
          summary: 'Success',
          detail: `Staff ${this.selectedStaffId ? 'updated' : 'created'} successfully.`
        });
        this.getStaffList();
        this.visible = false;
      },
      error: (error) => {
        this.handleServerErrors(error);
      }
    });

    this.unsubscribe.push(staffSub);
  }

  deleteStaff(staffId: number) {
    this.messages = [];
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this staff? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const deleteSub = this.staffService.deleteStaff(staffId).subscribe({
          next: (res: any) => {
            this.messages.push({
              severity: 'success',
              summary: 'Success',
              detail: 'Staff deleted successfully.'
            });
            this.getStaffList();
          },
          error: (error) => {
            this.handleServerErrors(error);
          }
        });
        this.unsubscribe.push(deleteSub);
      }
    });
  }

  // New Methods for Role Management
  getAllRoles() {
    const rolesSub = this.rolesService.getRoles().subscribe({
      next: (data: Role[]) => {
        this.listOfRoles = data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch roles.'
        });
        console.error('Error fetching roles', error);
      }
    });
    this.unsubscribe.push(rolesSub);
  }

  getUserRoles(userId: number) {
    const userRolesSub = this.rolesService.getRolesByUserId(userId).subscribe({
      next: (data: Role[]) => {
        this.userRoles = data.map(role => role.id);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch user roles.'
        });
        console.error('Error fetching user roles', error);
      }
    });
    this.unsubscribe.push(userRolesSub);
  }

  submitRoles() {
    if (this.selectedStaffId !== null) {
      this.messageService.clear();
      const updateSub = this.rolesService.syncRolesForUser(this.selectedStaffId, this.userRoles).subscribe({
        next: (res: any) => {
          this.messages.push({
            severity: 'success',
            summary: 'Success',
            detail: 'Roles updated successfully.'
          });
          this.rolesDialogVisible = false; // Close dialog
          this.getStaffList();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update roles.'
          });
          console.error('Error updating roles', error);
        }
      });
      this.unsubscribe.push(updateSub);
    }
  }

  ngOnDestroy() {
    this.unsubscribe.forEach(sb => sb.unsubscribe());
  }
}
