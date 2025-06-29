import { ChangeDetectorRef, Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { Message } from "primeng/api";
import { Table } from "primeng/table";
import { Observable, Subscription, of } from "rxjs";
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Tag, TagsService, PaginatedTagResponse, Industry } from "src/app/_fake/services/tags/tags.service";

interface TagWithIndustries extends Tag {
  industryNames: string[];
}

interface IndustryDisplay {
  en: string;
  ar: string;
}

@Component({
  selector: "app-tags",
  templateUrl: "./tags.component.html",
  styleUrls: ["./tags.component.scss"],
})
export class TagsComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  private unsubscribe: Subscription[] = [];
  
  // Data properties
  tagsWithIndustries: TagWithIndustries[] = [];
  industriesList: Industry[] = [];
  paginationData: any;
  
  // Loading states
  isLoading$: Observable<boolean>;
  
  // Form and dialog properties
  isEditMode: boolean = false;
  selectedTagId: number | null = null;
  visible: boolean = false;
  tagForm: FormGroup;
  
  // Filter properties
  currentPage: number = 1;
  searchKeyword: string = '';
  statusFilter: string = '';
  
  // Options
  statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Suggestion', value: 'suggestion' }
  ];
  
  selectedIndustries: Industry[] = [];
  
  @ViewChild("dt") table: Table;
  
  // Make Math available in template
  Math = Math;

  constructor(
    private _tags: TagsService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private messageService: MessageService
  ) {
    this.isLoading$ = this._tags.isLoading$;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadIndustries();
  }

  initializeForm() {
    this.tagForm = this.fb.group({
      englishName: ['', Validators.required],
      arabicName: ['', Validators.required],
      status: ['active', Validators.required],
      industries: [[]]
    });
  }

  loadIndustries() {
    const industriesSub = this._tags.getIndustriesList().subscribe({
      next: (response) => {
        this.industriesList = response.data;
        // Load tags after industries are loaded
        this.loadTags();
      },
      error: (error) => {
        this.handleError(error, 'Failed to load industries');
      }
    });
    this.unsubscribe.push(industriesSub);
  }

  loadTags() {
    // If industries are not loaded yet, don't proceed
    if (!this.industriesList || this.industriesList.length === 0) {
      console.warn('Industries not loaded yet, skipping tags load');
      return;
    }

    const tagsSub = this._tags.getAdminTags(this.currentPage, this.searchKeyword, this.statusFilter).subscribe({
      next: (response: PaginatedTagResponse) => {
        this.tagsWithIndustries = response.data.map(tag => ({
          ...tag,
          industryNames: this.getIndustryNamesByIds(tag.industries)
        }));
        this.paginationData = {
          currentPage: response.meta.current_page,
          totalPages: response.meta.last_page,
          totalRecords: response.meta.total,
          perPage: response.meta.per_page
        };
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.handleError(error, 'Failed to load tags');
      }
    });
    this.unsubscribe.push(tagsSub);
  }

  getIndustryNamesByIds(industryIds: number[]): string[] {
    return industryIds.map(id => {
      const industry = this.industriesList.find(ind => ind.id === id);
      return industry ? industry.name : `Unknown (ID: ${id})`;
    });
  }

  // Filter and pagination methods
  onSearch() {
    this.currentPage = 1;
    this.ensureIndustriesLoadedThenLoadTags();
  }

  onStatusFilterChange() {
    this.currentPage = 1;
    this.ensureIndustriesLoadedThenLoadTags();
  }

  private ensureIndustriesLoadedThenLoadTags() {
    if (!this.industriesList || this.industriesList.length === 0) {
      // Load industries first, then tags
      this.loadIndustries();
    } else {
      // Industries already loaded, just load tags
      this.loadTags();
    }
  }

  onPageChange(event: any) {
    this.currentPage = event.page + 1;
    this.ensureIndustriesLoadedThenLoadTags();
  }

  // Dialog methods
  showDialog() {
    this.visible = true;
    this.selectedTagId = null;
    this.isEditMode = false;
    this.selectedIndustries = [];
    this.tagForm.reset({ status: 'active', industries: [] });
    this.clearMessages();
  }

  editTag(tag: TagWithIndustries) {
    this.visible = true;
    this.selectedTagId = tag.id;
    this.isEditMode = true;
    this.selectedIndustries = this.industriesList.filter(industry => 
      tag.industries.includes(industry.id)
    );
    
    this.tagForm.patchValue({
      englishName: tag.names.en,
      arabicName: tag.names.ar,
      status: tag.status,
      industries: this.selectedIndustries
    });
    this.clearMessages();
  }

  onCancel() {
    this.visible = false;
    this.selectedIndustries = [];
    this.tagForm.reset({ status: 'active', industries: [] });
    this.clearMessages();
  }

  // CRUD operations
  submit() {
    this.clearMessages();

    if (this.tagForm.invalid) {
      this.tagForm.markAllAsTouched();
      return;
    }

    const formValues = this.tagForm.value;
    const tagData = {
      name: {
        en: formValues.englishName.trim(),
        ar: formValues.arabicName.trim()
      },
      status: formValues.status,
      industries: this.selectedIndustries.map(industry => industry.id)
    };

    if (this.selectedTagId) {
      this.updateTag(tagData);
    } else {
      this.createTag(tagData);
    }
  }

  createTag(tagData: any) {
    const createSub = this._tags.createTag(tagData).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Tag created successfully.'
        });
        this.ensureIndustriesLoadedThenLoadTags();
        this.onCancel();
      },
      error: (error) => {
        this.handleServerErrors(error);
      }
    });
    this.unsubscribe.push(createSub);
  }

  updateTag(tagData: any) {
    const updateSub = this._tags.updateTag(this.selectedTagId!, tagData).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Tag updated successfully.'
        });
        this.ensureIndustriesLoadedThenLoadTags();
        this.onCancel();
      },
      error: (error) => {
        this.handleServerErrors(error);
      }
    });
    this.unsubscribe.push(updateSub);
  }

  deleteTag(tagId: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this tag? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const deleteSub = this._tags.deleteTag(tagId).subscribe({
          next: (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Tag deleted successfully.'
            });
            this.ensureIndustriesLoadedThenLoadTags();
          },
          error: (error) => {
            this.handleError(error, 'Failed to delete tag');
          }
        });
        this.unsubscribe.push(deleteSub);
      }
    });
  }

  // Error handling
  private handleError(error: any, defaultMessage: string) {
    this.messages = [{
      severity: 'error',
      summary: 'Error',
      detail: error?.error?.message || defaultMessage
    }];
  }

  private handleServerErrors(error: any) {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      const errorKeyToFormControlName: any = {
        'name.en': 'englishName',
        'name.ar': 'arabicName',
        'status': 'status',
        'industries': 'industries'
      };

      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          const formControlName = errorKeyToFormControlName[key];
          
          if (formControlName) {
            const control = this.tagForm.get(formControlName);
            if (control) {
              control.setErrors({ serverError: messages[0] });
              control.markAsTouched();
            }
          } else {
            this.messages.push({ 
              severity: 'error', 
              summary: 'Error', 
              detail: messages.join(', ') 
            });
          }
        }
      }
    } else {
      this.handleError(error, 'An unexpected error occurred');
    }
  }

  private clearMessages() {
    this.messages = [];
  }

  // Getters for form validation
  get englishName() {
    return this.tagForm.get('englishName');
  }

  get arabicName() {
    return this.tagForm.get('arabicName');
  }

  get status() {
    return this.tagForm.get('status');
  }

  get industries() {
    return this.tagForm.get('industries');
  }

  get hasErrorMessage() {
    return this.messages.some(msg => msg.severity === 'error');
  }

  ngOnDestroy() {
    this.unsubscribe.forEach(sb => sb.unsubscribe());
  }
}
