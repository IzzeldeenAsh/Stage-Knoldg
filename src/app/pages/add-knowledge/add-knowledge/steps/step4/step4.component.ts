import { Component, Injector, Input, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Subscription, forkJoin, of, delay, finalize, interval, timer, takeWhile, takeUntil, Subject } from 'rxjs';
import { ICreateKnowldege } from '../../create-account.helper';
import { BaseComponent } from 'src/app/modules/base.component';
import { LanguagesService, Language } from 'src/app/_fake/services/languages-list/languages.service';
import { TranslationService } from 'src/app/modules/i18n/translation.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { IndustryService } from 'src/app/_fake/services/industries/industry.service';
import { TreeNode } from 'primeng/api';
import { Topic, TopicsService } from 'src/app/_fake/services/topic-service/topic.service';
import { EconomicBloc } from 'src/app/_fake/services/economic-block/economic-block.service';
import { IsicCodesService } from 'src/app/_fake/services/isic-code/isic-codes.service';
import { TagsService } from 'src/app/_fake/services/tags/tags.service';
import { KnowledgeService } from 'src/app/_fake/services/knowledge/knowledge.service';
import { AddInsightStepsService } from 'src/app/_fake/services/add-insight-steps/add-insight-steps.service';
import { RegionsService } from 'src/app/_fake/services/region/regions.service';

interface KeywordItem {
  display: string;
  value: string;
}

interface TagItem {
  display: string;
  value: string;
  id?: number;
}

@Component({
  selector: 'app-step4',
  templateUrl: './step4.component.html',
  styleUrls: ['./step4.component.scss'],
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
export class Step4Component extends BaseComponent implements OnInit {
  @Input('updateParentModel') updateParentModel: (
    part: Partial<ICreateKnowldege>,
    isFormValid: boolean
  ) => void;
  
  @Input() defaultValues: Partial<ICreateKnowldege>;
  
  // Flag to determine if we're in edit mode
  isEditMode = false;
  
  form: FormGroup;
  isLoading = false;
  isDescriptionLoading = false;
  isLanguageLoading = false;

  // Combined loading state for easier template binding
  get isLanguageFieldLoading(): boolean {
    return this.isLanguageLoading || this.isDescriptionLoading;
  }
  
  // Language related properties
  languages: Language[] = [];
  currentLang: string = 'en';
  
  // Industry related properties
  industryNodes: TreeNode[] = [];
  selectedIndustryId: number = 0;
  
  // Topic related properties
  topics: any[] = [];
  selectedTopic: Topic | null = null;
  private topicNames: string[] = [];
  
  // Target market properties
  marketOptions = [
    {
      label: 'Region',
      value: '1',
      icon: 'ki-duotone ki-globe fs-1',
      description: 'Group of countries that share similar cultural and social characteristics.'
    },
    {
      label: 'Economic Block',
      value: '2',
      icon: 'ki-duotone ki-chart fs-1',
      description: 'Group of countries that share similar economic characteristics.'
    }
  ];
  
  // ISIC and HS code properties
  isicCodeNodes: TreeNode[] = [];
  hsCodeNodes: TreeNode[] = [];
  selectedIsicId: number = 0;
  
  // Tags related properties
  tags: { id: number; name: string }[] = [];
  availableTags: TagItem[] = [];
  tagIdError: string = '';
  
  // Keywords related properties
  availableKeywords: KeywordItem[] = [];

  @ViewChild('regionSelector') regionSelector: any;
  @ViewChild('economicBlockSelector') economicBlockSelector: any;

  aiAbstractError = false;

  // Animation control properties
  typingSpeed = 10; // ms per character
  animationTimers: any;
  animatedAbstract = false;
  animatedAbstractText = '';
  animatedAbstractComplete = false;
  showEditor = false;
  private stopPolling$ = new Subject<void>();

  // Add tracking for AI-generated fields
  aiGeneratedFields: Record<string, boolean> = {
    title: false,
    description: false,
    industry: false,
    language: false
  };

  constructor(
    injector: Injector,
    private fb: FormBuilder,
    public languagesService: LanguagesService,
    private topicService: TopicsService,
    private translationService: TranslationService,
    private industryService: IndustryService,
    private isicCodeService: IsicCodesService,
    private tagsService: TagsService,
    private knowledgeService: KnowledgeService,
    private addInsightStepsService: AddInsightStepsService,
    private cdr: ChangeDetectorRef,
    private regionsService: RegionsService
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.currentLang = this.translationService.getSelectedLanguage();
    
    // Initialize form
    this.initForms();
    
    // Set up field change listeners
    this.setupFieldChangeListeners();
    
    // Set up conditional validators
    this.setupConditionalValidators();
    
    // Load initial data
    this.loadData();
    
    // Check if worldwide is initially selected and update regions
    if (this.isWorldwide()) {
      this.updateForWorldwide();
    }
    
    // Fetch industry nodes
    this.industryService.getIndustryList().subscribe({
      next: (response: any) => {
        this.industryNodes = response;
      }
    });
    
    // Set edit mode flag if we have a knowledge ID AND existing content (like title/description)
    // This distinguishes between editing an existing document vs a newly uploaded document with an ID
    this.isEditMode = !!this.defaultValues.knowledgeId && 
                     (!!this.defaultValues.title || !!this.defaultValues.description);
    
    if (this.defaultValues.industry) {
      this.selectedIndustryId = this.defaultValues.industry;
      this.getTopics(this.defaultValues.industry);
    }
    
    if (this.defaultValues.knowledgeId) {
      this.fetchKnowledgeData(this.defaultValues.knowledgeId);
      // Only generate AI information when not in edit mode
      if (!this.isEditMode) {
        this.generateAIInformation();
      } else {
        // In edit mode, simply show the editor
        this.showEditor = true;
      }
    }
    
    // Subscribe to form value changes to update parent model with validation status
    this.form.valueChanges.subscribe(() => {
      if (this.updateParentModel) {
        this.updateParentModel({}, this.checkForm());
      }
    });
    
    // Subscribe to language changes
    const langChangeSub = this.translationService.onLanguageChange().subscribe(lang => {
      if (lang) {
        this.currentLang = lang;
        this.loadData();
      }
    });
    this.unsubscribe.push(langChangeSub);
    
    // Subscribe to language service loading state
    this.languagesService.isLoading$.subscribe(isLoading => {
      this.isLanguageLoading = isLoading;
    });
    

  }
  
  private initForms() {
    // Initialize main form
    this.form = this.fb.group({
      title: [this.defaultValues.title, [Validators.required]],
      description: [this.defaultValues.description, [Validators.required]],
      language: [this.defaultValues.language, [Validators.required]],
      industry: [this.defaultValues.industry, [Validators.required]],
      topicId: [this.defaultValues.topicId, [Validators.required]],
      customTopic: [this.defaultValues.customTopic],
      targetMarket: [this.defaultValues.targetMarket || '1', [Validators.required]],
      economicBlocks: [this.defaultValues.economic_blocs || []],
      regions: [this.defaultValues.regions || []],
      countries: [this.defaultValues.countries || []],
      isic_code: [this.defaultValues.isic_code],
      hs_code: [this.defaultValues.hs_code],
      tag_ids: [this.defaultValues.tag_ids || [], [Validators.required]],
      tagItems: [[]],  // New control for tag-input component
      keywords: [this.defaultValues.keywords || []]
    });
    
    // Setup form change subscription
    const formChangesSubscr = this.form.valueChanges.subscribe((val) => {
      this.updateParentModel(val, this.checkForm());
    });
    this.unsubscribe.push(formChangesSubscr);
    
    // Setup conditional validators
    this.setupConditionalValidators();
    
    // Set initial values
    if (this.defaultValues.industry) {
      this.selectedIndustryId = this.defaultValues.industry;
    }
    if (this.defaultValues.isic_code) {
      this.selectedIsicId = this.defaultValues.isic_code;
    }

    // For worldwide target market, get all region IDs
    this.updateForWorldwide();
  }
  
  private setupConditionalValidators() {
    const regionsControl = this.form.get('regions');
    const countriesControl = this.form.get('countries');
    const economicBlocksControl = this.form.get('economicBlocks');
    const topicIdControl = this.form.get('topicId');
    const customTopicControl = this.form.get('customTopic');
    
    // Custom validator for regions/countries
    this.regionsCountriesValidator = () => {
      const targetMarket = this.form.get('targetMarket')?.value;
      if (targetMarket === '1' || targetMarket === '4') { // Regions or Countries selected
        const regionsValue = this.form.get('regions')?.value;
        const countriesValue = this.form.get('countries')?.value;
        
        const regionsSelected = regionsValue && regionsValue.length > 0;
        const countriesSelected = countriesValue && countriesValue.length > 0;
        
        return regionsSelected || countriesSelected ? null : { required: true };
      }
      return null;
    };
    
    // Custom validator for economic blocks
    this.economicBlocksValidator = () => {
      const blocks = this.form.get('economicBlocks')?.value || [];
      return blocks.length > 0 ? null : { required: true };
    };
    
    // Setup target market change listener
    this.form.get('targetMarket')?.valueChanges.subscribe(value => {
      // Reset regions and countries values when target market changes
      regionsControl?.setValue([]);
      countriesControl?.setValue([]);

      if (value === '1') {
        regionsControl?.setValidators([this.regionsCountriesValidator]);
        countriesControl?.clearValidators();
        economicBlocksControl?.clearValidators();
        
        regionsControl?.updateValueAndValidity();
        countriesControl?.updateValueAndValidity();
        economicBlocksControl?.updateValueAndValidity();
        
        this.updateParentModel({ 
          economic_blocs: [],
          regions: [],
          countries: [] 
        }, this.checkForm());
        
        // Open region dialog with a slight delay to ensure component is rendered
        setTimeout(() => {
          if (this.regionSelector) {
            this.regionSelector.showDialog();
          }
        }, 100);
      } else if (value === '4') {
        // Countries only option
        countriesControl?.setValidators([this.regionsCountriesValidator]);
        regionsControl?.clearValidators();
        economicBlocksControl?.clearValidators();
        
        countriesControl?.updateValueAndValidity();
        regionsControl?.updateValueAndValidity();
        economicBlocksControl?.updateValueAndValidity();
        
        this.updateParentModel({ 
          economic_blocs: [],
          regions: [], 
          countries: [] 
        }, this.checkForm());
        
        // Open region dialog (countries tab) with a slight delay
        setTimeout(() => {
          if (this.regionSelector) {
            this.regionSelector.showDialog();
          }
        }, 100);
      } else if (value === '2') {
        economicBlocksControl?.setValidators([this.economicBlocksValidator]);
        regionsControl?.clearValidators();
        countriesControl?.clearValidators();
        
        economicBlocksControl?.updateValueAndValidity();
        regionsControl?.updateValueAndValidity();
        countriesControl?.updateValueAndValidity();
        
        // Don't reset economic blocks if we have preselected values
        if (!this.defaultValues.economic_blocs || this.defaultValues.economic_blocs.length === 0) {
          economicBlocksControl?.setValue([]);
        } else {
          // Set the preselected economic blocks
          economicBlocksControl?.setValue(this.defaultValues.economic_blocs);
        }
        
        this.updateParentModel({ 
          regions: [], 
          countries: [],
          economic_blocs: this.defaultValues.economic_blocs || [] 
        }, this.checkForm());
        
        // Only open dialog if no preselected values
        if (!this.defaultValues.economic_blocs || this.defaultValues.economic_blocs.length === 0) {
          // Open economic blocks dialog with a slight delay to ensure component is rendered
          setTimeout(() => {
            if (this.economicBlockSelector) {
              this.economicBlockSelector.showDialog();
            }
          }, 100);
        }
      } else if (value === '3') {
        // Worldwide option - clear all validators and data
        regionsControl?.clearValidators();
        countriesControl?.clearValidators();
        economicBlocksControl?.clearValidators();
        
        regionsControl?.updateValueAndValidity();
        countriesControl?.updateValueAndValidity();
        economicBlocksControl?.updateValueAndValidity();
        
        // Use the updateForWorldwide method to handle worldwide selection
        this.updateForWorldwide();
      }
    });
    
    // Set initial validators based on current target market
    const currentTargetMarket = this.form.get('targetMarket')?.value;
    if (currentTargetMarket === '1') {
      regionsControl?.setValidators([this.regionsCountriesValidator]);
    } else if (currentTargetMarket === '2') {
      economicBlocksControl?.setValidators([this.economicBlocksValidator]);
    }
    // If value is '3' (Worldwide), no validators are needed
    
    // Topic ID change listener for custom topic
    topicIdControl?.valueChanges.subscribe(value => {
      if (value === 'other') {
        customTopicControl?.setValidators([
          Validators.required,
          this.duplicateTopicValidator()
        ]);
      } else {
        customTopicControl?.clearValidators();
      }
      customTopicControl?.updateValueAndValidity();
    });
    
    // Update validity of all controls
    regionsControl?.updateValueAndValidity();
    countriesControl?.updateValueAndValidity();
    economicBlocksControl?.updateValueAndValidity();
  }
  
  private loadData() {
    this.isLoading = true;
    const dataSub = forkJoin({
      industries: this.industryService.getIsicCodesTree(this.currentLang),
      languages: this.languagesService.getLanguages(this.currentLang),
      isicCodes: this.isicCodeService.getIsicCodesTree(this.currentLang)
    }).subscribe({
      next: (response) => {
        this.industryNodes = response.industries;
        this.languages = response.languages;
        this.isicCodeNodes = response.isicCodes;
        this.fetchTags();
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
    this.unsubscribe.push(dataSub);
  }
  
  private fetchKnowledgeData(knowledgeId: number) {
    this.knowledgeService.getKnowledgeById(knowledgeId).subscribe({
      next: (response) => {
        const knowledge = response.data;
        
        if (knowledge.tags) {
          this.defaultValues.tag_ids = knowledge.tags.map(tag => tag.id);
        }
        if (knowledge.keywords) {
          // Convert string keywords to KeywordItem format
          this.defaultValues.keywords = knowledge.keywords.map(keyword => ({
            display: keyword,
            value: keyword
          }));
        }
        
        // Update form controls
        this.form.get('tag_ids')?.setValue(this.defaultValues.tag_ids || []);
        this.form.get('keywords')?.setValue(this.defaultValues.keywords || []);
        
        this.cdr.detectChanges();
        // Initialize tags if topic is selected
        const topicId = this.form.get('topicId')?.value;
        if (topicId && topicId !== 'other') {
          this.fetchTagsByTopic(topicId);
          this.fetchSuggestedKeywordsByTopic(topicId);
        }
      },
      error: (error) => {
        console.error("Error fetching knowledge data:", error);
      },
    });
  }
  
  // Form validation
  checkForm() {
    const targetMarket = this.form.get('targetMarket')?.value;
    const regions = this.form.get('regions')?.value || [];
    const countries = this.form.get('countries')?.value || [];
    const economicBlocks = this.form.get('economicBlocks')?.value || [];
    const keywords = this.form.get('keywords')?.value || [];
    
    // Check target market specific validation
    let targetMarketValid = false;
    if (targetMarket === '1') {
      targetMarketValid = regions.length > 0 || countries.length > 0;
    } else if (targetMarket === '4') {
      // For countries-only option, only validate countries
      targetMarketValid = countries.length > 0;
    } else if (targetMarket === '2') {
      targetMarketValid = economicBlocks.length > 0;
    } else if (targetMarket === '3') {
      // Worldwide option is always valid for target market validation
      targetMarketValid = true;
    }
    
    // Check all other form controls and keyword requirement
    const otherControlsValid = Object.keys(this.form.controls)
      .filter(key => !['regions', 'countries', 'economicBlocks', 'keywords'].includes(key))
      .every(key => !this.form.get(key)?.errors);
    
    return targetMarketValid && otherControlsValid && keywords.length > 0;
  }
  
  /**
   * Validates the knowledge information form and marks fields with errors
   * Ensures error messages are displayed even if fields have not been touched
   * @returns boolean indicating whether the form is valid
   */
  validateForm(): boolean {
    // Mark all form controls as touched to trigger validation messages
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });

    // Special validation for regions/countries based on target market
    const targetMarket = this.form.get('targetMarket')?.value;
    if (targetMarket === '1') {
      const regions = this.form.get('regions')?.value || [];
      const countries = this.form.get('countries')?.value || [];
      
      if (regions.length === 0 && countries.length === 0) {
        // Apply custom validation error
        this.form.get('regions')?.setErrors({ required: true });
        this.form.get('countries')?.setErrors({ required: true });
      }
    } else if (targetMarket === '2') {
      const economicBlocks = this.form.get('economicBlocks')?.value || [];
      
      if (economicBlocks.length === 0) {
        // Apply custom validation error
        this.form.get('economicBlocks')?.setErrors({ required: true });
      } else {
        // Clear error if we have economic blocks selected
        this.form.get('economicBlocks')?.setErrors(null);
      }
    }
    // For targetMarket === '3' (Worldwide), no special validation needed

    // Special validation for keywords
    const keywords = this.form.get('keywords')?.value || [];
    if (keywords.length === 0) {
      this.form.get('keywords')?.setErrors({ required: true });
    }

    // Update the parent model with the current form validity
    if (this.updateParentModel) {
      this.updateParentModel({}, this.checkForm());
    }

    return this.form.valid && this.checkForm();
  }
  
  // Custom Validator for Topic
  private duplicateTopicValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const enteredTopic = control.value.trim().toLowerCase();
      const exists = this.topicNames.includes(enteredTopic);
      return exists ? { duplicateTopic: true } : null;
    };
  }
  
  // Industry related methods
  onIndustrySelected(node: TreeNode) {
    // Handle clear selection
    if (!node.data || node.data.key === null || node.data.key === undefined) {
      this.form.get('industry')?.setValue(null);
      this.selectedIndustryId = 0;
      this.topics = [];
      this.clearTagsAndKeywords();
      return;
    }
    
    this.form.get('industry')?.setValue(node.data.key);
    this.selectedIndustryId = node.data.key;
    
    // If user manually selected industry, it's no longer AI generated
    if (this.aiGeneratedFields.industry) {
      this.aiGeneratedFields.industry = false;
    }
    
    if (node.data && node.data.key) {
      this.getTopics(node.data.key);
      // Clear tags and keywords when industry changes
      this.clearTagsAndKeywords();
    }
  }
  
  private getTopics(industryId: number) {
    this.topicService.getTopicsByIndustry(industryId).subscribe({
      next: (data: Topic[]) => {
        this.topics = [...data, { id: 'other', name: 'Other' }];
        // Store trimmed and lowercased topic names for validation
        this.topicNames = data.map(topic => topic.name.trim().toLowerCase());
        this.selectedTopic = null;
        if (this.selectedIndustryId && this.defaultValues.topicId) {
          this.form.get('topicId')?.setValue(this.defaultValues.topicId);
        } else {
          this.form.get('topicId')?.reset();
        }
      },
      error: (error) => {
        console.error('Error fetching topics:', error);
      }
    });
  }
  
  onTopicSelected(topicId: any) {
    const customTopicControl = this.form.get('customTopic');

    if (topicId === 'other') {
      // If "Other" is selected, validate the custom topic input
      if (customTopicControl?.value) {
        const enteredTopic = customTopicControl.value.trim().toLowerCase();
        if (this.topicNames.includes(enteredTopic)) {
          customTopicControl.setErrors({ duplicateTopic: true });
          return;
        }
      }
    }

    this.form.get('topicId')?.setValue(topicId);
    
    // Clear existing tags and keywords immediately when topic changes
    this.form.get('tagItems')?.setValue([]);
    this.form.get('tag_ids')?.setValue([]);
    this.form.get('keywords')?.setValue([]);
    this.availableTags = [];
    this.availableKeywords = [];
    
    // Fetch tags and keywords based on the new topic
    if (topicId && topicId !== 'other') {
      // fetchTagsByTopic will auto-select all tags
      this.fetchTagsByTopic(topicId);
      this.fetchSuggestedKeywordsByTopic(topicId);
    }
    
    this.updateParentModel({ topicId: topicId, tag_ids: [], keywords: [] }, this.checkForm());
  }
  
  // Target market related methods
  /**
   * Handles the selection of regions and countries
   */
  onRegionsSelected(regions: any) {
    // Get the current target market selection (1=Regions, 4=Countries, 2=Economic blocks, 3=Worldwide)
    const targetMarket = this.form.get('targetMarket')?.value;

    // Remove duplicates from the incoming data
    const uniqueRegions = regions.regions ? [...new Set(regions.regions)] : [];
    const uniqueCountries = regions.countries ? [...new Set(regions.countries)] : [];

    if (targetMarket === '1') {
      // Regions only - set regions and clear countries
      this.form.patchValue({
        regions: uniqueRegions,
        countries: []
      });
      
      // Update parent model for regions only
      this.updateParentModel(
        { 
          regions: uniqueRegions, 
          countries: [] 
        }, 
        this.checkForm()
      );
    } else if (targetMarket === '4') {
      // Countries only - set countries and clear regions
      this.form.patchValue({
        regions: [],
        countries: uniqueCountries
      });
      
      // Update parent model for countries only
      this.updateParentModel(
        { 
          regions: [], 
          countries: uniqueCountries 
        }, 
        this.checkForm()
      );
    } else {
      // For other cases (shouldn't happen with current logic), set both
      this.form.patchValue({
        regions: uniqueRegions,
        countries: uniqueCountries
      });
      
      // Update parent model
      this.updateParentModel(
        { 
          regions: uniqueRegions, 
          countries: uniqueCountries 
        }, 
        this.checkForm()
      );
    }

    // Trigger validation
    this.form.get('regions')?.updateValueAndValidity();
    this.form.get('countries')?.updateValueAndValidity();
  }
  
  onEconomicBlocksSelected(blocks: EconomicBloc[]) {
    const selectedBlocks = blocks.map(block => block.id);
    this.form.get('economicBlocks')?.setValue(selectedBlocks);
    // Force validation check
    this.form.get('economicBlocks')?.updateValueAndValidity();
    this.updateParentModel({ economic_blocs: selectedBlocks }, this.checkForm());
  }
  
  // Worldwide helper methods
  isWorldwide(): boolean {
    return this.form.get('targetMarket')?.value === '3';
  }
  
  updateForWorldwide() {
    if (this.isWorldwide()) {
      // Reset regions and countries fields to empty
      this.form.patchValue({
        regions: [],
        countries: [],
        economicBlocks: []
      });
      // Set these fields as valid since worldwide is selected
      this.form.get('regions')?.setErrors(null);
      this.form.get('countries')?.setErrors(null);
      this.form.get('economicBlocks')?.setErrors(null);
      
      // Get all region IDs if the targetMarket is worldwide
      this.regionsService.getAllRegionIds().subscribe((allRegionIds: number[]) => {
        this.form.patchValue({
          regions: allRegionIds
        });
        // Update the parent model with all regions
        this.checkForm();
      });
    }
  }
  
  // ISIC and HS code methods
  onIsicCodeSelected(node: any) {
    // Handle clear selection
    if (!node.data || node.data.key === null || node.data.key === undefined) {
      this.selectedIsicId = 0;
      this.form.get('isic_code')?.setValue(null);
      this.form.get('hs_code')?.setValue(null); // Clear HS code when ISIC is cleared
      this.updateParentModel({ isic_code: null, hs_code: null }, this.checkForm());
      return;
    }
    
    this.selectedIsicId = node.data.key;
    this.form.get('isic_code')?.setValue(node.data.key);
    this.updateParentModel({ isic_code: node.data.key }, this.checkForm());
  }
  
  onHSCodeSelected(node: any) {
    // Handle clear selection
    if (!node || node.id === null || node.id === undefined) {
      this.form.get('hs_code')?.setValue(null);
      this.updateParentModel({ hs_code: null }, this.checkForm());
      return;
    }
    
    this.form.get('hs_code')?.setValue(node.id);
    this.updateParentModel({ hs_code: node.id }, this.checkForm());
  }
  
  // Tags related methods
  private fetchTags() {
    // Only fetch tags if a topic is selected
    const topicId = this.form.get('topicId')?.value;
    if (this.defaultValues.industry && topicId && topicId !== 'other') {
      this.fetchTagsByTopic(topicId);
    }
  }
  
  private fetchTagsByTopic(topicId: number | string) {
    if (!this.defaultValues.industry) return;
    
    // Call the new topic-specific method in TagsService
    this.tagsService
      .getTagsByTopic(this.defaultValues.industry, topicId, this.currentLanguage)
      .subscribe({
        next: (tags: { id: number; name: string }[]) => {
          this.tags = tags;
          
          // Convert tags to the format expected by tag-input
          this.availableTags = this.tags.map((tag) => ({
            display: tag.name,
            value: tag.name,
            id: tag.id
          }));
          
          // Important: Auto-select ALL tags when they are fetched
          if (this.availableTags.length > 0) {
            // Set all tags as selected in the tagItems control
            this.form.get('tagItems')?.setValue([...this.availableTags]);
            
            // Also update the tag_ids control with all tag IDs
            const allTagIds = this.availableTags.map(tag => tag.id as number);
            this.form.get('tag_ids')?.setValue(allTagIds);
            
            // Update parent model with all tags selected
            this.updateParentModel({ tag_ids: allTagIds }, this.checkForm());
          } else {
            // If no tags are available, clear the selection
            this.form.get('tagItems')?.setValue([]);
            this.form.get('tag_ids')?.setValue([]);
            this.updateParentModel({ tag_ids: [] }, this.checkForm());
          }
        },
        error: (error) => {
          console.error("Error fetching tags by topic:", error);
        },
      });
  }
  
  addTag(event: any): void {
    const tagValue = typeof event.value === 'string' ? event.value : event.value?.value;
    if (!tagValue?.trim()) return;
    
    // Check if this is one of our existing tags
    const existingTag = this.availableTags.find(t => t.value === tagValue);
    let tagId: number | undefined;
    
    if (existingTag && existingTag.id) {
      // This is an existing tag, use its ID
      tagId = existingTag.id;
    } else {
      // This is a new custom tag, need to create it on the server
      this.createNewTag(tagValue);
      return; // The update will happen after the tag is created
    }
    
    // Update tag_ids form control
    this.updateTagIds(tagId);
  }
  
  removeTag(event: any): void {
    const removedTagValue = typeof event.value === 'string' ? event.value : event.value?.value;
    if (!removedTagValue) return;
    
    // Find the tag ID from available tags
    const removedTag = this.availableTags.find(t => t.value === removedTagValue);
    if (!removedTag || !removedTag.id) return;
    
    // Get current tag IDs and remove the one that was removed
    const currentTagIds = this.form.get('tag_ids')?.value || [];
    const updatedTagIds = currentTagIds.filter((id: number) => id !== removedTag.id);
    
    // Update the tag_ids form control
    this.form.patchValue({ tag_ids: updatedTagIds });
    this.updateParentModel({ tag_ids: updatedTagIds }, this.checkForm());
  }
  
  /**
   * Create a new custom tag
   * @param tagName The name of the new tag
   */
  private createNewTag(tagName: string): void {
    if (!this.defaultValues.industry) {
      this.showError('', 'Industry must be selected before adding custom tags');
      return;
    }
    
    const tagRequest = {
      industry_id: this.defaultValues.industry,
      name: {
        en: tagName,
        ar: tagName,
      },
    } as const;

    this.tagsService.createSuggestTag(tagRequest).subscribe({
      next: (response) => {
        const newTagId = response.data.tag_id;
        
        // Add new tag to available tags
        this.availableTags.push({
          display: tagName,
          value: tagName,
          id: newTagId
        });
        
        // Update tag_ids form control
        this.updateTagIds(newTagId);
        
        // Show success message
        this.showSuccess('', 'Custom tag added successfully');
      },
      error: (error) => {
        this.handleServerErrors(error);
      },
    });
  }
  
  /**
   * Update tag_ids form control when a tag is added or removed
   * @param tagId The tag ID to add (if adding a tag)
   */
  private updateTagIds(tagId?: number): void {
    if (!tagId) return;
    
    // Get current tag IDs
    const currentTagIds = this.form.get('tag_ids')?.value || [];
    
    // Add new tag ID if it doesn't already exist
    if (!currentTagIds.includes(tagId)) {
      const updatedTagIds = [...currentTagIds, tagId];
      this.form.patchValue({ tag_ids: updatedTagIds });
      this.updateParentModel({ tag_ids: updatedTagIds }, this.checkForm());
    }
  }
  
  // Keywords related methods
  private fetchSuggestedKeywords() {
    const topicId = this.form.get('topicId')?.value;
    if (this.defaultValues.knowledgeId && topicId && topicId !== 'other') {
      this.fetchSuggestedKeywordsByTopic(topicId);
    }
  }
  
  private fetchSuggestedKeywordsByTopic(topicId: number | string) {
    if (!this.defaultValues.knowledgeId) return;

    // Call the new method in TagsService
    this.tagsService.getSuggestKeywordsByTopic(this.defaultValues.knowledgeId!, topicId, this.currentLanguage)
      .subscribe({
        next: (keywords: string[]) => {
          // Convert suggested keywords to KeywordItem format
          this.availableKeywords = keywords.map((keyword: string) => ({
            display: keyword,
            value: keyword
          }));
          
          // Set availableKeywords as default values for the keywords form control
          // Only set if the form control is empty or not set
          const currentKeywords = this.form.get('keywords')?.value || [];
          if (currentKeywords.length === 0) {
            this.form.get('keywords')?.setValue(this.availableKeywords);
            
            // Update parent model
            this.updateParentModel(
              { keywords: this.availableKeywords },
              this.checkForm()
            );
          }
        },
        error: (error: any) => {
          console.error("Error fetching suggested keywords:", error);
          this.handleServerErrors(error);
        }
      });
  }
  
  addKeyword(event: any) {
    const value = typeof event.value === 'string' ? event.value : event.value?.value;
    if (!value?.trim()) return;

    // Create keyword item
    const newKeyword: KeywordItem = {
      display: value.trim(),
      value: value.trim()
    };

    // Get current keywords
    const currentKeywords: KeywordItem[] = this.form.get('keywords')?.value || [];

    // Check if keyword already exists
    if (!currentKeywords.some(k => k.value === newKeyword.value)) {
      const updatedKeywords = [...currentKeywords, newKeyword];
      
      // Update form
      this.form.get('keywords')?.setValue(updatedKeywords);
      
      // Update parent
      this.updateParentModel(
        { keywords: updatedKeywords },
        this.checkForm()
      );
    }
  }
  
  removeKeyword(event: any) {
    const removedKeyword = event.removed;
    if (!removedKeyword) return;

    const currentKeywords: KeywordItem[] = this.form.get('keywords')?.value || [];
    
    // Remove the keyword
    const updatedKeywords = currentKeywords.filter(keyword => 
      keyword.value !== (typeof removedKeyword === 'string' ? removedKeyword : removedKeyword.value)
    );

    // Update form
    this.form.get('keywords')?.setValue(updatedKeywords);
    
    // Update parent
    this.updateParentModel(
      { keywords: updatedKeywords },
      this.checkForm()
    );
  }
  
  // Helper methods
  private handleServerErrors(error: any) {
    // Reset all error messages first
    this.tagIdError = '';
    
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          
          // Handle specific field errors
          if (key === 'tag_ids') {
            this.tagIdError = messages.join(', ');
            // Mark the tag_ids field as touched to show validation error
            this.form.get('tag_ids')?.markAsTouched();
          } else if (key === 'language') {
            // Special handling for language errors
            this.showError('Language Error', messages.join(', '));
            // Mark the language field as touched to show validation error
            this.form.get('language')?.markAsTouched();
          } else {
            // Show general error toast for other fields
            this.showError(key.charAt(0).toUpperCase() + key.slice(1) + ' Error', messages.join(', '));
          }
        }
      }
    } else if (error.error && error.error.message) {
      // Handle case where error has a single message
      this.showError('Error', error.error.message);
    } else {
      this.showError('Error', 'An unexpected error occurred.');
    }
  }
  
  
  // Show editor after animated abstract is displayed
  showDescriptionEditor(): void {
    // Enable the form control first
    const descriptionControl = this.form.get('description');
    if (descriptionControl) {
      descriptionControl.enable();
    }
    
    // Show the editor
    this.showEditor = true;
    this.cdr.detectChanges();
  }
  
  // Start typing animation for abstract
  startTypingAnimation(text: string): void {
    if (!text) return;
    
    const chars = text.length;
    let currentPos = 0;
    this.animatedAbstractComplete = false;
    
    // Clear any existing animation timer
    if (this.animationTimers) {
      clearInterval(this.animationTimers);
    }
    
    // Start animation interval
    this.animationTimers = setInterval(() => {
      if (currentPos < chars) {
        // Add next character to the animated text
        this.animatedAbstractText = text.substring(0, currentPos + 1);
        currentPos++;
      } else {
        // Animation complete
        clearInterval(this.animationTimers);
        this.animatedAbstractComplete = true;
        // Don't automatically show editor - user must click Edit button
        this.cdr.detectChanges();
      }
    }, this.typingSpeed);
  }
  
  // Getter for economic bloc IDs
  get selectedEconomicBlocIds(): number[] {
    const result = this.defaultValues.economic_blocs || [];
    console.log('Step4 selectedEconomicBlocIds getter - returning:', result);
    return result;
  }
  
  // Getter for language
  get currentLanguage(): string {
    return this.currentLang;
  }
  
  // Clear tags and keywords
  private clearTagsAndKeywords() {
    this.tags = [];
    this.availableTags = [];
    this.availableKeywords = [];
    this.form.get('tag_ids')?.setValue([]);
    this.form.get('tagItems')?.setValue([]);
    this.form.get('keywords')?.setValue([]);
    this.updateParentModel({ 
      tag_ids: [], 
      keywords: [] 
    }, this.checkForm());
  }

  generateAIDescription(): void {
    // Always allow AI generation regardless of having an ID
    // The content check above will properly handle true edit mode cases
    this.generateAIInformation();
  }
  
  // Simplified method to generate AI information
  private generateAIInformation(): void {
    if (!this.defaultValues.knowledgeId) {
      // If no knowledge ID, just show the editor
      this.showEditor = true;
      return;
    }
    
    // Set loading state
    this.isDescriptionLoading = true;
    this.showEditor = false;
    this.aiAbstractError = false;
    
    // Clear any previous timers
    if (this.stopPolling$) {
      this.stopPolling$.next();
      this.stopPolling$.complete();
    }
    this.stopPolling$ = new Subject<void>();
    
    // Time tracking
    const startTime = Date.now();
    const maxDuration = 25000; // 20 seconds
    const pollInterval = 2000; // 2 seconds
    let hasReceivedData = false;
    
    // Start polling timer - this will execute every 2 seconds
    const polling = interval(pollInterval).pipe(
      takeWhile(() => (Date.now() - startTime) < maxDuration), // Run for 20 seconds max
      takeUntil(this.stopPolling$) // Or until manually stopped
    ).subscribe(() => {
      // Only make API call if we haven't received data yet
      if (!hasReceivedData) {
        console.log(`Polling API at ${new Date().toISOString()} - ${Math.floor((Date.now() - startTime) / 1000)}s elapsed`);
        
        // Make API call
        this.addInsightStepsService.getKnowledgeParserData(this.defaultValues.knowledgeId as number)
          .subscribe({
            next: (response) => {
              console.log('API Response:', response);
              
              // Check if we have valid data - use type assertion to fix TypeScript errors
              const responseData = response?.data as any;
              const hasValidData = responseData && (
                (responseData.abstract && responseData.abstract.trim().length > 0)
              );
              
              if (hasValidData) {
                console.log('Valid data received, stopping poll');
                hasReceivedData = true;
                
                // Update the form with received data
                this.updateFormWithAIData(responseData);
                
                // Stop polling since we have data
                if (this.stopPolling$) {
                  this.stopPolling$.next();
                }
              } else {
                console.log('No valid data yet, continuing to poll');
              }
            },
            error: (error) => {
              console.error('API error:', error);
              // Continue polling on error
            }
          });
      }
    });
    
    // Run initial API call immediately
    console.log(`Initial API call at ${new Date().toISOString()}`);
    this.addInsightStepsService.getKnowledgeParserData(this.defaultValues.knowledgeId as number)
      .subscribe({
        next: (response) => {
          console.log('Initial API Response:', response);
          
          // Check if we have valid data - use type assertion to fix TypeScript errors
          const responseData = response?.data as any;
          const hasValidData = responseData && (
            (responseData.abstract && responseData.abstract.trim().length > 0)
          );
          
          if (hasValidData) {
            console.log('Valid data received on initial call');
            hasReceivedData = true;
            this.updateFormWithAIData(responseData);
            
            // Stop polling since we have data
            if (this.stopPolling$) {
              this.stopPolling$.next();
            }
          }
        },
        error: (error) => console.error('Initial API error:', error)
      });
    
    // Safety timeout to stop everything after 20 seconds
    // This ensures the loader is shown for full 20 seconds
    timer(maxDuration).subscribe(() => {
      console.log(`Max duration reached at ${new Date().toISOString()}`);
      
      // Clean up polling subscription
      if (polling && !polling.closed) {
        polling.unsubscribe();
      }
      
      // Clean up stop polling subject
      if (this.stopPolling$) {
        this.stopPolling$.next();
        this.stopPolling$.complete();
      }
      
      // If we didn't get data, show error and editor
      if (!hasReceivedData) {
        console.log('No data received after timeout');
        this.aiAbstractError = true;
        this.showEditor = true;
      }
      
      // Always turn off loading state after 20 seconds
      this.isDescriptionLoading = false;
      this.cdr.detectChanges();
    });
  }
  
  // Update form with AI data
  private updateFormWithAIData(data: any): void {
    console.log('Updating form with AI data:', data);
    
    // Update title if available
    if (data.title) {
      this.form.get('title')?.setValue(data.title);
      this.aiGeneratedFields.title = true;
    }
    
    // Update description using abstract field
    if (data.abstract) {
      // Set form value first (even if not visible in the editor)
      this.form.get('description')?.setValue(data.abstract);
      this.aiGeneratedFields.description = true;
      
      // Enable animation
      this.animatedAbstract = true;
      this.showEditor = false; // Ensure editor is hidden
      this.startTypingAnimation(data.abstract);
    }
    
    // Update language if available (convert from string to ID)
    if (data.language) {
      // Find the language ID by name
      const languageName = data.language.toLowerCase();
      const language = this.languages.find(lang => 
        lang.name.toLowerCase() === languageName
      );
      
      if (language) {
        this.form.get('language')?.setValue(language.id);
        this.aiGeneratedFields.language = true;
      }
    }
    
    // Update industry if available
    if (data.industry && data.industry.id) {
      const industryId = parseInt(data.industry.id);
      if (!isNaN(industryId)) {
        this.form.get('industry')?.setValue(industryId);
        this.aiGeneratedFields.industry = true;
        // Also update topics if industry changes
        this.getTopics(industryId);
      }
    }
    
    // Reset loading state
    this.isDescriptionLoading = false;
    this.cdr.detectChanges();
  }

  regionsCountriesValidator = () => {
    const targetMarket = this.form.get('targetMarket')?.value;
    if (targetMarket === '1' || targetMarket === '4') { // Regions or Countries selected
      const regionsValue = this.form.get('regions')?.value;
      const countriesValue = this.form.get('countries')?.value;
      
      const regionsSelected = regionsValue && regionsValue.length > 0;
      const countriesSelected = countriesValue && countriesValue.length > 0;
      
      return regionsSelected || countriesSelected ? null : { required: true };
    }
    return null;
  };
  
  economicBlocksValidator = () => {
    const blocks = this.form.get('economicBlocks')?.value || [];
    return blocks.length > 0 ? null : { required: true };
  };

  // Add method to listen for field changes to remove AI Generated badges
  private setupFieldChangeListeners(): void {
    // Listen for targetMarket changes to apply the correct validators
    this.form.get('targetMarket')?.valueChanges.subscribe(value => {
      if (value === '1') {
        this.form.get('regions')?.setValidators([Validators.required]);
        this.form.get('economicBlocks')?.clearValidators();
        this.form.get('economicBlocks')?.updateValueAndValidity();
        // Reset economic blocks when switching to regions/countries
        this.form.get('economicBlocks')?.setValue([]);
      } else if (value === '4') {
        // Countries only option
        this.form.get('regions')?.clearValidators();
        this.form.get('regions')?.updateValueAndValidity();
        this.form.get('countries')?.setValidators([Validators.required]);
        this.form.get('countries')?.updateValueAndValidity();
        this.form.get('economicBlocks')?.clearValidators();
        this.form.get('economicBlocks')?.updateValueAndValidity();
        
        // Reset regions and economic blocks when switching to countries only
        this.form.get('regions')?.setValue([]);
        this.form.get('economicBlocks')?.setValue([]);
      } else if (value === '2') {
        this.form.get('regions')?.clearValidators();
        this.form.get('regions')?.updateValueAndValidity();
        this.form.get('countries')?.clearValidators();
        this.form.get('countries')?.updateValueAndValidity();
        this.form.get('economicBlocks')?.setValidators([Validators.required]);
        // Reset regions and countries when switching to economic blocks
        this.form.get('regions')?.setValue([]);
        this.form.get('countries')?.setValue([]);
      } else if (value === '3') {
        // For worldwide, clear all validators
        this.form.get('regions')?.clearValidators();
        this.form.get('regions')?.updateValueAndValidity();
        this.form.get('countries')?.clearValidators();
        this.form.get('countries')?.updateValueAndValidity();
        this.form.get('economicBlocks')?.clearValidators();
        this.form.get('economicBlocks')?.updateValueAndValidity();
        
        // Update for worldwide (get all regions)
        this.updateForWorldwide();
      }
    });

    // Title field
    this.form.get('title')?.valueChanges.subscribe(value => {
      // Only mark as non-AI if the value has changed and it was previously AI generated
      if (this.aiGeneratedFields.title && value !== this.defaultValues.title) {
        this.aiGeneratedFields.title = false;
      }
    });

    // Description field - only when editor is visible (user edited)
    this.form.get('description')?.valueChanges.subscribe(value => {
      // Only consider changes when the editor is shown (user is editing)
      if (this.showEditor && this.aiGeneratedFields.description) {
        this.aiGeneratedFields.description = false;
      }
    });

    // Language field
    this.form.get('language')?.valueChanges.subscribe(value => {
      if (this.aiGeneratedFields.language && value !== this.defaultValues.language) {
        this.aiGeneratedFields.language = false;
      }
    });

    // Industry field - handled separately in onIndustrySelected method
  }
}