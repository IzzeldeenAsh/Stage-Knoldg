import { Component, Injector, OnInit } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { forkJoin } from "rxjs";
import { Breadcrumb } from "src/app/_fake/models/breadcrumb.model";
import { IKnoldgProfile } from "src/app/_fake/models/profile.interface";
import { AddInsightStepsService, DocumentListResponse, PublishKnowledgeRequest } from "src/app/_fake/services/add-insight-steps/add-insight-steps.service";
import { ProfileService } from "src/app/_fake/services/get-profile/get-profile.service";
import {
  Knowledge,
  KnowledgeService,
} from "src/app/_fake/services/knowledge/knowledge.service";
import { BaseComponent } from "src/app/modules/base.component";
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SchedulePublishDialogComponent } from "./schedule-publish-dialog/schedule-publish-dialog.component";
import Swal from 'sweetalert2';
import { KnowledgeUpdateService } from "src/app/_fake/services/knowledge/knowledge-update.service";

@Component({
  selector: "app-view-my-knowledge",
  templateUrl: "./view-my-knowledge.component.html",
  styleUrls: ["./view-my-knowledge.component.scss"],
  providers: [DialogService]
})
export class ViewMyKnowledgeComponent extends BaseComponent implements OnInit {
  breadcrumbs: Breadcrumb[] = [];
  knowledgeId: string;
  knowledge: Knowledge;
  documents: DocumentListResponse;
  isLoading: boolean = false;
  dialogRef: DynamicDialogRef | undefined;

  constructor(
    injector: Injector,
    private knowledgeService: KnowledgeService,
    private knowledgeUpdateService: KnowledgeUpdateService,
    private route: ActivatedRoute,
    private router: Router,
    private addInsightStepsService: AddInsightStepsService,
    private dialogService: DialogService,
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
    
    // Subscribe to knowledge updates
    const updateSubscription = this.knowledgeUpdateService.knowledgeUpdated$.subscribe(() => {
      this.loadKnowledgeData();
    });
    
    this.unsubscribe.push(paramsSubscription, updateSubscription);
  }

  public loadKnowledgeData(): void {
    this.isLoading = true;
    const knowledgeSubscription = forkJoin({
      knowledge: this.knowledgeService.getKnowledgeById(
        Number(this.knowledgeId)
      ),
      documents: this.knowledgeService.getListDocumentsInfo(
        Number(this.knowledgeId)
      ),
    }).subscribe({
      next: (response) => {
        this.knowledge = response.knowledge.data;
        this.documents = response.documents;
        this.isLoading = false;
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
         this.showError('',messages.join(", "));
        }
      }
    } else {
      this.showError('','An unexpected error occurred.');
    }
  }

  confirmPublish(): void {
    Swal.fire({
      title: 'Are you sure?',
      text: "You are about to publish this knowledge",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, publish it!',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-light'
      },
      buttonsStyling: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.publishKnowledge();
      }
    });
  }

  confirmUnpublish(): void {
    Swal.fire({
      title: 'Are you sure?',
      text: "You are about to unpublish this knowledge",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, unpublish it!',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'btn btn-danger',
        cancelButton: 'btn btn-light'
      },
      buttonsStyling: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.unpublishKnowledge();
      }
    });
  }

  publishKnowledge(): void {
    const request: PublishKnowledgeRequest = {
      status: 'published',
      published_at: new Date().toISOString()
    };
    
    this.addInsightStepsService.publishKnowledge(Number(this.knowledgeId), request)
      .subscribe({
        next: () => {
          this.loadKnowledgeData();
        },
        error: (error) => {
          this.handleServerErrors(error);
        }
      });
  }

  unpublishKnowledge(): void {
    const request: PublishKnowledgeRequest = {
      status: 'unpublished',
      published_at: ''
    };
    
    this.addInsightStepsService.publishKnowledge(Number(this.knowledgeId), request)
      .subscribe({
        next: () => {
          this.loadKnowledgeData();
        },
        error: (error) => {
          this.handleServerErrors(error);
        }
      });
  }

  openScheduleDialog(): void {
    this.dialogRef = this.dialogService.open(SchedulePublishDialogComponent, {
      header: 'Schedule Publication',
      width: '50vw',
      contentStyle: { overflow: 'visible' },
      baseZIndex: 10000,
      data: { published_at: this.knowledge.published_at },
      appendTo: 'body'
    });

    this.dialogRef.onClose.subscribe(result => {
      if (result) {
        const request: PublishKnowledgeRequest = {
          status: 'scheduled',
          published_at: result.publishDate
        };
        
        this.addInsightStepsService.publishKnowledge(Number(this.knowledgeId), request)
          .subscribe({
            next: () => {
              this.loadKnowledgeData();
            },
            error: (error) => {
              this.handleServerErrors(error);
            }
          });
      }
    });
  }

  publishAs(type: 'both' | 'package'): void {
    Swal.fire({
      title: 'Are you sure?',
      text: type === 'package' ? 'This will make the knowledge available in packages only' : 'This will make the knowledge available both standalone and in packages',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, proceed!',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-light'
      },
      buttonsStyling: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.knowledgeService.publishAs(Number(this.knowledgeId), type)
          .subscribe({
            next: () => {
              this.loadKnowledgeData();
              this.showSuccess('', 'Publishing options updated successfully');
            },
            error: (error) => {
              this.handleServerErrors(error);
            }
          });
      }
    });
  }

  hasRequiredFields(): boolean {
    if (!this.knowledge) return false;
    if (!this.documents || !this.documents.data || this.documents.data.length === 0) return false;
    
    // Check for all required fields
    return !!(
      this.knowledge.title &&
      this.knowledge.description &&
      this.knowledge.topic &&
      this.knowledge.industry &&
      this.knowledge.language &&
      (
        (this.knowledge.countries && this.knowledge.countries.length > 0) ||
        (this.knowledge.regions && this.knowledge.regions.length > 0) ||
        (this.knowledge.economic_blocs && this.knowledge.economic_blocs.length > 0)
      ) &&
      this.knowledge.keywords &&
      this.knowledge.tags && 
      this.knowledge.tags.length > 0
    );
  }

  navigateToEdit(): void {
    this.router.navigate(['/app/edit-knowledge/stepper', this.knowledge.id]);
  }
}
