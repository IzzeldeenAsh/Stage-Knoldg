import { ChangeDetectorRef, Component, OnInit, ViewChild } from "@angular/core";
import { Message } from "primeng/api";
import { Table } from "primeng/table"; // Import PrimeNG table
import { Observable, Subscription } from "rxjs";
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import {
  Department,
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
  departmentForm: FormGroup;
  //
  constructor(
    private _departments: DepartmentsService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder, // Inject FormBuilder
    private messageService: MessageService // Inject MessageService
  
  ) {
    this.isLoading$ = this._departments.isLoading$;
  }
  ngOnInit(): void {
console.log("Step 1");
    this.departmentForm = this.fb.group({
      arabicName: ['', Validators.required],
      englishName: ['', Validators.required]
    });
    
    this.getDepartmentsList();
  }


  showDialog() {
    this.visible = true;
    this.selectedDepartmentId = null; // Reset selected department ID for create
    this.isEditMode = false; // Set to false when adding a new department
    this.departmentForm.reset(); // Reset the form
  }

  editDepartment(department: Department) {
    this.visible = true; // Open dialog
    this.selectedDepartmentId = department.id; // Set the ID for update
    this.isEditMode = true; // Set to true for editing mode
    this.departmentForm.patchValue({
      arabicName: department.names.ar,
      englishName: department.names.en
    });
  }

  private handleServerErrors(error: any) {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      const errorKeyToFormControlName:any = {
        'name.en': 'englishName',
        'name.ar': 'arabicName'
      };
  
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          const formControlName = errorKeyToFormControlName[key];
          if (formControlName) {
            const control = this.departmentForm.get(formControlName);
            if (control) {
              // Set the server error on the control
              control.setErrors({ serverError: messages[0] }); // Use messages[0] or combine messages as needed
              control.markAsTouched(); // Mark as touched to display the error
            }
          } else {
            // If the error doesn't map to a form control, add it to general messages
            this.messages.push({ severity: 'error', summary: '', detail: messages.join(', ') });
          }
        }
      }
    } else {
      // Handle non-validation errors
      this.messages.push({
        severity: 'error',
        summary: 'Error',
        detail: 'An unexpected error occurred.'
      });
    }
  }
  

  getDepartmentsList() {

    console.log("Fetching department list...");

    const listSub = this._departments.getDepartments().subscribe({
      next: (data: Department[]) => {
        console.log("Received department data:", data);
        this.listOfDepartments = data;
        this.cdr.detectChanges()
      },
      error: (error) => {
        console.error("Error fetching departments:", error);
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
  onCancel() {
    this.visible = false;
    this.departmentForm.reset();
  }
  get arabicName() {
    return this.departmentForm.get('arabicName');
  }
  
  get englishName() {
    return this.departmentForm.get('englishName');
  }
  submit() {
    this.messages = [];
  
    if (this.departmentForm.invalid) {
      // Mark all controls as touched to trigger validation messages
      this.departmentForm.markAllAsTouched();
      return;
    }
  
    const formValues = this.departmentForm.value;
  
    if (this.selectedDepartmentId) {
      // Update the department if an ID exists
      const updatedData = {
        name: {
          en: formValues.englishName,
          ar: formValues.arabicName
        }
      };
  
      const updateSub = this._departments.updateDepartment(this.selectedDepartmentId, updatedData).subscribe({
        next: (res: Department) => {
          // this.messages.push({
          //   severity: 'success',
          //   summary: 'Success',
          //   detail: 'Department updated successfully.'
          // });
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Department updated successfully.',
             // or just omit this line
          });
          this.getDepartmentsList(); // Refresh the list after updating
          this.visible = false; // Close the dialog
          this.departmentForm.reset(); // Reset the form
        },
        error: (error) => {
          this.handleServerErrors(error);
        }
      });
  
      this.unsubscribe.push(updateSub)
    } else {
      // Create a new department if no ID exists
      const newDepartment: any = {
        name: {
          en: formValues.englishName,
          ar: formValues.arabicName
        }
      };
  
      const createSub = this._departments.createDepartment(newDepartment).subscribe({
        next: (res: any) => {
          // this.messages.push({
          //   severity: 'success',
          //   summary: 'Success',
          //   detail: 'Department created successfully.'
          // });
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Department created successfully.',
             // or just omit this line
          });
          this.getDepartmentsList(); // Refresh the list after creating
          this.visible = false; // Close the dialog
          this.departmentForm.reset(); // Reset the form
        },
        error: (error) => {
          this.handleServerErrors(error);
        }
      });
  
      this.unsubscribe.push(createSub)
    }
  }
  

   // Example delete department method
   deleteDepartment(departmentId: number) {
    // Use SweetAlert2 for confirmation
    this.messages=[];
    console.log("this.messages",this.messages);
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
            // this.messages.push({
            //   severity: 'success',
            //   summary: 'Success',
            //   detail: 'Department deleted successfully.'
            // });
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Department created successfully.',
               // or just omit this line
            });
            this.getDepartmentsList(); // Refresh the department list after deletion
          },
          error: (error) => {
            this.handleServerErrors(error);
          }
        });
      }
    });
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
