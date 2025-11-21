import { ChangeDetectorRef, Component, Injector, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, forkJoin } from 'rxjs';
import { IVerificationQuestion, RequestsService } from 'src/app/_fake/services/requests-list-admin/requests.service';
import { RequestItem } from 'src/app/modules/admin-dashboard/dashbord/dashboard/requests-list/request.interface';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-requests-list',
  templateUrl: './requests-list.component.html',
  styleUrls: ['./requests-list.component.scss']
})
export class RequestsListComponent extends BaseComponent implements OnInit {
  messages: any[] = [];
  answeredQuestions: Array<{
    id: number;
    verification_question_id: number;
    answer: string;
  }> = [];

  requestsList: any[] = [];
  filteredRequests: any[] = [];
  paginatedRequests: any;
  currentPage: number = 1;
  totalPages: number = 1;
  pageSize: number = 10;

  isLoading$: Observable<boolean>;
  visible: boolean = false;
  visibleVerification: boolean = false;
  visibleDeactivate: boolean = false;
  visibleDeactivateDelete: boolean = false;

  selectedRequest: RequestItem | null = null;
  selectedChain: RequestItem[] = [];

  verificationQuestions: IVerificationQuestion[] = [];
  loading: boolean = false;
  verificationForm: FormGroup;
  staffNotes: string = '';

  activateRequestsCount: number = 0;
  deactivateRequestsCount: number = 0;
  verifiedRequestsCount: number = 0;

  // Flags for splitting question submission vs. approval flow
  showVerificationQuestions: boolean = false; // true: show question form, false: show approve/disapprove

  constructor(
    injector: Injector,
    private requestsService: RequestsService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    super(injector);
    this.isLoading$ = this.requestsService.isLoading$;
    this.verificationForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.filteredRequests = [];
    this.loadVerificationQuestions();
    // Load initial data
    this.loadData();
  }

  loadData() {
    // Prevent multiple simultaneous calls
    if (this.loading) {
      return;
    }

    this.loading = true;
    const reqSub = this.requestsService.getRequests(this.currentPage, this.pageSize).subscribe({
      next: (result) => {
        this.paginatedRequests = result;
        this.requestsList = result.data;
        this.filteredRequests = result.data;
        this.totalPages = Math.ceil(result.meta.total / this.pageSize);
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

  loadVerificationQuestions() {
    const questionsSub = this.requestsService.getListOfVerificationQuestions().subscribe({
      next: (result) => {
        this.verificationQuestions = result.data;
        this.initializeVerificationForm();
      },
      error: (error) => {
        console.error('Error fetching verification questions:', error);
      }
    });
    this.unsubscribe.push(questionsSub);
  }

  loadPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadData();
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

  // This helper lets us look up the full question text
  getQuestionText(questionId: number): string {
    const found = this.verificationQuestions.find(
      (q) => q.id === questionId
    );
    return found ? found.question : 'Unknown Question';
  }

  initializeVerificationForm() {
    const group: any = {};
    this.verificationQuestions.forEach(question => {
      // All questions required
      group['question_' + question.id] = ['', Validators.required];
    });
    this.verificationForm = this.fb.group(group);
  }

  get hasErrorMessage() {
    return this.messages.some(msg => msg.severity === 'error');
  }

  /**
   * Construct a chain of requests from the given request down to the latest child.
   * If there are multiple children, we always pick the last child in the array 
   * until we reach a request with no children.
   */
  getRequestChain(root: RequestItem): RequestItem[] {
    const chain: RequestItem[] = [root];
    let current: RequestItem = root;
    while (current.children && current.children.length > 0) {
      const lastChild = current.children[current.children.length - 1];
      chain.push(lastChild);
      current = lastChild;
    }
    return chain;
  }

  viewRequest(request: RequestItem) {
    // Prevent multiple modal openings
    if (this.visible || this.visibleVerification || this.visibleDeactivate || this.visibleDeactivateDelete) {
      return;
    }

    this.selectedChain = this.getRequestChain(request);
    this.selectedRequest = this.selectedChain[this.selectedChain.length - 1];

    // Add new condition for deactivate_delete_company
    if (this.selectedRequest.type.key === 'deactivate_delete_company' ||
        this.selectedRequest.type.key === 'deactivate_delete_insighter') {
      this.visibleDeactivateDelete = true;
      return;
    }

    // If it's a verified company request, decide which UI to show
    if (this.selectedRequest.type.key === 'verified_company') {
      const targetId = request.id;
      // Fetch the stored (already answered) Q&A from the service
      const verificationSub = this.requestsService.getRequestVerificationQuestion(targetId).subscribe({
        next: (res) => {
          this.answeredQuestions = res.data || [];

          // If the answeredQuestions array is empty, we show the question form
          // else we show the read-only Q&A plus the typical "Approve/Decline"
          if (this.answeredQuestions.length === 0) {
            this.showVerificationQuestions = true;
          } else {
            this.showVerificationQuestions = false;
          }
          this.visibleVerification = true;
        },
        error: (err) => {
          console.error('Error fetching verification answers:', err);
          // Fallback: show question form if something goes wrong
          this.showVerificationQuestions = true;
          this.visibleVerification = true;
        },
      });
      this.unsubscribe.push(verificationSub);
      return;
    }

    // Otherwise, it's either activate_company or deactivate_company
    if (this.selectedRequest.type.key === 'activate_company') {
      this.visible = true;
    } else if (this.selectedRequest.type.key === 'deactivate_company') {
      this.visibleDeactivate = true;
    }
  }


  onCancel() {
    this.visible = false;
    this.selectedRequest = null;
    this.selectedChain = [];
    this.staffNotes = '';
  }

  onCancelDeactivate() {
    this.visibleDeactivate = false;
    this.selectedRequest = null;
    this.selectedChain = [];
    this.staffNotes = '';
  }
  onCancelVerification() {
    this.visibleVerification = false;
    this.selectedRequest = null;
    this.selectedChain = [];
    this.staffNotes = '';
    this.verificationForm.reset();
    this.showVerificationQuestions = false;
  }

  onActivate(status: 'approved' | 'declined') {
    if (this.selectedChain.length > 0) {
      const latestRequest = this.selectedChain[this.selectedChain.length - 1];
      const targetId = latestRequest.id;
     
      const reqSub = this.requestsService.activateCompanyRequest(
        targetId,
        this.staffNotes,
        status
      ).subscribe({
        next: (result) => {
          const msg = status === 'approved' ? 'Company approved successfully.' : 'Company declined successfully.';
          this.showSuccess('Success', msg);
          this.loadData();
          this.onCancel();
        },
        error: (error) => {
          console.error('Error fetching data:', error);
          this.handleServerErrors(error);
        }
      });

      this.unsubscribe.push(reqSub);
    }
  }


  // Called when "Submit Answers" is clicked
  submitVerificationAnswers() {
    if (!this.verificationForm.valid || !this.selectedRequest) {
      this.showError('Error', 'Please fill out all answers.');
      return;
    }
    const formValues = this.verificationForm.value;
    const verificationAnswers = Object.keys(formValues).map(key => {
      const questionId = parseInt(key.replace('question_', ''), 10);
      return { verification_question_id: questionId, answer: formValues[key] };
    });

    const requestId = this.selectedRequest.id;
    this.requestsService.sendVerificationAnswers(requestId, verificationAnswers).subscribe({
      next: () => {
        // Answers were submitted successfully, now reload or switch to approval UI
        this.showSuccess('Success', 'Answers submitted.');
        // Flip the flag so now we show the Approve/Disapprove UI
        this.visibleVerification = false;
      },
      error: (error) => {
        console.error('Error sending verification answers:', error);
        this.handleServerErrors(error);
      }
    });
  }
  onDeactivate(status: 'approved' | 'declined') {
    if (this.selectedChain.length > 0) {
      const latestRequest = this.selectedChain[this.selectedChain.length - 1];
      const targetId = latestRequest.id;
      const reqSub = this.requestsService.deactivateCompanyRequest(
        targetId,
        this.staffNotes,
        status
      ).subscribe({
        next: (result) => {
          const msg = status === 'approved' ? 'Company approved successfully.' : 'Company declined successfully.';
          this.showSuccess('Success', msg);
          this.loadData();
          this.visibleDeactivate = false;
          this.selectedRequest = null;
          this.selectedChain = [];
          this.staffNotes = '';
        },
        error: (error) => {
          console.error('Error fetching data:', error);
          this.handleServerErrors(error);
        }
      });
      this.unsubscribe.push(reqSub);
    }
  }

    // Called when "Approve" or "Disapprove" is clicked
    onVerify(status: 'approved' | 'declined') {
      if (!this.selectedRequest) return;
      const requestId = this.selectedRequest.id;
      this.requestsService.verifyCompanyRequest(requestId, this.staffNotes, status).subscribe({
        next: () => {
          const msg = status === 'approved' ? 'Company approved successfully.' : 'Company declined successfully.';
          this.showSuccess('Success', msg);
          this.loadData();
          this.onCancelVerification();
        },
        error: (error) => {
          console.error('Error verifying company:', error);
          this.handleServerErrors(error);
        }
      });
    }
  

  isFormValid() {
    return this.verificationForm && this.verificationForm.valid 
  }

  private handleServerErrors(error: any) {
    this.messages = [];
    if (error && error.error) {
      // Prefer explicit server message when available (e.g., balance due)
      if (error.error.message) {
        this.messages.push({
          severity: "error",
          summary: "",
          detail: error.error.message,
        });
      }
      // Also surface field/common validation errors if present
      if (error.error.errors) {
        const serverErrors = error.error.errors;
        for (const key in serverErrors) {
          if (serverErrors.hasOwnProperty(key)) {
            const messages = serverErrors[key];
            this.messages.push({
              severity: "error",
              summary: "",
              detail: Array.isArray(messages) ? messages.join(", ") : String(messages),
            });
          }
        }
      }
      // If neither message nor errors exist, show a generic error
      if (!error.error.message && !error.error.errors) {
        this.messages.push({
          severity: "error",
          summary: "Error",
          detail: "An unexpected error occurred.",
        });
      }
    } else {
      this.messages.push({
        severity: "error",
        summary: "Error",
        detail: "An unexpected error occurred.",
      });
    }
  }

  // Add new method for handling deactivate delete requests
  onDeactivateDelete(status: 'approved' | 'declined') {
    if (this.selectedChain.length > 0) {
      const latestRequest = this.selectedChain[this.selectedChain.length - 1];
      const targetId = latestRequest.id;
      
      const reqSub = this.requestsService.deactivateDeleteRequest(
        targetId,
        this.staffNotes,
        status
      ).subscribe({
        next: (result) => {
          const msg = status === 'approved' ? 'Request approved successfully.' : 'Request declined successfully.';
          this.showSuccess('Success', msg);
          this.loadData();
          this.visibleDeactivateDelete = false;
          this.selectedRequest = null;
          this.selectedChain = [];
          this.staffNotes = '';
        },
        error: (error) => {
          console.error('Error processing request:', error);
          this.handleServerErrors(error);
        }
      });

      this.unsubscribe.push(reqSub);
    }
  }

  // Add cancel method for deactivate delete dialog
  onCancelDeactivateDelete() {
    this.visibleDeactivateDelete = false;
    this.selectedRequest = null;
    this.selectedChain = [];
    this.staffNotes = '';
  }

  // PrimeNG table filter method
  applyFilter(event: any) {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    if (!filterValue) {
      this.filteredRequests = this.requestsList;
      return;
    }

    this.filteredRequests = this.requestsList.filter(request => 
      (request.requestable?.legal_name?.toLowerCase().includes(filterValue)) ||
      (request.requestable?.name?.toLowerCase().includes(filterValue)) ||
      (request.type?.label?.toLowerCase().includes(filterValue)) ||
      (request.final_status?.toLowerCase().includes(filterValue))
    );
  }

  // PrimeNG lazy loading event handler
  onLazyLoad(event: any) {
    const newPage = Math.floor(event.first / event.rows) + 1;
    const newPageSize = event.rows;

    // Only load data if page or page size actually changed and not loading
    if ((newPage !== this.currentPage || newPageSize !== this.pageSize) && !this.loading) {
      this.currentPage = newPage;
      this.pageSize = newPageSize;
      this.loadData();
    }
  }

  // Helper method to get user initials
  getInitials(user: any): string {
    if (!user) return '';
    const firstName = user.first_name || user.name || '';
    const lastName = user.last_name || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }
}
