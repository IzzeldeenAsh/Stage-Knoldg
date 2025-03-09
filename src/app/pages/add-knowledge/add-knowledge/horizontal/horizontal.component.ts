import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';
import { ICreateKnowldege, inits } from '../create-account.helper';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { KnowledgeService } from 'src/app/_fake/services/knowledge/knowledge.service';
import { AddInsightStepsService, UpdateKnowledgeAbstractsRequest } from 'src/app/_fake/services/add-insight-steps/add-insight-steps.service';
import * as moment from 'moment';

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
  
  constructor(
    injector: Injector,
    private route: ActivatedRoute,
    private knowledgeService: KnowledgeService,
    private addInsightStepsService: AddInsightStepsService,
    private router: Router
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
            topicId: knowledge.topic.id,
            industry: knowledge.industry.id,
            isic_code: knowledge.isic_code?.id || null,
            hs_code: knowledge.hs_code?.id || null,
            language: knowledge.language,
            regions: knowledge.regions.map((region: any) => region.id) || [],
            countries: knowledge.countries.map((country: any) => country.id) || [],
            economic_bloc: knowledge.economic_blocs || [],
            description: knowledge.description,
            targetMarket: knowledge.economic_blocs && knowledge.economic_blocs.length > 0 ? '2' : '1',
            keywords: knowledge.keywords.map((keyword: any) => ({ display: keyword, value: keyword })) || [],
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
    const currentAccount = this.account$.value;
    
    // Check if there are documents to process
    if (currentAccount.documents?.length > 0) {
      this.isLoading = true;
      let completedUpdates = 0;
      const totalDocuments = currentAccount.documents.length;

      // Create an array to store all subscriptions
      const documentSubs = currentAccount.documents.map((doc: any) => {
        // Prepare document request according to interface requirements
        const documentRequest: any = {
          file_name: doc.file_name,
          price: doc.price.toString(),
          status: 'active',
        };

        if (doc.description) {
          documentRequest.description = doc.description;
        }

        // Add file if not from server
        if (!doc.fromServer && doc.file) {
          documentRequest.file = doc.file;
        }

        return this.addInsightStepsService
          .step3AddKnowledgeDocument(
            doc.fromServer ? doc.id : this.knowledgeId, 
            documentRequest, 
            doc.fromServer
          )
          .subscribe({
            next: (response) => {
              console.log('Document processed successfully', response);
              completedUpdates++;
              
              // Only proceed to next step when all documents are processed
              if (completedUpdates === totalDocuments) {
                this.currentStep$.next(nextStep);
                this.isLoading = false;
              }
            },
            error: (error) => {
              this.handleServerErrors(error);
              this.isLoading = false;
            }
          });
      });

      // Add all subscriptions to unsubscribe array
      this.unsubscribe.push(...documentSubs);
    } else {
      // If no documents, just proceed to next step
      this.currentStep$.next(nextStep);
    }
  }

  handleStep3Submission(nextStep: number) {
    this.isLoading = true;
    const currentAccount = this.account$.value;
    
    // Prepare the request for updating abstracts
    const updateRequest: UpdateKnowledgeAbstractsRequest = {
      description: currentAccount.description || '',
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
    this.isLoading = true;
    const currentAccount = this.account$.value;
    
    // Prepare the request payload
    const updateRequest = {
      title: currentAccount.title || '',
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
          this.currentStep$.next(nextStep);
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
          this.currentStep$.next(nextStep);
          this.isLoading = false;
        },
        error: (error) => {
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
}
