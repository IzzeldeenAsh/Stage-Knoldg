// consulting-fields.component.ts
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MessageService, Message } from 'primeng/api';
import { Table } from 'primeng/table';
import { Observable, Subscription } from 'rxjs';
import {
  ConsultingField,
  ConsultingFieldsService,
} from 'src/app/_fake/services/admin-consulting-fields/consulting-fields.service';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-consulting-fields',
  templateUrl: './consulting-fields.component.html',
  styleUrls: ['./consulting-fields.component.scss'],
})
export class ConsultingFieldsComponent implements OnInit {
  messages: Message[] = [];
  private unsubscribe: Subscription[] = [];
  listOfConsultingFields: ConsultingField[] = [];
  isEditMode: boolean = false;
  isLoading$: Observable<boolean>;
  selectedConsultingFieldId: number | null = null;
  visible: boolean = false;

  consultingFieldForm: FormGroup;

  constructor(
    private consultingFieldsService: ConsultingFieldsService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private messageService: MessageService
  ) {
    this.isLoading$ = this.consultingFieldsService.isLoading$;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.getConsultingFieldsList();
  }

  initializeForm() {
    this.consultingFieldForm = this.fb.group({
      nameEn: ['', Validators.required],
      nameAr: ['', Validators.required],
    });
  }

  showDialog() {
    this.visible = true;
    this.selectedConsultingFieldId = null;
    this.isEditMode = false;
    this.consultingFieldForm.reset();
  }

  editConsultingField(consultingField: ConsultingField) {
    this.visible = true;
    this.selectedConsultingFieldId = consultingField.id;
    this.isEditMode = true;
    this.consultingFieldForm.patchValue({
      nameEn: consultingField.names.en,
      nameAr: consultingField.names.ar,
    });
  }

  getConsultingFieldsList() {
    const listSub = this.consultingFieldsService.getConsultingFields().subscribe({
      next: (data: ConsultingField[]) => {
        this.listOfConsultingFields = data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.messages = [];
        if (error.validationMessages) {
          this.messages = error.validationMessages;
        } else {
          this.messages.push({
            severity: 'error',
            summary: 'Error',
            detail: 'An unexpected error occurred.',
          });
        }
      },
    });
    this.unsubscribe.push(listSub);
  }

  @ViewChild('dt') table: Table;

  applyFilter(event: any) {
    const value = event.target.value.trim().toLowerCase();
    this.table.filterGlobal(value, 'contains');
  }

  get hasSuccessMessage() {
    return this.messages.some((msg) => msg.severity === 'success');
  }

  get hasErrorMessage() {
    return this.messages.some((msg) => msg.severity === 'error');
  }

  // Getters for form controls
  get nameEn() {
    return this.consultingFieldForm.get('nameEn');
  }

  get nameAr() {
    return this.consultingFieldForm.get('nameAr');
  }

  submit() {
    this.messages = [];

    if (this.consultingFieldForm.invalid) {
      this.consultingFieldForm.markAllAsTouched();
      return;
    }

    const formValues = this.consultingFieldForm.value;

    if (this.selectedConsultingFieldId) {
      // Update
      const updatedData = {
        name: {
          en: formValues.nameEn,
          ar: formValues.nameAr,
        },
      };

      const updateSub = this.consultingFieldsService
        .updateConsultingField(this.selectedConsultingFieldId, updatedData)
        .subscribe({
          next: (res: ConsultingField) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Consulting Field updated successfully.',
            });
            this.getConsultingFieldsList();
            this.visible = false;
            this.consultingFieldForm.reset();
          },
          error: (error) => {
            this.handleServerErrors(error);
          },
        });

      this.unsubscribe.push(updateSub);
    } else {
      // Create
      const newConsultingField: any = {
        name: {
          en: formValues.nameEn,
          ar: formValues.nameAr,
        },
      };

      const createSub = this.consultingFieldsService
        .createConsultingField(newConsultingField)
        .subscribe({
          next: (res: any) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Consulting Field created successfully.',
            });
            this.getConsultingFieldsList();
            this.visible = false;
            this.consultingFieldForm.reset();
          },
          error: (error) => {
            this.handleServerErrors(error);
          },
        });

      this.unsubscribe.push(createSub);
    }
  }

  deleteConsultingField(consultingFieldId: number) {
    this.messages = [];
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this Consulting Field? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        const deleteSub = this.consultingFieldsService
          .deleteConsultingField(consultingFieldId)
          .subscribe({
            next: (res: any) => {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Consulting Field deleted successfully.',
              });
              this.getConsultingFieldsList();
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
        'name.en': 'nameEn',
        'name.ar': 'nameAr',
      };

      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          const formControlName = errorKeyToFormControlName[key];
          if (formControlName) {
            const control = this.consultingFieldForm.get(formControlName);
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
    this.consultingFieldForm.reset();
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
