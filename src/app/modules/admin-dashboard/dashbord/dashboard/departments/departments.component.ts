import { ChangeDetectorRef, Component, OnInit, ViewChild } from "@angular/core";
import { Message } from "primeng/api";
import { Table } from "primeng/table"; // Import PrimeNG table
import { Observable, Subscription } from "rxjs";
import Swal from 'sweetalert2';
import {
  Department,
  DepartmentResponse,
  DepartmentsService,
} from "src/app/_fake/services/department/departments.service";

@Component({
  selector: "app-department",
  templateUrl: "./departments.component.html",
  styleUrls: ["./departments.component.scss"],
})
export class DepartmentComponent implements OnInit {
  messages: Message[] = []; // Array to hold error messages
  private unsubscribe: Subscription[] = [];
  listOfDepartments: Department[] = [];
  isEditMode: boolean = false; // Tracks whether we are in edit mode
  isLoading$: Observable<boolean>;
  selectedDepartmentId: number | null = null; // Holds the ID of the department being edited
  visible: boolean = false;
  newDepartmentAr:string =''
  newDepartmentEn:string =''
  constructor(
    private _departments: DepartmentsService,
    private cdr : ChangeDetectorRef
  
  ) {
    this.isLoading$ = this._departments.isLoading$;
  }
  ngOnInit(): void {
    this.getDepartmentsList();
  }


  showDialog() {
    this.visible = true;
    this.newDepartmentEn = '';
    this.newDepartmentAr = '';
    this.selectedDepartmentId = null; // Reset selected department ID for create
    this.isEditMode = false; // Set to false when adding a new department
  }

  editDepartment(department: Department) {
    this.visible = true; // Open dialog
    this.newDepartmentEn = department.names.en;
    this.newDepartmentAr = department.names.ar;
    this.selectedDepartmentId = department.id; // Set the ID for update
    this.isEditMode = true; // Set to true for editing mode
  }

  

  getDepartmentsList() {
    const listSub = this._departments.getDepartments().subscribe({
      next: (data: Department[]) => {
        this.listOfDepartments = data;
        this.cdr.detectChanges()
      },
      error: (error) => {
        // Clear the existing messages
        this.messages = [];

        // Check if the error contains validation messages
        if (error.validationMessages) {
          this.messages = error.validationMessages; // Set the messages array
        } else {
          this.messages.push({
            severity: "error",
            summary: "Error",
            detail: "An unexpected error occurred.",
          });
        }
      },
    });
    this.unsubscribe.push(listSub)
  }

  @ViewChild("dt") table: Table; // ViewChild to reference the table

  // Method to apply the filter to the table
  applyFilter(event: any) {
    const value = event.target.value.trim().toLowerCase();
    this.table.filterGlobal(value, "contains");
  }

   get hasSuccessMessage(){
    return this.messages.some(msg=>msg.severity ==='success')
   }
   get hasErrorMessage() {
    return this.messages.some(msg => msg.severity === 'error');
  }

  submit() {
    if (this.selectedDepartmentId) {
      // Update the department if an ID exists
      const updatedData = {
        name: {
          en: this.newDepartmentEn,
          ar: this.newDepartmentAr
        }
      };

     const updateSub= this._departments.updateDepartment(this.selectedDepartmentId, updatedData).subscribe({
        next: (res: Department) => {
          this.messages.push({
            severity: 'success',
            summary: 'Success',
            detail: 'Department updated successfully.'
          });
          this.getDepartmentsList(); // Refresh the list after updating
          this.visible = false; // Close the dialog
        },
        error: (error) => {
          this.messages = error.validationMessages || [{
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update department.'
          }];
          this.visible = false; // Close the dialog
        }
      });

      this.unsubscribe.push(updateSub)
    } else {
      // Create a new department if no ID exists
      const newDepartment: any = {
        name: {
          en: this.newDepartmentEn,
          ar: this.newDepartmentAr
        }
      };

   const createSub =    this._departments.createDepartment(newDepartment).subscribe({
        next: (res: any) => {
          this.messages.push({
            severity: 'success',
            summary: 'Success',
            detail: 'Department created successfully.'
          });
          this.getDepartmentsList(); // Refresh the list after creating
          this.visible = false; // Close the dialog
        },
        error: (error) => {
          this.messages = error.validationMessages || [{
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create department.'
          }];
        }
      });

      this.unsubscribe.push(createSub)
    }
  }

   // Example delete department method
   deleteDepartment(departmentId: number) {
    // Use SweetAlert2 for confirmation
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this department? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // If user confirms, proceed with the deletion
        const deleteSub = this._departments.deleteDepartment(departmentId).subscribe({
          next: (res: any) => {
            this.messages.push({
              severity: 'success',
              summary: 'Success',
              detail: 'Department deleted successfully.'
            });
            this.getDepartmentsList(); // Refresh the department list after deletion
          },
          error: (error) => {
            this.messages = error.validationMessages || [{
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete department.'
            }];
          }
        });
      }
    });
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
