import { Component, Injector, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as moment from 'moment';
import { ICreateKnowldege, inits } from '../create-account.helper';
import { AddInsightStepsService, CreateKnowledgeRequest, SuggestTopicRequest, SyncTagsKeywordsRequest, PublishKnowledgeRequest, AddKnowledgeDocumentRequest } from 'src/app/_fake/services/add-insight-steps/add-insight-steps.service';
import { switchMap } from 'rxjs/operators';
import { BaseComponent } from 'src/app/modules/base.component';
import { ActivatedRoute } from '@angular/router';
import { KnowledgeService } from 'src/app/_fake/services/knowledge/knowledge.service';

@Component({
  selector: 'app-horizontal',
  templateUrl: './horizontal.component.html',
  styleUrls: ['./horizontal.component.scss'],
})
export class HorizontalComponent extends BaseComponent implements OnInit {
  formsCount = 6;
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
    private addInsightStepsService: AddInsightStepsService,
    private route: ActivatedRoute,
    private knowledgeService: KnowledgeService
  ) {
    super(injector);
  }

  ngOnInit(): void {
    // Get the ID from the route if it exists
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.knowledgeId = +id;
        // Initialize with empty values when editing
        const emptyAccount = {
          ...inits,
          knowledgeType: '', // Start with empty knowledgeType when editing
        };
        this.account$.next(emptyAccount);
        this.loadKnowledgeData();
      }
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
    console.log("account", this.account$.value);
  };

  nextStep() {
    const nextStep = this.currentStep$.value + 1;
    if (nextStep > this.formsCount) {
      return;
    }

    // Handle step 2 submission
    if (this.currentStep$.value === 2) {
      this.handleStep2Submission(nextStep);
    } else if (this.currentStep$.value === 3) {
      // Handle step 3 submission
      const currentAccount = this.account$.value;
      if (currentAccount.knowledgeType === 'insight' && currentAccount.documents?.length > 0) {
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
        // For non-insight types or no documents, just proceed
        this.currentStep$.next(nextStep);
      }
    } else if (this.currentStep$.value === 4) {
      this.isLoading = true;
      const currentAccount = this.account$.value;

      // Convert keywords objects to string array
      const keywordsArray = currentAccount.keywords.map(k => k.value);

      const syncRequest: SyncTagsKeywordsRequest = {
        keywords: keywordsArray,
        tag_ids: currentAccount.tag_ids
      };

      const step4Sub = this.addInsightStepsService
        .syncTagsKeywords(this.knowledgeId, syncRequest)
        .subscribe({
          next: (response) => {
            console.log('Tags and keywords synced successfully', response);
            this.currentStep$.next(nextStep);
            this.isLoading = false;
          },
          error: (error) => {
            this.handleServerErrors(error);
            this.isLoading = false;
          }
        });

      this.unsubscribe.push(step4Sub);
    } else if (this.currentStep$.value === 5) {
      this.handleStep5Submission(nextStep);
    } else {
      // For other steps, just proceed without loading state
      this.currentStep$.next(nextStep);
    }
  }

  /**
   * Handles the submission logic for Step 5.
   * @param nextStep The next step number to navigate to.
   */
  private handleStep5Submission(nextStep: number) {
    const currentAccount = this.account$.value;
    const publishStatus = currentAccount.publish_status;

    if (publishStatus === 'draft') {
      // Proceed to the next step without publishing
      this.currentStep$.next(nextStep);
      return;
    }

    const publishRequest: PublishKnowledgeRequest = {
      status: publishStatus === 'now' ? 'published' : 'scheduled',
      published_at: publishStatus === 'now' ? this.getCurrentDateTime() : currentAccount.publish_date_time
    };

    this.isLoading = true;

    this.addInsightStepsService.publishKnowledge(this.knowledgeId, publishRequest)
      .subscribe({
        next: (response) => {
          console.log('Knowledge published successfully', response);
          this.currentStep$.next(nextStep);
          this.isLoading = false;
        },
        error: (error) => {
          this.handleServerErrors(error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Returns the current date and time formatted as "YYYY-MM-DD HH:mm:ss".
   */
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

  /**
   * Pads a number with a leading zero if it's less than 10.
   * @param num The number to pad.
   */
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
         this.showError('',messages.join(", "));
        }
      }
    } else {
  
      this.showError('','An unexpected error occurred.');
    }
  }


  handleStep2Submission(nextStep: number) {
    this.isLoading = true;
    const currentAccount = this.account$.value;
    
    // Prepare the knowledge request
    const knowledgeRequest: CreateKnowledgeRequest = {
      type: currentAccount.knowledgeType,
      title: currentAccount.title,
      description: currentAccount.description,
      topic_id: currentAccount.topicId,
      industry_id: currentAccount.industry || 0,
      isic_code_id: currentAccount.isic_code ? currentAccount.isic_code : null,
      hs_code_id: currentAccount.hs_code ? currentAccount.hs_code : null,
      language: currentAccount.language,
      // Fix the logic - when targetMarket is '1' use regions/countries, when '2' use economic_blocks
      ...(currentAccount.targetMarket === '1' ? {
        region: currentAccount.regions || [],
        country: currentAccount.countries || [],
        economic_blocs: []
      } : {
        region: [],
        country: [],
        economic_blocs: currentAccount.economic_blocs || []
      })
    };

    let submitObservable;

    if (this.knowledgeId) {
      // **Update Scenario**
      if (currentAccount.customTopic.trim() !== '') {
        // If customTopic is provided, create a new topic
        const topicRequest: SuggestTopicRequest = {
          industry_id: currentAccount.industry || 0,
          name: {
            en: currentAccount.customTopic,
            ar: currentAccount.customTopic
          }
        };

        submitObservable = this.addInsightStepsService.createSuggestTopic(topicRequest, this.lang)
          .pipe(
            switchMap(response => {
              // Update the knowledge request with the new topic ID
              knowledgeRequest.topic_id = response.data.topic_id;
              
              // Update account with new topic ID and clear custom topic
              this.updateAccount({
                topicId: response.data.topic_id,
                customTopic: ''
              }, true);

              return this.addInsightStepsService.step2UpdateKnowledge(this.knowledgeId, knowledgeRequest);
            })
          );
      } else {
        // If no customTopic, directly update knowledge
        submitObservable = this.addInsightStepsService.step2UpdateKnowledge(this.knowledgeId, knowledgeRequest);
      }
    } else {
      // **Create Scenario**
      if (currentAccount.customTopic.trim() !== '') {
        // If customTopic is provided, create a new topic first
        const topicRequest: SuggestTopicRequest = {
          industry_id: currentAccount.industry || 0,
          name: {
            en: currentAccount.customTopic,
            ar: currentAccount.customTopic
          }
        };

        submitObservable = this.addInsightStepsService.createSuggestTopic(topicRequest, this.lang)
          .pipe(
            switchMap(response => {
              // Update the knowledge request with the new topic ID
              knowledgeRequest.topic_id = response.data.topic_id;
              
              // Update account with new topic ID and clear custom topic
              this.updateAccount({
                topicId: response.data.topic_id,
                customTopic: ''
              }, true);

              return this.addInsightStepsService.step2CreateKnowledge(knowledgeRequest);
            })
          );
      } else {
        // If no customTopic, directly create knowledge
        submitObservable = this.addInsightStepsService.step2CreateKnowledge(knowledgeRequest);
      }
    }

    const submitSub = submitObservable.subscribe({
      next: (response) => {
        console.log('Knowledge processed successfully', response);
        if (!this.knowledgeId && response.data.knowledge_id) {
          this.knowledgeId = response.data.knowledge_id;
          this.updateAccount({
            knowledgeId: response.data.knowledge_id
          }, true);
        }
        this.currentStep$.next(nextStep);
        this.isLoading = false;
      },
      error: (error) => {
        this.handleServerErrors(error);
        this.isLoading = false;
      }
    });

    this.unsubscribe.push(submitSub);
  }
}
