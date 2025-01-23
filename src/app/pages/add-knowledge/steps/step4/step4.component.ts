import { Component, Injector, Input, OnDestroy, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { Subscription } from "rxjs";
import { ICreateKnowldege } from "../../create-account.helper";
import { TagsService } from "src/app/_fake/services/tags/tags.service";
import { BaseComponent } from "src/app/modules/base.component";
import { KnowledgeService } from "src/app/_fake/services/knowledge/knowledge.service";
import { ChangeDetectorRef } from '@angular/core';

interface Chip {
  id: number;
  label: string;
  selected: boolean;
}

interface KeywordItem {
  display: string;
  value: string;
}

@Component({
  selector: "app-step4",
  templateUrl: "./step4.component.html",
  styleUrls: ["./step4.compontent.scss"],
})

export class Step4Component extends BaseComponent implements OnInit {
  @Input("updateParentModel") updateParentModel: (
    part: Partial<ICreateKnowldege>,
    isFormValid: boolean
  ) => void;
  @Input() defaultValues: Partial<ICreateKnowldege>;
  
  form: FormGroup;
  tags: { id: number; name: string }[] = [];
  chips: Chip[] = [];
  availableKeywords: KeywordItem[] = [];

  // Custom Tag Form Controls
  customTagForm: FormGroup;
  isAddingCustomTag: boolean = false;

  constructor(
    injector: Injector,
    private fb: FormBuilder,
    private tagsService: TagsService,
    private knowledgeService: KnowledgeService,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {
    super(injector);
  }

  ngOnInit() {
    this.initForm();

    if (this.defaultValues.knowledgeId) {
      this.fetchKnowledgeData(this.defaultValues.knowledgeId);
    }

    this.fetchTags();
    this.fetchSuggestedKeywords();
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
  }

  initForm() {
    this.form = this.fb.group({
      tag_ids: [this.defaultValues.tag_ids || []],
      keywords: [this.defaultValues.keywords || []],
    });

    this.customTagForm = this.fb.group({
      name: ['', Validators.required],
    });

    const formChangesSubscr = this.form.valueChanges.subscribe((val) => {
      this.updateParentModel(val, this.checkForm());
    });
    this.unsubscribe.push(formChangesSubscr);
  }

  fetchKnowledgeData(knowledgeId: number) {
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
        this.fetchTagsAndSetSelections();
      },
      error: (error) => {
        console.error("Error fetching knowledge data:", error);
      },
    });
  }

  fetchTagsAndSetSelections() {
    if (!this.defaultValues.industry) return;
    
    this.tagsService.getTagsByIndustry(this.defaultValues.industry, this.lang).subscribe({
      next: (tags) => {
        this.tags = tags;
        this.chips = this.tags.map((tag) => ({
          id: tag.id,
          label: tag.name,
          selected: this.defaultValues.tag_ids?.includes(tag.id) || false,
        }));
        this.updateParentModel({ tag_ids: this.defaultValues.tag_ids }, this.checkForm());
      },
      error: (error) => {
        console.error("Error fetching tags by industry:", error);
      },
    });
  }

  fetchTags() {
    if (this.defaultValues.industry) {
      this.tagsService
        .getTagsByIndustry(this.defaultValues.industry, this.lang)
        .subscribe({
          next: (tags) => {
            this.tags = tags;
            this.chips = this.tags.map((tag) => ({
              id: tag.id,
              label: tag.name,
              selected: this.defaultValues.tag_ids?.includes(tag.id) || false,
            }));
            this.updateParentModel({ tag_ids: this.defaultValues.tag_ids }, this.checkForm());
          },
          error: (error) => {
            console.error("Error fetching tags:", error);
          },
        });
    }
  }

  toggleSelection(chip: Chip): void {
    chip.selected = !chip.selected;
    const selectedTagIds = this.chips
      .filter((c) => c.selected)
      .map((c) => c.id);

    this.form.patchValue({ tag_ids: selectedTagIds });
    this.updateParentModel({ tag_ids: selectedTagIds }, this.checkForm());
  }

  selectAll(): void {
    this.chips.forEach((chip) => (chip.selected = true));
    const selectedTagIds = this.chips.map((chip) => chip.id);

    this.form.patchValue({ tag_ids: selectedTagIds });
    this.updateParentModel({ tag_ids: selectedTagIds }, this.checkForm());
  }

  clearAll(): void {
    this.chips.forEach((chip) => (chip.selected = false));

    this.form.patchValue({ tag_ids: [] });
    this.updateParentModel({ tag_ids: [] }, this.checkForm());
  }

  checkForm(): boolean {
    const keywords = this.form.get('keywords')?.value || [];
    return this.form.valid && keywords.length > 0;
  }

  // Custom Tag Methods
  openAddCustomTag() {
    this.isAddingCustomTag = true;
  }

  closeAddCustomTag() {
    this.isAddingCustomTag = false;
    this.customTagForm.reset();
  }

  submitCustomTag() {
    if (this.customTagForm.invalid || !this.defaultValues.industry) {
      this.customTagForm.markAllAsTouched();
      return;
    }

    const tagName = this.customTagForm.value.name.trim();
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
        this.closeAddCustomTag();
        this.fetchTagsAndSelectNewTag(newTagId);
      },
      error: (error) => {
       this.handleServerErrors(error);
      },
    });
  }

  fetchTagsAndSelectNewTag(newTagId: number) {
    if (!this.defaultValues.industry) return;

    this.tagsService.getTagsByIndustry(this.defaultValues.industry, this.lang).subscribe({
      next: (tags) => {
        this.tags = tags;
        this.chips = this.tags.map((tag) => ({
          id: tag.id,
          label: tag.name,
          selected: tag.id === newTagId || (this.defaultValues.tag_ids?.includes(tag.id) ?? false),
        }));
        const selectedTagIds = this.chips
          .filter((c) => c.selected)
          .map((c) => c.id);

        this.form.patchValue({ tag_ids: selectedTagIds });
        this.updateParentModel({ tag_ids: selectedTagIds }, this.checkForm());
      },
      error: (error) => {
        this.handleServerErrors(error);
        },
    });
  }

  addKeyword(event: any) {
    // Debug logs
    console.log('Add Event:', event);
    console.log('Event Value Type:', typeof event.value);
    console.log('Event Value:', event.value);

    const value = typeof event.value === 'string' ? event.value : event.value?.value;
    if (!value?.trim()) return;

    // Create keyword item
    const newKeyword: KeywordItem = {
      display: value.trim(),
      value: value.trim()
    };

    // Get current keywords
    const currentKeywords: KeywordItem[] = this.form.get('keywords')?.value || [];
    console.log('Current Keywords:', currentKeywords);

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

      console.log('Added Keyword:', newKeyword);
      console.log('Updated Keywords:', updatedKeywords);
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

    console.log('Removed Keyword:', removedKeyword);
    console.log('Updated Keywords:', updatedKeywords);
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

  fetchSuggestedKeywords() {
    if (!this.defaultValues.knowledgeId) return;

    this.tagsService.getSuggestKeywords(this.defaultValues.knowledgeId!, this.lang).subscribe({
      next: (keywords) => {
        // Convert suggested keywords to KeywordItem format
        this.availableKeywords = keywords.map(keyword => ({
          display: keyword,
          value: keyword
        }));
        console.log('Available Keywords:', this.availableKeywords);
      },
      error: (error) => {
        console.error("Error fetching suggested keywords:", error);
        this.handleServerErrors(error);
      }
    });
  }
}
