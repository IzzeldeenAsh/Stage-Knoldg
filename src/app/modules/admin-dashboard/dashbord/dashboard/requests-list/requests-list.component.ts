import { ChangeDetectorRef, Component, Injector, OnInit, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { Message } from 'primeng/api';
import { forkJoin, Observable } from 'rxjs';
import { IVerificationQuestion, RequestsService } from 'src/app/_fake/services/requests-list-admin/requests.service';
import { RequestItem } from 'src/app/modules/admin-dashboard/dashbord/dashboard/requests-list/request.interface';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-requests-list',
  templateUrl: './requests-list.component.html',
  styleUrls: ['./requests-list.component.scss']
})
export class RequestsListComponent extends BaseComponent implements OnInit {
  messages: Message[] = [];
  requestsList: RequestItem[] = [];
  isLoading$: Observable<boolean>;
  visible: boolean = false;
  visibleVerification: boolean = false;
  selectedRequest: RequestItem | null = null;
  verificationQuestions: IVerificationQuestion[] = [];
  loading: boolean = false;
  confirmationChecked: boolean = false;
  verificationForm: FormGroup;
  staffNotes: string = '';
  visibleDeactivate: boolean = false;

  activateRequestsCount: number = 0;
  deactivateRequestsCount: number = 0;
  verifiedRequestsCount: number = 0;

  // New properties for filters
  selectedType: string = '';
  selectedStatus: string = '';
  globalFilter: string = '';
  requestTypes: { key: string; label: string }[] = [];
  statuses: string[] = ['pending', 'approved', 'declined'];

  @ViewChild('dt') table: Table;

  constructor(
    injector: Injector,
    private requestsService: RequestsService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    super(injector);
    this.isLoading$ = this.requestsService.isLoading$;

    // Initialize an empty form group to avoid undefined errors
    this.verificationForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    const reqSub = forkJoin({
      requests: this.requestsService.getRequests(),
      questions: this.requestsService.getListOfVerificationQuestions()
    }).subscribe({
      next: (result) => {
        this.requestsList = result.requests.data.sort((a,b)=>{
          if(a.status === 'pending'){
            return -1;
          }else if(b.status === 'pending'){
            return 1;
          }
          return 0;
        });
        this.verificationQuestions = result.questions.data;

        // Compute counts based on request types
        this.activateRequestsCount = this.requestsList.filter(request => request.type.key === 'activate_company').length;
        this.deactivateRequestsCount = this.requestsList.filter(request => request.type.key === 'deactivate_company').length;
        this.verifiedRequestsCount = this.requestsList.filter(request => request.type.key === 'verified_company').length;

        // Generate unique request types from the requestsList
        const typesSet = new Set(
          this.requestsList.map(request => JSON.stringify({key: request.type.key, label: request.type.label}))
        );
        this.requestTypes = Array.from(typesSet).map(item => JSON.parse(item));

        this.initializeVerificationForm();
        this.cdr.detectChanges();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.showError('Error', 'An unexpected error occurred.');
        this.loading = false;
      }
    });
    this.unsubscribe.push(reqSub);
  }

  initializeVerificationForm() {
    const group: any = {};
    this.verificationQuestions.forEach(question => {
      if (question.type === 'boolean') {
        group['question_' + question.id] = [null, Validators.required];
      } else if (question.type === 'text') {
        group['question_' + question.id] = ['', Validators.required];
      } else {
        group['question_' + question.id] = ['', Validators.required];
      }
    });
    this.verificationForm = this.fb.group(group);
  }

  applyFilter(event: any) {
    const value = event.target.value.trim().toLowerCase();
    this.table.filterGlobal(value, 'contains');
  }

  onTypeChange() {
    this.applyCustomFilters();
  }

  onStatusChange() {
    this.applyCustomFilters();
  }

  applyCustomFilters() {
    // Clear existing filters first
    this.table.clear();

    // Apply global filter if any
    if (this.globalFilter) {
      this.table.filterGlobal(this.globalFilter.toLowerCase(), 'contains');
    }

    // Filter by selectedType if chosen (Note: adjust the field if different structure)
    if (this.selectedType) {
      // If the requestsList array items are structured as `request.type.key`:
      // We can filter by the nested property `type.key` using table.filter(value, field, matchMode)
      this.table.filter(this.selectedType, 'type.key', 'equals');
    }

    // Filter by selectedStatus if chosen
    if (this.selectedStatus) {
      this.table.filter(this.selectedStatus, 'status', 'equals');
    }
  }

  resetFilters() {
    this.selectedType = '';
    this.selectedStatus = '';
    this.globalFilter = '';
    if (this.table) {
      this.table.clear();
    }
  }

  onCancel() {
    this.visible = false;
    this.selectedRequest = null;
    this.staffNotes = '';
  }

  get hasErrorMessage() {
    return this.messages.some(msg => msg.severity === 'error');
  }

  viewRequest(request: RequestItem) {
    if (request.type.key === 'activate_company') {
      this.selectedRequest = request;
      this.visible = true;
    } else if (request.type.key === 'deactivate_company') {
      this.selectedRequest = request;
      this.visibleDeactivate = true;
    } else if (request.type.key === 'verified_company') {
      this.selectedRequest = request;
      this.visibleVerification = true;
    }
  }

  showDialogDeactivate() {
    this.visibleVerification = true;
  }

  onCancelDeactivate() {
    this.visibleVerification = false;
    this.selectedRequest = null;
    this.staffNotes = '';
  }

  onActivate(status: 'approved' | 'declined') {
    if (this.selectedRequest?.id) {
      const reqSub = this.requestsService.activateCompanyRequest(
        this.selectedRequest?.id,
        this.staffNotes,
        status
      ).subscribe({
        next: (result) => {
          const msg = status === 'approved' ? 'Company approved successfully.' : 'Company declined successfully.';
          this.showSuccess('Success', msg);
          this.loadData();
          this.visible = false;
          this.selectedRequest = null;
          this.staffNotes = '';
        },
        error: (error) => {
          console.error('Error fetching data:', error);
          this.handleServerErrors(error);
          this.showError('Error', 'An unexpected error occurred.');
        }
      });

      this.unsubscribe.push(reqSub);
    }
  }

  onDeactivate(status: 'approved' | 'declined') {
    if (this.selectedRequest?.id) {
      const reqSub = this.requestsService.deactivateCompanyRequest(
        this.selectedRequest?.id,
        this.staffNotes,
        status
      ).subscribe({
        next: (result) => {
          const msg = status === 'approved' ? 'Company approved successfully.' : 'Company declined successfully.';
          this.showSuccess('Success', msg);
          this.loadData();
          this.visibleDeactivate = false;
          this.selectedRequest = null;
          this.staffNotes = '';
        },
        error: (error) => {
          console.error('Error fetching data:', error);
          this.handleServerErrors(error);
          this.showError('Error', 'An unexpected error occurred.');
        }
      });
      this.unsubscribe.push(reqSub);
    }
  }

  onVerify(status: 'approved' | 'declined') {
    if (this.visibleVerification) {
      // Handle activation with verification
      if (this.verificationForm && this.verificationForm.valid && this.confirmationChecked) {
        const formValues = this.verificationForm.value;
        const verificationAnswers = Object.keys(formValues).map(key => {
          const questionId = parseInt(key.replace('question_', ''));
          return {
            verification_question_id: questionId,
            answer: formValues[key]
          };
        });

        if (this.selectedRequest?.id) {
          const reqSub = this.requestsService.verifyCompanyRequest(
            this.selectedRequest.id,
            verificationAnswers,
            this.staffNotes,
            status
          ).subscribe({
            next: (result) => {
              const msg = status === 'approved' ? 'Company approved successfully.' : 'Company declined successfully.';
              this.showSuccess('Success', msg);
              this.loadData();
              this.visible = false;
              this.visibleVerification = false;
              this.selectedRequest = null;
              this.staffNotes = '';
              this.verificationForm.reset();
              this.confirmationChecked = false;
            },
            error: (error) => {
              console.error('Error verifying company:', error);
              this.handleServerErrors(error);
            }
          });
          this.unsubscribe.push(reqSub);
        }
      } else {
        this.showError('Error', 'Please answer all verification questions and confirm.');
      }
    } else {
      // Handle regular activation
      this.visible = false;
      this.selectedRequest = null;
      this.staffNotes = '';
      this.loadData();
    }
  }

  isFormValid() {
    return this.verificationForm && this.verificationForm.valid && this.confirmationChecked;
  }

  private handleServerErrors(error: any) {
    this.messages = [];
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          this.messages.push({
            severity: "error",
            summary: "",
            detail: messages.join(", "),
          });
        }
      }
    } else {
      this.messages.push({
        severity: "error",
        summary: "Error",
        detail: "An unexpected error occurred.",
      });
    }
  }
}
