import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ICreateKnowldege, inits } from '../create-account.helper';
import { AddInsightStepsService, CreateKnowledgeRequest, SuggestTopicRequest } from 'src/app/_fake/services/add-insight-steps/add-insight-steps.service';
import { switchMap } from 'rxjs/operators';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-horizontal',
  templateUrl: './horizontal.component.html',
  styleUrls: ['./horizontal.component.scss'],
})
export class HorizontalComponent extends BaseComponent implements OnInit {
  formsCount = 5;
  account$: BehaviorSubject<ICreateKnowldege> =
    new BehaviorSubject<ICreateKnowldege>(inits);
  currentStep$: BehaviorSubject<number> = new BehaviorSubject(1);
  isCurrentFormValid$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );

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

      // If customTopic exists, first create the topic then create knowledge
      if (currentAccount.customTopic) {
        const topicRequest: SuggestTopicRequest = {
          industry_id: currentAccount.industry || 0,
          name: {
            en: currentAccount.customTopic,
            ar: currentAccount.customTopic
          }
        };

        const submitSub = this.addInsightStepsService.createSuggestTopic(topicRequest,this.lang)
          .pipe(
            switchMap(response => {
              // Update the knowledge request with the new topic ID
              knowledgeRequest.topic_id = response.data.topic_id;
              return this.addInsightStepsService.step2CreateKnowledge(knowledgeRequest);
            })
          )
          .subscribe({
            next: (response) => {
              console.log('Knowledge created successfully', response);
              this.currentStep$.next(nextStep);
            },
            error: (error) => {
              this.handleServerErrors(error);
              // Handle error appropriately
            }
          });

        this.unsubscribe.push(submitSub);
      } else {
        // If no custom topic, directly create knowledge
        const submitSub = this.addInsightStepsService.step2CreateKnowledge(knowledgeRequest)
          .subscribe({
            next: (response) => {
              console.log('Knowledge created successfully', response);
              this.currentStep$.next(nextStep);
            },
            error: (error) => {
              // Handle error appropriately
              this.handleServerErrors(error);
            }
          });

        this.unsubscribe.push(submitSub);
      }
    } else {
      // For other steps, just proceed to next step
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
