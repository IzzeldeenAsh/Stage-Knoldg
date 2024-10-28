// consulting-fields.component.ts
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Message } from 'primeng/api';
import { Table } from 'primeng/table';
import { Observable, Subscription } from 'rxjs';
import { ConsultingField, ConsultingFieldsService } from 'src/app/_fake/services/admin-consulting-fields/consulting-fields.service';
import Swal from 'sweetalert2';


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

  // Form fields
  newCode: string = '';
  newIsicCodeId: string = '';
  newStatus: string = '';
  newNameEn: string = '';
  newNameAr: string = '';

  constructor(
    private consultingFieldsService: ConsultingFieldsService,
    private cdr: ChangeDetectorRef
  ) {
    this.isLoading$ = this.consultingFieldsService.isLoading$;
  }

  ngOnInit(): void {
    this.getConsultingFieldsList();
  }

  showDialog() {
    this.visible = true;
    this.resetForm();
    this.selectedConsultingFieldId = null;
    this.isEditMode = false;
  }

  editConsultingField(consultingField: ConsultingField) {
    this.visible = true;
    this.newCode = consultingField.code;
    this.newIsicCodeId = consultingField.isic_code_id;
    this.newStatus = consultingField.status;
    this.newNameEn = consultingField.names.en;
    this.newNameAr = consultingField.names.ar;
    this.selectedConsultingFieldId = consultingField.id;
    this.isEditMode = true;
  }

  resetForm() {
    this.newCode = '';
    this.newIsicCodeId = '';
    this.newStatus = '';
    this.newNameEn = '';
    this.newNameAr = '';
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

  submit() {
    this.messages = [];
    if (this.selectedConsultingFieldId) {
      // Update
      const updatedData = {
        code: this.newCode,
        isic_code_id: this.newIsicCodeId,
        status: this.newStatus,
        name: {
          en: this.newNameEn,
          ar: this.newNameAr,
        },
      };

      const updateSub = this.consultingFieldsService
        .updateConsultingField(this.selectedConsultingFieldId, updatedData)
        .subscribe({
          next: (res: ConsultingField) => {
            this.messages.push({
              severity: 'success',
              summary: 'Success',
              detail: 'Consulting Field updated successfully.',
            });
            this.getConsultingFieldsList();
            this.visible = false;
          },
          error: (error) => {
            this.messages =
              error.validationMessages || [
                {
                  severity: 'error',
                  summary: 'Error',
                  detail: 'Failed to update Consulting Field.',
                },
              ];
            this.visible = false;
          },
        });

      this.unsubscribe.push(updateSub);
    } else {
      // Create
      const newConsultingField: any = {
        code: this.newCode,
        isic_code_id: this.newIsicCodeId,
        status: this.newStatus,
        name: {
          en: this.newNameEn,
          ar: this.newNameAr,
        },
      };

      const createSub = this.consultingFieldsService
        .createConsultingField(newConsultingField)
        .subscribe({
          next: (res: any) => {
            this.messages.push({
              severity: 'success',
              summary: 'Success',
              detail: 'Consulting Field created successfully.',
            });
            this.getConsultingFieldsList();
            this.visible = false;
          },
          error: (error) => {
            this.messages =
              error.validationMessages || [
                {
                  severity: 'error',
                  summary: 'Error',
                  detail: 'Failed to create Consulting Field.',
                },
              ];
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
              this.messages.push({
                severity: 'success',
                summary: 'Success',
                detail: 'Consulting Field deleted successfully.',
              });
              this.getConsultingFieldsList();
            },
            error: (error) => {
              this.messages =
                error.validationMessages || [
                  {
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to delete Consulting Field.',
                  },
                ];
            },
          });
        this.unsubscribe.push(deleteSub);
      }
    });
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
