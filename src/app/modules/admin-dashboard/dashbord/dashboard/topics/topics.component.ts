import {
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { TreeNode, MessageService, Message } from 'primeng/api';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { TreeTable } from 'primeng/treetable';
import { TranslationService } from 'src/app/modules/i18n';
import { TopicsService, Topic, PaginatedTopicResponse } from 'src/app/_fake/services/topic-service/topic.service';

@Component({
  selector: 'app-topics',
  templateUrl: './topics.component.html',
  styleUrls: ['./topics.component.scss'],
})
export class TopicsComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  private unsubscribe: Subscription[] = [];

  topics: Topic[] = [];
  paginatedTopics!: PaginatedTopicResponse;
  currentPage: number = 1;
  totalPages: number = 1;
  pageSize: number = 10;

  statusOptions = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  topicForm!: FormGroup;
  displayDialog = false;
  isUpdate = false;
  selectedTopicId: number | null = null;
  isLoading$: Observable<boolean>;
  @ViewChild('tt') treeTable!: TreeTable;
  lang = 'en';
  selectedStatus = '';
  searchTerm = '';
  debounceTimer: any;

  Math = Math; // Make Math available in template

  constructor(
    private cdr: ChangeDetectorRef,
    private topicsService: TopicsService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private trans: TranslationService
  ) {
    this.isLoading$ = this.topicsService.isLoading$;
  }

  ngOnInit() {
    this.initForm();
    this.loadTopics();
  }

  private initForm() {
    this.topicForm = this.fb.group({
      nameEn: ['', Validators.required],
      nameAr: ['', Validators.required],
      status: ['', Validators.required],
      industryId: [null, Validators.required],
      keywordsEn: [''],
      keywordsAr: ['']
    });
  }

  loadTopics(page: number = 1) {
    this.currentPage = page;
    const listSub = this.topicsService.getAdminTopics(
      page, 
      this.selectedStatus, 
      this.searchTerm
    ).subscribe({
      next: (res) => {
        this.paginatedTopics = res;
        this.topics = res.data;
        this.totalPages = Math.ceil(res.meta.total / this.pageSize);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.handleServerErrors(error);
      },
    });
    this.unsubscribe.push(listSub);
  }

  loadPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.loadTopics(page);
    }
  }

  getPages(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  showDialog() {
    this.displayDialog = true;
    this.isUpdate = false;
    this.initForm();
  }

  editTopic(topic: Topic) {
    this.displayDialog = true;
    this.isUpdate = true;
    this.selectedTopicId = topic.id;

    // Extract keywords if they exist
    const keywordsEn = topic.keywords?.map(k => k.en).join(', ') || '';
    const keywordsAr = topic.keywords?.map(k => k.ar).join(', ') || '';

    this.topicForm.patchValue({
      nameEn: topic.names.en,
      nameAr: topic.names.ar,
      status: topic.status,
      industryId: topic.industry_id,
      keywordsEn: keywordsEn,
      keywordsAr: keywordsAr
    });
  }

  submit() {
    console.log('Submitting form...');
    if (this.topicForm.invalid) {
      console.log('Form is invalid. Marking touched fields...');
      Object.keys(this.topicForm.controls).forEach(key => {
        const control = this.topicForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    const formValues = this.topicForm.value;
    console.log('Form values:', formValues);
    const topicData: any = {
      name: {
        en: formValues.nameEn,
        ar: formValues.nameAr,
      },
      industry_id: formValues.industryId,
      status: formValues.status,
      keywords: []
    };

    if (formValues.keywordsEn && formValues.keywordsAr) {
      console.log('Processing keywords...');
      const keywordsEn = formValues.keywordsEn.split(',').map((k: string) => k.trim()).filter((k: string) => k);
      const keywordsAr = formValues.keywordsAr.split(',').map((k: string) => k.trim()).filter((k: string) => k);
      
      if (keywordsEn.length === keywordsAr.length) {
        topicData.keywords = keywordsEn.map((en: string, index: number) => ({
          en,
          ar: keywordsAr[index]
        }));
        console.log('Keywords processed:', topicData.keywords);
      } else {
        console.error('Keyword mismatch');
        this.messages = [{
          severity: 'error',
          summary: 'Error',
          detail: 'Number of English and Arabic keywords must match'
        }];
        return;
      }
    }

    if (this.isUpdate && this.selectedTopicId !== null) {
      console.log('Updating topic...');
      this.topicsService.updateTopic(this.selectedTopicId, topicData).subscribe({
        next: () => {
          console.log('Topic updated successfully');
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Topic updated successfully'
          });
          this.loadTopics();
          this.displayDialog = false;
        },
        error: (error) => {
          console.error('Error updating topic:', error);
          this.handleServerErrors(error);
        }
      });
    } else {
      console.log('Creating new topic...');
      this.topicsService.createTopic(topicData).subscribe({
        next: () => {
          console.log('Topic created successfully');
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Topic created successfully'
          });
          this.loadTopics();
          this.displayDialog = false;
        },
        error: (error) => {
          console.error('Error creating topic:', error);
          this.handleServerErrors(error);
        }
      });
    }
  }

  deleteTopic(topic: Topic) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this Topic? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        const deleteSub = this.topicsService.deleteTopic(topic.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Topic deleted successfully.',
            });
            this.loadTopics();
          },
          error: (error) => {
            this.handleServerErrors(error);
          },
        });
        this.unsubscribe.push(deleteSub);
      }
    });
  }

  applyFilter(event: any) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.searchTerm = event.target.value.trim();
    this.debounceTimer = setTimeout(() => {
      this.currentPage = 1; // Reset to first page when filtering
      this.loadTopics();
    }, 300); // Debounce for 300ms
  }

  applyStatusFilter() {
    this.currentPage = 1; // Reset to first page when filtering
    this.loadTopics();
  }

  onCancel() {
    this.displayDialog = false;
    this.topicForm.reset();
    this.messages = [];
  }

  private handleServerErrors(error: any) {
    this.messages = [];
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      const errorKeyToFormControlName: any = {
        'name.en': 'nameEn',
        'name.ar': 'nameAr',
        'industry_id': 'industryId',
        status: 'status',
      };

      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          const formControlName = errorKeyToFormControlName[key];
          if (formControlName) {
            const control = this.topicForm.get(formControlName);
            if (control) {
              control.setErrors({ serverError: messages[0] });
              control.markAsTouched();
            }
          } else {
            this.messages.push({
              severity: 'error',
              summary: '',
              detail: messages.join(', '),
            });
          }
        }
      }
    } else {
      this.messages.push({
        severity: 'error',
        summary: 'Error',
        detail: 'An unexpected error occurred.',
      });
    }
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }

  get nameEn() {
    return this.topicForm.get('nameEn');
  }
  get nameAr() {
    return this.topicForm.get('nameAr');
  }
  get status() {
    return this.topicForm.get('status');
  }
  get industryId() {
    return this.topicForm.get('industryId');
  }

  get hasSuccessMessage() {
    return this.messages.some((msg: any) => msg.severity === 'success');
  }
  get hasErrorMessage() {
    return this.messages.some((msg: any) => msg.severity === 'error');
  }
}
