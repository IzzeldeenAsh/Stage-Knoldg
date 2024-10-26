import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Message } from "primeng/api";
import { Table } from "primeng/table";
import { Observable, Subscription } from "rxjs";
import Swal from 'sweetalert2';
import { Staff, StaffService } from "src/app/_fake/services/staff/staff.service";
import { Department, DepartmentsService } from "src/app/_fake/services/department/departments.service";
import { Position, PositionsService } from "src/app/_fake/services/positions/positions.service";

@Component({
  selector: 'app-staff',
  templateUrl: './staff.component.html',
  styleUrl: './staff.component.scss'
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

  @ViewChild("dt") table: Table;

  constructor(
    private staffService: StaffService,
    private departmentsService: DepartmentsService,
    private positionsService: PositionsService,
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
    this.newDepartmentId = staff.department_id || null;
    this.newPositionId = staff.position_id || null;
    this.selectedStaffId = staff.id;
    this.isEditMode = true;
  }

  getStaffList() {
    const listSub = this.staffService.getStaffList().subscribe({
      next: (data: Staff[]) => {
        this.listOfStaff = data;
        this.cdr.detectChanges();
        console.log("listOfStaff", this.listOfStaff);
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
      error: (error:any) => {
        console.error("Failed to fetch positions", error);
      }
    });
    this.unsubscribe.push(posSub);
  }

  applyFilter(event: any) {
    const value = event.target.value.trim().toLowerCase();
    this.table.filterGlobal(value, "contains");
  }

  submit() {
    if (this.selectedStaffId) {
      // Update existing staff
      const updatedData = {
        name: this.newStaffName,
        email: this.newStaffEmail,
        department_id: this.newDepartmentId?.toString(),
        position_id: this.newPositionId?.toString()
      };

      const updateSub = this.staffService.updateStaff(this.selectedStaffId, updatedData).subscribe({
        next: (res: Staff) => {
          this.messages.push({
            severity: 'success',
            summary: 'Success',
            detail: 'Staff updated successfully.'
          });
          this.getStaffList();
          this.visible = false;
        },
        error: (error) => {
          this.messages = error.validationMessages || [{
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update staff.'
          }];
          this.visible = false;
        }
      });

      this.unsubscribe.push(updateSub);
    } else {
      // Create new staff
      const newStaff: any = {
        name: this.newStaffName,
        email: this.newStaffEmail,
        department_id: this.newDepartmentId,
        position_id: this.newPositionId
      };

      const createSub = this.staffService.createStaff(newStaff).subscribe({
        next: (res: any) => {
          this.messages.push({
            severity: 'success',
            summary: 'Success',
            detail: 'Staff created successfully.'
          });
          this.getStaffList();
          this.visible = false;
        },
        error: (error) => {
          this.messages = error.validationMessages || [{
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create staff.'
          }];
          this.visible = false;
        }
      });

      this.unsubscribe.push(createSub);
    }
  }

  deleteStaff(staffId: number) {
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
            this.messages = error.validationMessages || [{
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete staff.'
            }];
          }
        });
        this.unsubscribe.push(deleteSub);
      }
    });
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}