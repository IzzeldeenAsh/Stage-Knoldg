import { Component, Injector, OnInit } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { forkJoin } from "rxjs";
import { Breadcrumb } from "src/app/_fake/models/breadcrumb.model";
import { DocumentListResponse } from "src/app/_fake/services/add-insight-steps/add-insight-steps.service";
import { Knowledge, KnowledgeService } from "src/app/_fake/services/knowledge/knowledge.service";
import { BaseComponent } from "src/app/modules/base.component";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import Swal from 'sweetalert2';
import { TranslationService } from "src/app/modules/i18n";

@Component({
  selector: "app-review-insighter-knowledge",
  templateUrl: "./review-insighter-knowledge.component.html",
  styleUrls: ["./review-insighter-knowledge.component.scss"]
})
export class ReviewInsighterKnowledgeComponent extends BaseComponent implements OnInit {
  breadcrumbs: Breadcrumb[] = [];
  knowledgeId: string;
  requestId: string;
  knowledge: Knowledge;
  documents: DocumentListResponse;
  isLoading: boolean = false;
  staffNotes: string = '';

  constructor(
    injector: Injector,
    private knowledgeService: KnowledgeService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {
    super(injector);
  }

  ngOnInit() {
    this.route.data.subscribe((data) => {
      if (data["breadcrumb"]) {
        this.breadcrumbs = data["breadcrumb"];
      }
    });
    
    const paramsSubscription = this.route.params.subscribe((params: Params) => {
      this.knowledgeId = params["id"];
      if (this.knowledgeId) {
        this.loadKnowledgeData();
      }
    });
    
    // Get request ID from query parameters
    this.route.queryParams.subscribe(params => {
      this.requestId = params['requestId'];
      console.log('Request ID from query params:', this.requestId);
    });
    
    this.unsubscribe.push(paramsSubscription);
  }

  public loadKnowledgeData(): void {
    this.isLoading = true;
    
    // Define headers for the request
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': this.lang,
    });
    
    // Using the company API endpoint for getting knowledge
    const knowledgeSubscription = this.http.get<any>(`https://api.foresighta.co/api/company/library/knowledge/${this.knowledgeId}`, { headers })
      .subscribe({
        next: (response) => {
          this.knowledge = response.data;
          // Get documents info from the knowledge service
          this.knowledgeService.getReviewDocumentsList(Number(this.knowledgeId))
            .subscribe({
              next: (documentsResponse) => {
                this.documents = documentsResponse;
                this.isLoading = false;
              },
              error: (error) => {
                this.handleServerErrors(error);
                this.isLoading = false;
              }
            });
        },
        error: (error) => {
          this.handleServerErrors(error);
          this.isLoading = false;
        },
      });
    this.unsubscribe.push(knowledgeSubscription);
  }

  private handleServerErrors(error: any) {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          this.showError('', messages.join(", "));
        }
      }
    } else {
      this.showError('','An unexpected error occurred.');
    }
  }

  approveKnowledge(): void {
    this.confirmAction('approve');
  }

  rejectKnowledge(): void {
    this.confirmAction('decline');
  }

  confirmAction(status: 'approve' | 'decline'): void {
    const actionText = status === 'approve' ? 'approve' : 'reject';
    const actionTitle = status === 'approve' ? 'Approve Knowledge' : 'Reject Knowledge';
    const actionIcon = status === 'approve' ? 'success' : 'warning';
    const actionButtonClass = status === 'approve' ? 'btn btn-success fw-bold px-10' : 'btn btn-danger fw-bold px-10';
    
    Swal.fire({
      title: `Are you sure you want to ${actionText} this knowledge?`,
      text: `You are about to ${actionText} this knowledge submission.`,
      icon: actionIcon as any,
      showCancelButton: true,
      confirmButtonText: `Yes, ${actionText} it!`,
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: actionButtonClass,
        cancelButton: 'btn btn-light-primary fw-bold px-10'
      },
      buttonsStyling: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.submitDecision(status);
      }
    });
  }

  submitDecision(status: 'approve' | 'decline'): void {
    this.isLoading = true;
    
    // Map approve/decline to the API's expected values
    const apiStatus = status === 'approve' ? 'approved' : 'declined';
    
    const body = {
      staff_notes: this.staffNotes,
      status: apiStatus
    };

    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': this.lang,
    });

    if (!this.requestId) { return; }
    // Use request ID instead of knowledge ID if available
    const apiEndpoint = `https://api.foresighta.co/api/company/insighter/request/knowledge/accept/${this.requestId}`;

    this.http.post(apiEndpoint, body, { headers })
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          Swal.fire({
            title: 'Success!',
            text: `Knowledge has been ${status === 'approve' ? 'approved' : 'rejected'} successfully.`,
            icon: 'success',
            confirmButtonText: 'OK',
            customClass: {
              confirmButton: 'btn btn-primary fw-bold px-10'
            },
            buttonsStyling: false
          }).then(() => {
            // Navigate back to the company dashboard or other appropriate page
            this.router.navigate(['/app/insighter-dashboard/my-requests']);
          });
        },
        error: (error) => {
          this.isLoading = false;
          this.handleServerErrors(error);
        }
      });
  }
} 