import {
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
  OnDestroy,
  AfterViewInit
} from '@angular/core';
import { TreeNode, MessageService, Message } from 'primeng/api';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subscription, forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import { TreeTable } from 'primeng/treetable';
import { TranslationService } from 'src/app/modules/i18n';
import { TopicsService, Topic, PaginatedTopicResponse } from 'src/app/_fake/services/topic-service/topic.service';
import { IndustryService } from 'src/app/_fake/services/industries/industry.service';

@Component({
  selector: 'app-topics',
  templateUrl: './topics.component.html',
  styleUrls: ['./topics.component.scss'],
})
export class TopicsComponent implements OnInit, OnDestroy, AfterViewInit {
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

  industries: TreeNode[] = [];
  industryMap: Map<number, string> = new Map<number, string>();

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

  Math = Math; 

  // For tag input
  availableEnglishKeywords: any[] = [];
  availableArabicKeywords: any[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private topicsService: TopicsService,
    private industriesService: IndustryService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private trans: TranslationService
  ) {
    this.isLoading$ = this.topicsService.isLoading$;
  }

  ngOnInit() {
    this.initForm();
    // Load both topics and industries
    this.loadInitialData();
  }

  private initForm() {
    this.topicForm = this.fb.group({
      nameEn: ['', Validators.required],
      nameAr: ['', Validators.required],
      status: ['', Validators.required],
      industryId: [null, Validators.required],
      keywordsEn: [[]],
      keywordsAr: [[]],
    }, { validators: this.keywordsValidator });
  }

  /**
   * After the view is initialized and when data is available,
   * attempt to select the industry in edit mode
   */
  selectIndustryForEditMode() {
    if (!this.isUpdate || !this.selectedTopicId || !this.industries || this.industries.length === 0) {
      return;
    }
    
    // Get the current topic we're editing
    const topic = this.topics.find(t => t.id === this.selectedTopicId);
    if (!topic) return;
    
    console.log('Looking for industry with ID:', topic.industry_id);
    
    // Find the matching industry node
    const findNode = (nodes: TreeNode[], targetId: number): TreeNode | null => {
      for (const node of nodes) {
        console.log('Checking node:', node);
        // Check if this is the node we're looking for (using any to access the value property)
        if ((node as any).value === targetId) {
          console.log('Found matching node:', node);
          return node;
        }
        if (node.children && node.children.length) {
          const found = findNode(node.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };
    
    const industryNode = findNode(this.industries, topic.industry_id);
    
    if (industryNode) {
      // Force update the form control with the found node
      console.log('Setting industry node:', industryNode);
      this.topicForm.get('industryId')?.setValue(industryNode);
      this.topicForm.get('industryId')?.updateValueAndValidity();
      this.cdr.detectChanges();
    } else {
      console.log('No matching industry node found for ID:', topic.industry_id);
    }
  }

  loadInitialData() {
    const topicsRequest = this.topicsService.getAdminTopics(1, this.selectedStatus, this.searchTerm);
    const industriesRequest = this.industriesService.getIsicCodesTree('en');

    const combinedRequest = forkJoin([topicsRequest, industriesRequest]).subscribe({
      next: ([topicsResponse, industriesResponse]) => {
        // Handle topics data
        this.paginatedTopics = topicsResponse;
        this.topics = topicsResponse.data;
        this.totalPages = Math.ceil(topicsResponse.meta.total / this.pageSize);

        // Handle industries data
        this.industries = this.prepareIndustriesForTreeSelect(industriesResponse);
        this.buildIndustryMap(industriesResponse);

        this.cdr.detectChanges();
        
        // If we're in edit mode, select the industry after data is loaded
        this.selectIndustryForEditMode();
      },
      error: (error) => {
        this.handleServerErrors(error);
      }
    });

    this.unsubscribe.push(combinedRequest);
  }

  buildIndustryMap(nodes: TreeNode[]) {
    for (const node of nodes) {
      if (node.data && node.data.key !== undefined) {
        this.industryMap.set(node.data.key, node.data.nameEn);
      }
      if (node.children && node.children.length > 0) {
        this.buildIndustryMap(node.children);
      }
    }
  }

  getIndustryName(id: number): string {
    return this.industryMap.get(id) || `ID: ${id}`;
  }

  prepareIndustriesForTreeSelect(nodes: TreeNode[]): TreeNode[] {
    return nodes.map(node => {
      // Convert to format compatible with PrimeNG TreeSelect
      const treeNode: any = {
        label: node.data.nameEn, // Label used for display
        value: node.data.key,    // Value used for selection
        key: node.data.key.toString(),  // Unique key as string
        data: node.data,         // Original data
        selectable: true
      };
      
      // Handle children recursively
      if (node.children && node.children.length > 0) {
        treeNode.children = this.prepareIndustriesForTreeSelect(node.children);
      } else {
        treeNode.children = [];
      }
      
      return treeNode;
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

    let keywordsEn: string[] = [];
    let keywordsAr: string[] = [];
    
    // Handle different keyword formats from the API
    if (topic.keywords) {
      // Check if keywords is an object with en/ar arrays (newer format)
      if (typeof topic.keywords === 'object' && !Array.isArray(topic.keywords) && 'en' in topic.keywords) {
        keywordsEn = (topic.keywords as {en: string[], ar: string[]}).en;
        keywordsAr = (topic.keywords as {en: string[], ar: string[]}).ar;
      } 
      // Check if keywords is an array of objects with en/ar properties (older format)
      else if (Array.isArray(topic.keywords) && topic.keywords.length > 0) {
        keywordsEn = topic.keywords.map(k => k.en);
        keywordsAr = topic.keywords.map(k => k.ar);
      }
    }
    // Check for flat keyword array (legacy format)
    else if (topic.keyword && Array.isArray(topic.keyword)) {
      keywordsEn = topic.keyword;
      // If no Arabic keywords, we'll just leave it blank
    }
    
    // Set available keywords for dropdowns from current keywords
    this.availableEnglishKeywords = keywordsEn.map(k => ({ display: k, value: k }));
    this.availableArabicKeywords = keywordsAr.map(k => ({ display: k, value: k }));
    
    // First, set all other fields
    this.topicForm.patchValue({
      nameEn: topic.names.en,
      nameAr: topic.names.ar,
      status: topic.status,
      keywordsEn: keywordsEn.map(k => ({ display: k, value: k })),
      keywordsAr: keywordsAr.map(k => ({ display: k, value: k }))
    });
    
    // For debugging
    console.log('Topic industry ID to select:', topic.industry_id);
    console.log('Available industries:', this.industries);
    console.log('Keywords format:', topic.keywords, topic.keyword);
    
    // If industries are already loaded, find and select the industry
    if (this.industries && this.industries.length > 0) {
      this.selectIndustryForEditMode();
    }
  }

  submit() {
    if (this.topicForm.invalid) {
      Object.keys(this.topicForm.controls).forEach(key => {
        const control = this.topicForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    const formValues = this.topicForm.value;
    const topicData: any = {
      name: {
        en: formValues.nameEn,
        ar: formValues.nameAr,
      },
      industry_id: this.getIndustryIdFromSelection(formValues.industryId),
      status: formValues.status,
      keywords: []
    };

    // Extract keywords from tag-input format
    const keywordsEn = formValues.keywordsEn || [];
    const keywordsAr = formValues.keywordsAr || [];
    
    // Create keyword pairs - use empty string for missing translations
    const maxLength = Math.max(keywordsEn.length, keywordsAr.length);
    for (let i = 0; i < maxLength; i++) {
      topicData.keywords.push({
        en: i < keywordsEn.length ? (typeof keywordsEn[i] === 'string' ? keywordsEn[i] : keywordsEn[i].value || keywordsEn[i].display) : '',
        ar: i < keywordsAr.length ? (typeof keywordsAr[i] === 'string' ? keywordsAr[i] : keywordsAr[i].value || keywordsAr[i].display) : ''
      });
    }

    if (this.isUpdate && this.selectedTopicId !== null) {
      this.topicsService.updateTopic(this.selectedTopicId, topicData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Topic updated successfully'
          });
          this.loadTopics();
          this.displayDialog = false;
        },
        error: (error) => {
          this.handleServerErrors(error);
        }
      });
    } else {
      this.topicsService.createTopic(topicData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Topic created successfully'
          });
          this.loadTopics();
          this.displayDialog = false;
        },
        error: (error) => {
          this.handleServerErrors(error);
        }
      });
    }
  }

  /**
   * Gets a numeric industry ID from the selection object
   */
  getIndustryIdFromSelection(selection: any): number {
    if (!selection) return 0;
    
    // If it's a direct number
    if (typeof selection === 'number') {
      return selection;
    }
    
    // If it's a TreeNode with key
    if (selection.key !== undefined) {
      return parseInt(selection.key);
    }
    
    // If we have data with key property
    if (selection.data && selection.data.key !== undefined) {
      return selection.data.key;
    }
    
    return 0; // Default fallback
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
      this.currentPage = 1; 
      this.loadTopics();
    }, 300); 
  }

  applyStatusFilter() {
    this.currentPage = 1; 
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
        'keywords': 'keywordsEn', 
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
          }
          
          this.messages.push({
            severity: 'error',
            summary: 'Validation Error',
            detail: messages.join(', '),
          });
        }
      }
    } else if (error.error && error.error.message) {
      this.messages.push({
        severity: 'error',
        summary: 'Error',
        detail: error.error.message,
      });
    } else {
      this.messages.push({
        severity: 'error',
        summary: 'Error',
        detail: 'An unexpected error occurred.',
      });
    }
  }

  ngAfterViewInit() {
    // Give time for the component to initialize
    setTimeout(() => {
      if (this.isUpdate && this.selectedTopicId !== null) {
        const industryId = this.topicForm.get('industryId')?.value;
        if (industryId) {
          console.log('Setting industry in AfterViewInit:', industryId);
        }
      }
    }, 0);
  }

  getIndustryNodeById(id: number): any {
    return id;
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
  get keywordsEn() {
    return this.topicForm.get('keywordsEn');
  }
  get keywordsAr() {
    return this.topicForm.get('keywordsAr');
  }

  get hasSuccessMessage() {
    return this.messages.some((msg: any) => msg.severity === 'success');
  }
  get hasErrorMessage() {
    return this.messages.some((msg: any) => msg.severity === 'error');
  }

  keywordsValidator(group: FormGroup) {
    const keywordsEn = group.get('keywordsEn')?.value || [];
    const keywordsAr = group.get('keywordsAr')?.value || [];
    
    if (!keywordsEn.length && !keywordsAr.length) {
      return null;
    }
    
    // Require that both arrays have keywords or both are empty
    if ((keywordsEn.length && !keywordsAr.length) || (!keywordsEn.length && keywordsAr.length)) {
      return { keywordsMismatch: true };
    }
    
    // Check if the number of keywords in both languages match
    if (keywordsEn.length !== keywordsAr.length) {
      return { keywordsMismatch: true };
    }
    
    return null;
  }
}
