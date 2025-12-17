import { Component, OnInit, Injector } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, forkJoin } from 'rxjs';
import { GuidelineType, GuidelinesService, GuidelineDetail } from 'src/app/_fake/services/guidelines/guidelines.service';
import { BaseComponent } from 'src/app/modules/base.component';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-guideline-detail',
  templateUrl: './guideline-detail.component.html',
  styleUrls: ['./guideline-detail.component.scss']
})
export class GuidelineDetailComponent extends BaseComponent implements OnInit {
  currentValue: string | null = null;
  guidelineType: GuidelineType | null = null;
  isLoading$: Observable<boolean>;

  // Guideline data
  currentGuideline: GuidelineDetail | null = null;
  lastGuideline: GuidelineDetail | null = null;
  shouldShowLastGuideline = false;

  // Modal and form properties
  showAddVersionModal = false;
  addVersionForm: FormGroup;
  isCreating = false;

  // Jodit editor configurations
  joditConfigEn = {
    readonly: false,
    height: 300,
    language: 'en',
    toolbarSticky: false,
    showCharsCounter: false,
    showWordsCounter: false,
    showXPathInStatusbar: false,
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: 'insert_clear_html',
    buttons: [
      'bold', 'italic', 'underline', '|',
      'ul', 'ol', '|',
      'align', '|',
      'undo', 'redo', '|',
      'table', 'link', '|',
      'source'
    ]
  };

  joditConfigAr = {
    readonly: false,
    height: 300,
    language: 'ar',
    direction: 'rtl',
    toolbarSticky: false,
    showCharsCounter: false,
    showWordsCounter: false,
    showXPathInStatusbar: false,
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: 'insert_clear_html',
    buttons: [
      'bold', 'italic', 'underline', '|',
      'ul', 'ol', '|',
      'align', '|',
      'undo', 'redo', '|',
      'table', 'link', '|',
      'source'
    ]
  };

  constructor(
    private guidelinesService: GuidelinesService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private http: HttpClient,
    injector: Injector
  ) {
    super(injector);
    this.isLoading$ = this.guidelinesService.isLoading$;
    this.initializeForm();
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.currentValue = params.get('value');
      if (this.currentValue) {
        this.loadGuidelineDetail();
      }
    });
  }

  loadGuidelineDetail() {
    if (!this.currentValue) return;

    // Load guideline types, current guideline, and last guideline in parallel
    forkJoin({
      types: this.guidelinesService.getGuidelineTypes(),
      current: this.guidelinesService.getCurrentGuidelineByType(this.currentValue),
      last: this.guidelinesService.getLastGuidelineByType(this.currentValue)
    }).subscribe({
      next: ({ types, current, last }) => {
        // Set guideline type
        this.guidelineType = types.find((type: GuidelineType) => type.value === this.currentValue) || null;

        // Set current guideline
        this.currentGuideline = current;

        // Set last guideline and determine if it should be shown
        this.lastGuideline = last;
        this.shouldShowLastGuideline = current && last && current.version !== last.version;

        console.log('Current guideline:', this.currentGuideline);
        console.log('Last guideline:', this.lastGuideline);
        console.log('Should show last guideline:', this.shouldShowLastGuideline);
      },
      error: (err) => {
        console.error(err);
        this.showError(
          this.lang === 'ar' ? 'حدث خطأ' : 'Error',
          this.lang === 'ar' ? 'فشل في تحميل تفاصيل التوجيه' : 'Failed to load guideline details'
        );
      },
    });
  }

  initializeForm() {
    this.addVersionForm = this.fb.group({
      nameEn: ['', Validators.required],
      nameAr: ['', Validators.required],
      guidelineEn: ['', Validators.required],
      guidelineAr: ['', Validators.required],
      version: ['', Validators.required],
      applyAt: ['', Validators.required]
    });
  }

  openAddVersionModal() {
    this.showAddVersionModal = true;
    this.addVersionForm.reset();
  }

  closeAddVersionModal() {
    this.showAddVersionModal = false;
    this.addVersionForm.reset();
  }

  onEditorChange(event: any, fieldName: string) {
    // Ensure we always store a string (HTML) in the form control
    let content = '';
    if (typeof event === 'string') {
      content = event;
    } else if (event && typeof event?.html === 'string') {
      content = event.html;
    } else if (event && typeof event?.value === 'string') {
      content = event.value;
    } else if (event && event?.target && typeof event.target.innerHTML === 'string') {
      content = event.target.innerHTML;
    } else {
      content = '';
    }

    const control = this.addVersionForm.get(fieldName);
    if (control) {
      control.setValue(content);
      control.markAsDirty();
      control.updateValueAndValidity({ onlySelf: true });
    }
  }

  createNewVersion() {
    if (!this.addVersionForm.valid || !this.currentValue) {
      return;
    }

    this.isCreating = true;
    const formValue = this.addVersionForm.value;

    // Format the date for apply_at
    const applyAtDate = new Date(formValue.applyAt);
    const formattedDate = applyAtDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Prepare form data according to API specification
    const formData = new FormData();
    formData.append('name[en]', formValue.nameEn);
    formData.append('name[ar]', formValue.nameAr);
    formData.append('type', this.currentValue);
    formData.append('guideline[en]', formValue.guidelineEn);
    formData.append('guideline[ar]', formValue.guidelineAr);
    formData.append('version', formValue.version);
    formData.append('apply_at', formattedDate);

    // API headers
    const headers = {
      'Accept': 'application/json',
      'Accept-Language': this.lang,
      'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    const apiUrl = 'https://api.foresighta.co/api/admin/setting/guideline';

    this.http.post(apiUrl, formData, { headers }).subscribe({
      next: (response) => {
        this.showSuccess(
          this.lang === 'ar' ? 'نجح الحفظ' : 'Success',
          this.lang === 'ar' ? 'تم إنشاء إصدار جديد بنجاح' : 'New version created successfully'
        );
        this.closeAddVersionModal();
        this.isCreating = false;
        // Reload the guideline details to show the updated data
        this.loadGuidelineDetail();
      },
      error: (error) => {
        this.isCreating = false;
        this.handleServerErrors(error);
      }
    });
  }

  private handleServerErrors(error: any) {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          this.showError(
            this.lang === "ar" ? "حدث خطأ" : "An error occurred",
            messages.join(", ")
          );
        }
      }
    } else {
      this.showError(
        this.lang === "ar" ? "حدث خطأ" : "An error occurred",
        this.lang === "ar" ? "حدث خطأ غير متوقع" : "An unexpected error occurred."
      );
    }
  }

  navigateBack() {
    this.router.navigate(['/admin-dashboard/admin/dashboard/main-dashboard/guidelines']);
  }
}
