import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MessageService, Message } from "primeng/api";
import { Table } from "primeng/table";
import { Observable, Subscription } from "rxjs";
import Swal from 'sweetalert2';
import { Region, RegionsService } from "src/app/_fake/services/region/regions.service";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: "app-regions",
  templateUrl: "./regions.component.html",
  styleUrls: ["./regions.component.scss"],
})
export class RegionsComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  private unsubscribe: Subscription[] = [];
  listOfRegions: Region[] = [];
  isEditMode: boolean = false;
  isLoading$: Observable<boolean>;
  selectedRegionId: number | null = null;
  visible: boolean = false;

  regionForm: FormGroup;

  @ViewChild("dt") table: Table;

  constructor(
    private regionsService: RegionsService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private messageService: MessageService
  ) {
    this.isLoading$ = this.regionsService.isLoading$;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.getRegionsList();
  }

  initializeForm() {
    this.regionForm = this.fb.group({
      regionEn: ['', Validators.required],
      regionAr: ['', Validators.required]
    });
  }

  showDialog() {
    this.visible = true;
    this.selectedRegionId = null;
    this.isEditMode = false;
    this.regionForm.reset();
  }

  editRegion(region: Region) {
    this.visible = true;
    this.selectedRegionId = region.id;
    this.isEditMode = true;
    this.regionForm.patchValue({
      regionEn: region.names.en,
      regionAr: region.names.ar
    });
  }

  getRegionsList() {
    const listSub = this.regionsService.getRegions().subscribe({
      next: (data: Region[]) => {
        this.listOfRegions = data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.messages = error.validationMessages || [{
          severity: "error",
          summary: "Error",
          detail: "An unexpected error occurred."
        }];
      },
    });
    this.unsubscribe.push(listSub);
  }

  applyFilter(event: any) {
    const value = event.target.value.trim().toLowerCase();
    this.table.filterGlobal(value, "contains");
  }

  get hasSuccessMessage() {
    return this.messages.some(msg => msg.severity === 'success');
  }

  get hasErrorMessage() {
    return this.messages.some(msg => msg.severity === 'error');
  }

  // Getters for form controls
  get regionEn() {
    return this.regionForm.get('regionEn');
  }

  get regionAr() {
    return this.regionForm.get('regionAr');
  }

  submit() {
    this.messages = [];

    if (this.regionForm.invalid) {
      this.regionForm.markAllAsTouched();
      return;
    }

    const formValues = this.regionForm.value;
    const regionData = {
      name: {
        en: formValues.regionEn,
        ar: formValues.regionAr
      }
    };

    if (this.selectedRegionId) {
      // Update existing region
      const updateSub = this.regionsService.updateRegion(this.selectedRegionId, regionData).subscribe({
        next: (res: Region) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Region updated successfully.'
          });
          this.getRegionsList();
          this.visible = false;
          this.regionForm.reset();
        },
        error: (error) => {
          this.handleServerErrors(error);
        }
      });

      this.unsubscribe.push(updateSub);
    } else {
      // Create new region
      const createSub = this.regionsService.createRegion(regionData).subscribe({
        next: (res: any) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Region created successfully.'
          });
          this.getRegionsList();
          this.visible = false;
          this.regionForm.reset();
        },
        error: (error) => {
          this.handleServerErrors(error);
        }
      });

      this.unsubscribe.push(createSub);
    }
  }

  deleteRegion(regionId: number) {
    this.messages = [];
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this region? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const deleteSub = this.regionsService.deleteRegion(regionId).subscribe({
          next: (res: any) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Region deleted successfully.'
            });
            this.getRegionsList();
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
      const errorKeyToFormControlName: any = {
        'name.en': 'regionEn',
        'name.ar': 'regionAr'
      };

      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          const formControlName = errorKeyToFormControlName[key];
          if (formControlName) {
            const control = this.regionForm.get(formControlName);
            if (control) {
              control.setErrors({ serverError: messages[0] });
              control.markAsTouched();
            }
          } else {
            // General messages
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

  onCancel() {
    this.visible = false;
    this.regionForm.reset();
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
