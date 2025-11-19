// guideline.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { MessageService } from 'primeng/api';
import Swal from 'sweetalert2';
import { Guideline, GuidelinesService } from 'src/app/_fake/services/guidelines/guidelines.service';

@Component({
  selector: 'app-guideline',
  templateUrl: './guidelines.component.html',
  styleUrls: ['./guidelines.component.scss'],
})
export class GuidelineComponent implements OnInit {
  guidelines: Guideline[] = [];
  isLoading$: Observable<boolean>;
  guidelineForms: Map<number, FormGroup> = new Map();
  newGuidelineForm: FormGroup;
  joditConfig: any = {
    height: 300
  };

  constructor(
    private guidelinesService: GuidelinesService,
    private fb: FormBuilder,
    private messageService: MessageService
  ) {
    this.isLoading$ = this.guidelinesService.isLoading$;
  }

  ngOnInit(): void {
    this.newGuidelineForm = this.fb.group({
      nameEn: ['', Validators.required],
      nameAr: ['', Validators.required],
      guidelineEn: ['', Validators.required],
      guidelineAr: ['', Validators.required],
      fileEn: [null],
      fileAr: [null],
      version: ['', Validators.required],
    });

    this.loadGuidelines();
  }

  loadGuidelines() {
    this.guidelinesService.getGuidelines().subscribe({
      next: (data) => {
        this.guidelines = data;
        // Initialize forms for each guideline
        this.guidelines.forEach((guideline) => {
          const form = this.fb.group({
            nameEn: [guideline.names.en, Validators.required],
            nameAr: [guideline.names.ar, Validators.required],
            guidelineEn: [guideline.guidelines.en, Validators.required],
            guidelineAr: [guideline.guidelines.ar, Validators.required],
            fileEn: [null],
            fileAr: [null],
            version: [guideline.version, Validators.required],
          });
          this.guidelineForms.set(guideline.id, form);
        });
      },
      error: (err) => console.error(err),
    });
  }

  getGuidelineForm(guidelineId: number): FormGroup {
    return this.guidelineForms.get(guidelineId) || this.fb.group({});
  }

  saveGuideline(guidelineId: number) {
    const form = this.getGuidelineForm(guidelineId);

    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    const values = form.value;

    formData.append('name[en]', values.nameEn);
    formData.append('name[ar]', values.nameAr);
    formData.append('guideline[en]', values.guidelineEn);
    formData.append('guideline[ar]', values.guidelineAr);
    formData.append('version', values.version);

    if (values.fileEn) formData.append('file[en]', values.fileEn);
    if (values.fileAr) formData.append('file[ar]', values.fileAr);
    formData.append('_method', 'put');
    this.guidelinesService
      .createOrUpdateGuideline(formData, guidelineId)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Guideline updated successfully.',
          });
          this.loadGuidelines();
        },
        error: (err) => {
          console.error(err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update guideline.',
          });
        },
      });
  }

  createGuideline() {
    const form = this.newGuidelineForm;

    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    const values = form.value;

    formData.append('name[en]', values.nameEn);
    formData.append('name[ar]', values.nameAr);
    formData.append('guideline[en]', values.guidelineEn);
    formData.append('guideline[ar]', values.guidelineAr);
    formData.append('version', values.version);

    if (values.fileEn) formData.append('file[en]', values.fileEn);
    if (values.fileAr) formData.append('file[ar]', values.fileAr);

    this.guidelinesService.createOrUpdateGuideline(formData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Guideline created successfully.',
        });
        this.loadGuidelines();
        this.newGuidelineForm.reset();
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to create guideline.',
        });
      },
    });
  }

  deleteGuideline(id: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.guidelinesService.deleteGuideline(id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Guideline deleted successfully.',
            });
            this.loadGuidelines();
          },
          error: (err) => {
            console.error(err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete guideline.',
            });
          },
        });
      }
    });
  }

  onFileChange(event: any, controlName: string, guidelineId?: number) {
    const file = event.target.files[0];
    if (guidelineId) {
      const form = this.getGuidelineForm(guidelineId);
      form.patchValue({ [controlName]: file });
    } else {
      this.newGuidelineForm.patchValue({ [controlName]: file });
    }
  }
}
