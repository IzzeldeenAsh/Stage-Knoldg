import { Component, EventEmitter, Injector, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { BaseComponent } from 'src/app/modules/base.component';
import { Language, LanguagesService } from '../../../../_fake/services/languages-list/languages.service';
import { IndustryService } from 'src/app/_fake/services/industries/industry.service';
import { TreeNode } from 'primeng/api';
import { Topic, TopicsService } from 'src/app/_fake/services/topic-service/topic.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { EconomicBlockService, EconomicBloc } from '../../../../_fake/services/economic-block/economic-block.service';
import { Continent, Country } from 'src/app/_fake/services/region/regions.service';

@Component({
  selector: 'app-step-1',
  templateUrl: './step-1.component.html',
  styleUrl: './step-1.component.scss',
  animations: [
    trigger('fadeInMoveY', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ])
  ]
})
export class Step1Component extends BaseComponent implements OnInit {
  @Output() next = new EventEmitter<void>();
  
  form: FormGroup;
  languages: Language[] = [];
  isLoading = false;

  industryNodes: TreeNode[] = [];
  isIndustryLoading = false;

  topics: any[] = [];
  selectedTopic: Topic | null = null;

  economicBlocs: EconomicBloc[] = [];

  constructor(
    injector: Injector,
    private fb: FormBuilder,
    private languagesService: LanguagesService,
    private industryService: IndustryService,
    private topicService: TopicsService,
    private economicBlockService: EconomicBlockService
  ) {
    super(injector);
  }

  ngOnInit() {
    this.initForm();
    this.loadData();
    this.handleCategoryChanges();
  }

  /**
   * Initialize the reactive form with necessary controls and validators.
   */
  initForm() {
    this.form = this.fb.group({
      insightTitle: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      insightDescription: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      language: [null, Validators.required],
      topic: [null, Validators.required],
      customTopic: [''],
      category: ['1', Validators.required], // Represents the selected market
    });

    // Handle changes to the 'topic' field to manage 'customTopic' validators
    this.form.get('topic')?.valueChanges.subscribe(value => {
      if (value && value === 'other') {
        this.form.get('customTopic')?.setValidators([Validators.required, Validators.minLength(3), Validators.maxLength(100)]);
      } else {
        this.form.get('customTopic')?.clearValidators();
        this.form.get('customTopic')?.setValue('');
      }
      this.form.get('customTopic')?.updateValueAndValidity();
    });
  }

  onEconomicBlocksSelected(selectedBlocks: EconomicBloc[]) {
    // Handle the selected blocks as needed
    // For example, you might want to store them in a form or process them further
  }

  onRegionsSelected(selectedRegions: Continent[]) {
    // Handle the selected regions as needed
    // For example, you might want to store them in a form or process them further
  }
  onCountriesSelected(selectedCountries: Country[]) {
    // Handle the selected countries as needed
    // For example, you might want to store them in a form or process them further
  }
  /**
   * Load initial data for languages and industries.
   */
  loadData() {
    this.isLoading = true;
    forkJoin({
      languages: this.languagesService.getLanguages(this.lang),
      industries: this.industryService.getIsicCodesTree(this.lang || 'en'),
      economicBlocs: this.economicBlockService.getEconomicBlocs()
    }).subscribe({
      next: (response) => {
        this.languages = response.languages;
        this.industryNodes = response.industries;
        this.economicBlocs = response.economicBlocs;
      },
      error: (error) => {
        console.error('Error loading data:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  /**
   * Handle form submission.
   */
  submit() {
    if (this.form.valid) {
      const submissionData = {
        ...this.form.value,
        topic: this.form.value.topic.id === 'other' ? this.form.value.customTopic : this.form.value.topic
        // 'category' is included in form.value and represents the selected market
      };
      this.next.emit();
    } else {
      // Mark all controls as touched to display validation errors
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
    }
  }

  /**
   * Handle selection of an industry node.
   * @param node The selected industry node.
   */
  onIndustrySelected(node: TreeNode) {

    if (node.data && node.data.key) {
      const industryId = node.data.key;
      this.topicService.getTopicsByIndustry(industryId).subscribe({
        next: (data: Topic[]) => {
          this.topics = [...data, { id: 'other', name: 'Other' }];
          this.selectedTopic = null;
          this.form.get('topic')?.reset();
        },
        error: (error) => {
          console.error('Error fetching topics:', error);
        }
      });
    }   
  }

  /**
   * Handle selection of a topic.
   * @param topic The selected topic.
   */
  onTopicSelected(topic: Topic) {
    this.selectedTopic = topic;
    this.form.get('topic')?.setValue(topic);
  }

  /**
   * Getter to easily access the selected market.
   */
  get selectedMarket(): string | null {
    return this.form.get('category')?.value;
  }

  /**
   * Subscribe to changes in the 'category' field to perform additional actions if needed.
   */
  handleCategoryChanges() {
    this.form.get('category')?.valueChanges.subscribe(value => {

    });
  }
}
