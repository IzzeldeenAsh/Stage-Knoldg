import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ICreateKnowldege, inits } from '../create-account.helper';
import { AddInsightStepsService, CreateKnowledgeRequest, SuggestTopicRequest, AddKnowledgeDocumentRequest } from 'src/app/_fake/services/add-insight-steps/add-insight-steps.service';
import { switchMap } from 'rxjs/operators';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-horizontal',
  templateUrl: './horizontal.component.html',
  styleUrls: ['./horizontal.component.scss'],
})
export class HorizontalComponent extends BaseComponent implements OnInit {
  formsCount = 5;
  knowledgeId!: number;
  account$: BehaviorSubject<ICreateKnowldege> =
    new BehaviorSubject<ICreateKnowldege>(inits);
  currentStep$: BehaviorSubject<number> = new BehaviorSubject(4);
  isCurrentFormValid$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  isLoading = false;

  constructor(
    injector: Injector,
    private addInsightStepsService: AddInsightStepsService
  ) {
    super(injector);
  }

  ngOnInit(): void {}

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
        region: currentAccount.regions || [],
        country: currentAccount.countries || [],
        economic_block: currentAccount.economic_block || []
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
    } else if (this.currentStep$.value === 3) {
      this.isLoading = true;
      const currentAccount = this.account$.value;

      // Optional safeguard: ensure we have knowledgeId from step 2
      if (!this.knowledgeId) {
        console.error('No knowledge ID found. Please complete step 2 first.');
        return;
      }

      // Check whether we have existing documents (to decide isUpdate)
      const listDocs$ = this.addInsightStepsService
        .getListDocumentsInfo(this.knowledgeId);

      const step3Sub = listDocs$
        .pipe(
          switchMap((listResponse) => {
            const documents = listResponse.data || [];
            const isUpdate = documents.length > 0;
            const documentId = documents.length > 0 ? documents[0].id : null; // Get the first document's ID
            const table_of_content = JSON.parse(currentAccount.table_of_content);
            const chaptersArray = table_of_content.chapters;

            // **Reshape the chaptersArray to the desired structure**
            const transformedChapters = chaptersArray.map((chapter: any) => ({
              chapter: {
                title: chapter.name,
                page: chapter.index.toString(),
                sub_child: chapter.subChapters.map((sub: any) => ({
                  title: sub.name,
                  page: sub.index.toString(),
                })),
              },
            }));

            const jsonChapters = JSON.stringify(transformedChapters);

            // Construct your AddKnowledgeDocumentRequest
            const documentRequest: AddKnowledgeDocumentRequest = {
              file_name: currentAccount.file_name,
              table_of_content: jsonChapters,
              price: currentAccount.price?.toString() || '0',
              file: currentAccount.file,
              status: currentAccount.status || 'active',
            };
            return this.addInsightStepsService.step3AddKnowledgeDocument(
              isUpdate ? (documentId || this.knowledgeId) : this.knowledgeId, // Use documentId if updating and not null, otherwise use knowledgeId
              documentRequest,
              isUpdate
            );
          })
        )
        .subscribe({
          next: (response) => {
            console.log('Document processed successfully', response);
            this.currentStep$.next(nextStep);
            this.isLoading = false;
          },
          error: (error) => {
            this.handleServerErrors(error);
            this.isLoading = false;
          }
        });

      this.unsubscribe.push(step3Sub);
    } else {
      // For other steps, just proceed without loading state
      this.currentStep$.next(nextStep);
    }
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
}
