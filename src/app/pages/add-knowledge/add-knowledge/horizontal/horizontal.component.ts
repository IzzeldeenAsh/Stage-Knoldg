import { Component, Injector, OnInit, ViewChild, ViewContainerRef, QueryList, ViewChildren } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';
import { ICreateKnowldege, inits } from '../create-account.helper';
import { BehaviorSubject, concatMap, from, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { KnowledgeService } from 'src/app/_fake/services/knowledge/knowledge.service';
import { AddInsightStepsService, UpdateKnowledgeAbstractsRequest } from 'src/app/_fake/services/add-insight-steps/add-insight-steps.service';
import * as moment from 'moment';
import { SubStepDocumentsComponent } from '../steps/step2/sub-step-documents/sub-step-documents.component';

@Component({
  selector: 'app-horizontal',
  templateUrl: './horizontal.component.html',
  styleUrl: './horizontal.component.scss'
})
export class HorizontalComponent extends BaseComponent implements OnInit {
  formsCount = 6;
  isEditMode = false;
  knowledgeId!: number;
  account$: BehaviorSubject<ICreateKnowldege> =
  new BehaviorSubject<ICreateKnowldege>(inits);
  currentStep$: BehaviorSubject<number> = new BehaviorSubject(1);
  isCurrentFormValid$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  isLoading = false;
  
  @ViewChild(SubStepDocumentsComponent) documentsComponent: SubStepDocumentsComponent;
  @ViewChild('step3Component') step3Component: any;
  @ViewChild('step4Component') step4Component: any;
  
  constructor(
    injector: Injector,
    private route: ActivatedRoute,
    private knowledgeService: KnowledgeService,
    private addInsightStepsService: AddInsightStepsService,
    private router: Router,
    private viewContainerRef: ViewContainerRef
   ) {
    super(injector);
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.knowledgeId = +id;
        this.isEditMode = true;
        this.formsCount = 5; // Set forms count to 5 in edit mode
        // Initialize with empty values when editing
        const emptyAccount = {
          ...inits,
          knowledgeType: '', // Start with empty knowledgeType when editing
        };
        this.account$.next(emptyAccount);
        this.loadKnowledgeData();
      }
    });

    // Subscribe to API loading status
    this.addInsightStepsService.isLoading$.subscribe(isLoading => {
      this.isLoading = isLoading;
    });
  }

  private loadKnowledgeData() {
    this.isLoading = true;
    const loadSub = this.knowledgeService.getKnowledgeById(this.knowledgeId)
      .subscribe({
        next: (response) => {
          const knowledge = response.data;
          
          // Determine targetMarket based on the rules
          let targetMarket = '1';
          if (!knowledge.economic_blocs || knowledge.economic_blocs.length === 0) {
            if (!knowledge.countries || knowledge.countries.length === 0) {
              targetMarket = '2';
            }
          }

          // Update the account with fetched data
          const updatedAccount: any = {
            ...this.account$.value,
            knowledgeId: this.knowledgeId,
            knowledgeType: knowledge.type,
            title: knowledge.title,
            topicId: knowledge.topic?.id || null,
            industry: knowledge.industry?.id || null,
            isic_code: knowledge.isic_code?.id || null,
            hs_code: knowledge.hs_code?.id || null,
            language: knowledge.language,
            regions: knowledge.regions?.map((region: any) => region.id) || [],
            countries: knowledge.countries?.map((country: any) => country.id) || [],
            economic_bloc: knowledge.economic_blocs || [],
            description: knowledge.description,
            targetMarket: knowledge.economic_blocs && knowledge.economic_blocs.length > 0 ? '2' : '1',
            keywords: knowledge.keywords?.map((keyword: any) => ({ display: keyword, value: keyword })) || [],
            customTopic: '',
            documents: [],
            publish_date_time: knowledge.published_at ? moment(knowledge.published_at).format('YYYY-MM-DD HH:mm:ss') : '',
            publish_status: knowledge.status === 'published' ? 'draft' : knowledge.status
          };

          this.account$.next(updatedAccount);
          this.updateAccount(updatedAccount, true);
          this.isCurrentFormValid$.next(true);
          this.isLoading = false;
        },
        error: (error) => {
          this.handleServerErrors(error);
          this.isLoading = false;
        }
      });

    this.unsubscribe.push(loadSub);
  }

  updateAccount = (part: Partial<ICreateKnowldege>, isFormValid: boolean) => {
    const currentAccount = this.account$.value;
    const updatedAccount = { ...currentAccount, ...part };
    this.account$.next(updatedAccount);
    this.isCurrentFormValid$.next(isFormValid);

    // If the knowledgeType has changed and it's valid, handle the API call
    if (part.knowledgeType && isFormValid) {
      this.handleKnowledgeTypeChange(part.knowledgeType);
    }
  };

  handleKnowledgeTypeChange(knowledgeType: string) {
    if (this.isEditMode && this.knowledgeId) {
      // Update existing knowledge type
      this.addInsightStepsService.updateKnowledgeType(this.knowledgeId, knowledgeType)
        .subscribe({
          next: (response) => {
            console.log('Knowledge type updated successfully', response);
            // The next step will be triggered by the step1 component's goToNextStep event
          },
          error: (error) => {
            console.error('Error updating knowledge type', error);
            this.handleServerErrors(error);
          }
        });
    } else {
      // Create new knowledge type
      this.addInsightStepsService.step1HandleKnowledgeType(knowledgeType)
        .subscribe({
          next: (response) => {
            console.log('Knowledge type created successfully', response);
            // Store the newly created knowledge ID
            if (response.data && response.data.knowledge_id) {
              this.knowledgeId = response.data.knowledge_id;
              this.updateAccount({ knowledgeId: response.data.knowledge_id }, true);
            }
            // The next step will be triggered by the step1 component's goToNextStep event
          },
          error: (error) => {
            console.error('Error creating knowledge type', error);
            this.handleServerErrors(error);
          }
        });
    }
  }

  nextStep() {
    const nextStep = this.currentStep$.value + 1;
    if (nextStep > this.formsCount) {
      return;
    }

    // Handle step-specific submissions
    if (this.currentStep$.value === 2) {
      // Handle step 2 submission (documents)
      this.handleStep2Submission(nextStep);
    } else if (this.currentStep$.value === 3) {
      // Handle step 3 submission (descriptions)
      this.handleStep3Submission(nextStep);
    } else if (this.currentStep$.value === 4) {
      // Handle step 4 submission (knowledge details, tags and keywords)
      // For edit mode, redirecting will happen inside the handler after successful submission
      this.handleStep4Submission(nextStep);
    } else if (this.currentStep$.value === 5) {
      // Handle step 5 submission (publishing options)
      this.handleStep5Submission(nextStep);
    } else {
      // For other steps, just proceed without any special handling
      this.currentStep$.next(nextStep);
    }
  }

  handleStep2Submission(nextStep: number) {
    // No documents component means we can proceed
    if (!this.documentsComponent) {
      this.currentStep$.next(nextStep);
      return;
    }
    
    // Log document status for debugging
    this.documentsComponent.logDocumentStatus();
    
    // Validate document titles
    const docs = this.documentsComponent.documents;
    if (docs && docs.length > 0) {
      // Check for empty titles
      const invalidDocuments = docs.filter(doc => !doc.file_name?.trim());
      if (invalidDocuments.length > 0) {
        this.showWarn('', 'All documents must have titles');
        return; // Don't advance to next step
      }
      
      // Check for duplicate titles
      const titles = new Set<string>();
      const duplicateTitles = docs.filter(doc => {
        const title = doc.file_name.toLowerCase();
        if (titles.has(title)) return true;
        titles.add(title);
        return false;
      });
      
      if (duplicateTitles.length > 0) {
        this.showWarn('', 'All document titles must be unique');
        return; // Don't advance to next step
      }
      
      // Check for upload errors
      if (this.hasAnyDocumentUploadErrors()) {
        this.showWarn('', 'Please fix the upload errors before continuing');
        return; // Don't advance to next step
      }
      
      // Check for pending uploads
      if (this.documentsComponent.hasUploadsInProgress()) {
        this.showWarn('', 'Please wait for all uploads to complete before continuing');
        return; // Don't advance to next step
      }
      
      // START LOADING STATE
      this.isLoading = true;
      
      // First fetch the document IDs to ensure we have the correct ones
      this.documentsComponent.getUploadedDocumentIds();
      
      // Add a slight delay to ensure document IDs are fetched
      setTimeout(() => {
        // All validations passed, proceed with updating document details
        console.log('Updating document details with IDs:', this.documentsComponent.documents);
        
        this.documentsComponent.updateDocumentDetails()
          .then(() => {
            console.log('All document details updated successfully');
            this.isLoading = false;
            this.currentStep$.next(nextStep);
          })
          .catch(error => {
            console.error('Error updating document details:', error);
            this.isLoading = false;
            this.showError('', 'Failed to update document details. Please try again.');
          });
      }, 1000); // 1 second delay to ensure IDs are fetched
    } else {
      // No documents to update, just proceed
      this.currentStep$.next(nextStep);
    }
  }
  
  private hasAnyDocumentUploadErrors(): boolean {
    if (!this.documentsComponent) {
      return false;
    }
    
    return this.documentsComponent.hasUploadErrors();
  }

  handleStep3Submission(nextStep: number) {
    const currentAccount = this.account$.value;
    
    // Get a reference to the step3 component if it's viewable
    const step3Component = this.getCurrentStepComponent(3);
    if (step3Component && typeof step3Component.validateDocuments === 'function') {
      // Use the component's own validation method
      const isValid = step3Component.validateDocuments();
      if (!isValid) {
        this.showWarn('', 'All documents must have descriptions');
        return; // Don't advance to next step
      }
    } else {
      // Fallback validation if component reference is not available
      // Validate that abstracts exist before submission
      if (!currentAccount.documentDescriptions || currentAccount.documentDescriptions.length === 0) {
        this.showWarn('', 'Please generate or enter abstracts for all documents before continuing');
        return; // Don't advance to next step
      }
      
      // Check for empty abstracts
      const emptyAbstracts = currentAccount.documentDescriptions.filter(doc => !doc.description?.trim());
      if (emptyAbstracts.length > 0) {
        this.showWarn('', 'All documents must have descriptions');
        return; // Don't advance to next step
      }
    }
    
    this.isLoading = true;
    
    // Prepare the request for updating abstracts
    const updateRequest: UpdateKnowledgeAbstractsRequest = {
      documents: currentAccount.documentDescriptions || []
    };

    this.addInsightStepsService.updateKnowledgeAbstracts(this.knowledgeId, updateRequest)
      .subscribe({
        next: (response) => {
          console.log('Knowledge abstracts updated successfully', response);
          this.currentStep$.next(nextStep);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating knowledge abstracts', error);
          this.handleServerErrors(error);
          this.isLoading = false;
        }
      });
  }

  handleStep4Submission(nextStep: number) {
    const currentAccount = this.account$.value;
    
    // Get the Step 4 component instance
    const step4Component = this.getCurrentStepComponent(4);
    
    // Use validateForm method to show all validation errors
    if (step4Component && typeof step4Component.validateForm === 'function') {
      // This will mark all controls as touched and show validation errors
      const isValid = step4Component.validateForm();
      if (!isValid) {
        return; // Don't advance to next step, errors are visible in the UI
      }
    } else {
      // Fallback validation if component reference is not available
      // Validate required fields
      if (!currentAccount.title) {
        this.showWarn('', 'Please enter a title for your knowledge');
        return; // Don't advance to next step
      }
      
      if (!currentAccount.description) {
        this.showWarn('', 'Please enter a description for your knowledge');
        return; // Don't advance to next step
      }
      
      if (!currentAccount.language) {
        this.showWarn('', 'Please select a language for your knowledge');
        return; // Don't advance to next step
      }
      
      if (!currentAccount.industry) {
        this.showWarn('', 'Please select an industry for your knowledge');
        return; // Don't advance to next step
      }
      
      if (!currentAccount.topicId) {
        this.showWarn('', 'Please select a topic for your knowledge');
        return; // Don't advance to next step
      }
      
      // Check for target market validation
      if (currentAccount.targetMarket === '1') {
        // Region/country validation
        if ((!currentAccount.regions || currentAccount.regions.length === 0) && 
            (!currentAccount.countries || currentAccount.countries.length === 0)) {
          this.showWarn('', 'Please select at least one region or country');
          return; // Don't advance to next step
        }
      } else if (currentAccount.targetMarket === '2') {
        // Economic blocks validation
        if (!currentAccount.economic_blocs || currentAccount.economic_blocs.length === 0) {
          this.showWarn('', 'Please select at least one economic block');
          return; // Don't advance to next step
        }
      } else {
        this.showWarn('', 'Please select a target market option');
        return; // Don't advance to next step
      }
      
      // Validate keywords
      if (!currentAccount.keywords || currentAccount.keywords.length === 0) {
        this.showWarn('', 'Please add at least one keyword');
        return; // Don't advance to next step
      }
    }
    
    this.isLoading = true;
    
    // Prepare the request payload
    const updateRequest = {
      title: currentAccount.title || '',
      description: currentAccount.description || '',
      topic_id: currentAccount.topicId || 0,
      industry_id: currentAccount.industry || 0,
      isic_code_id: currentAccount.isic_code || null,
      hs_code_id: currentAccount.hs_code || null,
      language: currentAccount.language || '',
      region: currentAccount.regions || [],
      country: currentAccount.countries || [],
      economic_bloc: currentAccount.economic_blocs || [],
      keywords: currentAccount.keywords?.map((k: any) => k.value || k) || [],
      tag_ids: currentAccount.tag_ids || []
    };

    // Call the API to update knowledge details
    this.addInsightStepsService.updateKnowledgeDetails(this.knowledgeId, updateRequest)
      .subscribe({
        next: (response) => {
          console.log('Knowledge details updated successfully', response);
          
          // In edit mode, redirect to details page when moving to step 5
          if (this.isEditMode && nextStep === 5) {
            this.router.navigate([`/app/my-knowledge-base/view-my-knowledge/${this.knowledgeId}/details`]);
          } else {
            this.currentStep$.next(nextStep);
          }
          
          this.isLoading = false;
        },
        error: (error) => {
          this.handleServerErrors(error);
          this.isLoading = false;
        }
      });
  }

  handleStep5Submission(nextStep: number) {
    const currentAccount = this.account$.value;
    
    // Validate publish status selection
    if (!currentAccount.publish_status) {
      this.showWarn('', 'Please select a publishing option');
      return; // Don't advance to next step
    }
    
    // If scheduled publish is selected, validate the publish date
    if (currentAccount.publish_status === 'scheduled' && !currentAccount.publish_date_time) {
      this.showWarn('', 'Please select a publish date and time');
      return; // Don't advance to next step
    }
    
    this.isLoading = true;
    
    // Prepare the publish request based on the selected option
    const publishRequest = {
      status: currentAccount.publish_status || 'draft',
      published_at: currentAccount.publish_date_time || this.getCurrentDateTime()
    };
    
    // Only set published_at for scheduled or immediate publish
    if (publishRequest.status === 'draft') {
      publishRequest.published_at = '';
    }

    // Make the API call to publish the knowledge
    this.addInsightStepsService.publishKnowledge(this.knowledgeId, publishRequest)
      .subscribe({
        next: (response) => {
          console.log('Knowledge publishing handled successfully', response);
          
          // If in edit mode and this is the final step, navigate back to knowledge details
          if (this.isEditMode && nextStep > this.formsCount) {
            this.router.navigate([`/app/my-knowledge-base/view-my-knowledge/${this.knowledgeId}/details`]);
          } else {
            this.currentStep$.next(nextStep);
          }
          
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error publishing knowledge', error);
          this.handleServerErrors(error);
          this.isLoading = false;
        }
      });
  }

  private getCurrentDateTime(): string {
    const now = new Date();
    
    const year = now.getFullYear();
    const month = this.padZero(now.getMonth() + 1);
    const day = this.padZero(now.getDate());
    
    const hours = this.padZero(now.getHours());
    const minutes = this.padZero(now.getMinutes());
    const seconds = this.padZero(now.getSeconds());
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  private padZero(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }

  prevStep() {
    const prevStep = this.currentStep$.value - 1;
    if (prevStep === 0) {
      return;
    }
    this.currentStep$.next(prevStep);
  }

  private handleServerErrors(error: any) {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          console.error(`${key}: ${messages.join(', ')}`);
        }
      }
    } else {
      console.error('An unexpected error occurred.');
    }
  }

  // Public method to check for upload errors - used in template
  hasAnyUploadErrors(): boolean {
    return this.hasAnyDocumentUploadErrors();
  }

  // Helper method to get the current step component by step number
  private getCurrentStepComponent(stepNumber: number): any {
    // For step 3, we need to access its validation method
    if (stepNumber === 3) {
      return this.step3Component;
    }
    // For step 4, we need to access its validation method
    if (stepNumber === 4) {
      return this.step4Component;
    }
    return null;
  }
}
