import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MessageService, Message } from "primeng/api";
import { Table } from "primeng/table";
import { Observable, Subscription } from "rxjs";
import { Position, PositionsService } from "src/app/_fake/services/positions/positions.service";
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-positions',
  templateUrl: './positions.component.html',
  styleUrls: ['./positions.component.scss']
})
export class PositionsComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  private unsubscribe: Subscription[] = [];
  listOfPositions: Position[] = [];
  filteredPositions: Position[] = [];
  isEditMode: boolean = false;
  isLoading$: Observable<boolean>;
  selectedPositionId: number | null = null;
  visible: boolean = false;
  positionForm: FormGroup;

  // Pagination
  paginator = { page: 1, pageSize: 10, pageSizes: [10, 20, 30, 50, 100], total: 0 };
  searchTerm: string = '';

  @ViewChild("dt") table: Table;

  constructor(
    private positionsService: PositionsService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private messageService: MessageService
  ) {
    this.isLoading$ = this.positionsService.isLoading$;
  }

  ngOnInit(): void {
    this.filteredPositions = [];
    this.positionForm = this.fb.group({
      arabicName: ['', Validators.required],
      englishName: ['', Validators.required]
    });
    this.getPositionsList();
  }

  showDialog() {
    this.visible = true;
    this.selectedPositionId = null;
    this.isEditMode = false;
    this.positionForm.reset();
  }

  editPosition(position: Position) {
    this.visible = true;
    this.selectedPositionId = position.id;
    this.isEditMode = true;
    this.positionForm.patchValue({
      arabicName: position.names.ar,
      englishName: position.names.en
    });
  }

  get hasSuccessMessage(){
    return this.messages.some(msg=>msg.severity ==='success')
  }
  get hasErrorMessage() {
    return this.messages.some(msg => msg.severity === 'error');
  }

  getPositionsList() {
    const listSub = this.positionsService.getPositions(this.paginator.page, this.paginator.pageSize).subscribe({
      next: (response) => {
        this.listOfPositions = response.data;
        this.filteredPositions = response.data;
        this.paginator.total = response.meta.total;
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

  pageChange(page: number) {
    this.paginator.page = page;
    this.getPositionsList();
  }

  pageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    if (target) {
      const newPageSize = parseInt(target.value, 10);
      this.paginator.pageSize = newPageSize;
      this.paginator.page = 1; // Reset to first page when changing page size
      this.getPositionsList();
    }
  }

  applyFilter(event: any) {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    if (!filterValue) {
      this.filteredPositions = this.listOfPositions;
      return;
    }

    this.filteredPositions = this.listOfPositions.filter(position => 
      position.name?.toLowerCase().includes(filterValue) ||
      position.names?.en?.toLowerCase().includes(filterValue) ||
      position.names?.ar?.toLowerCase().includes(filterValue)
    );
  }

  onLazyLoad(event: any) {
    this.paginator.page = Math.floor(event.first / event.rows) + 1;
    this.paginator.pageSize = event.rows;
    this.getPositionsList();
  }

  get arabicName() {
    return this.positionForm.get('arabicName');
  }

  get englishName() {
    return this.positionForm.get('englishName');
  }

  submit() {
    this.messages = [];

    if (this.positionForm.invalid) {
      this.positionForm.markAllAsTouched();
      return;
    }

    const formValues = this.positionForm.value;

    if (this.selectedPositionId) {
      // Update existing position
      const updatedData = {
        name: {
          en: formValues.englishName,
          ar: formValues.arabicName
        }
      };

      const updateSub = this.positionsService.updatePosition(this.selectedPositionId, updatedData).subscribe({
        next: (res: Position) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Position updated successfully.'
          });
          this.getPositionsList();
          this.visible = false;
          this.positionForm.reset();
        },
        error: (error) => {
          this.handleServerErrors(error);
        }
      });

      this.unsubscribe.push(updateSub);
    } else {
      // Create new position
      const newPosition: any = {
        name: {
          en: formValues.englishName,
          ar: formValues.arabicName
        }
      };

      const createSub = this.positionsService.createPosition(newPosition).subscribe({
        next: (res: any) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Position created successfully.'
          });
          this.getPositionsList();
          this.visible = false;
          this.positionForm.reset();
        },
        error: (error) => {
          this.handleServerErrors(error);
        }
      });

      this.unsubscribe.push(createSub);
    }
  }

  onCancel() {
    this.visible = false;
    this.positionForm.reset();
  }

  deletePosition(positionId: number) {
    this.messages=[]
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this position? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const deleteSub = this.positionsService.deletePosition(positionId).subscribe({
          next: (res: any) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Position deleted successfully.'
            });
            this.getPositionsList();
          },
          error: (error) => {
            this.handleServerErrors(error);
          }
        });
        this.unsubscribe.push(deleteSub);
      }
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
            const control = this.positionForm.get(formControlName);
            if (control) {
              // Set the server error on the control
              control.setErrors({ serverError: messages[0] });
              control.markAsTouched();
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

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
  Math = Math;
}
