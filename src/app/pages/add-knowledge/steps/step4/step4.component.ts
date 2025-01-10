import { Component, Injector, Input, OnDestroy, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
} from "@angular/forms";
import { Subscription } from "rxjs";
import { ICreateKnowldege } from "../../create-account.helper";
import { TagsService, Tag } from "src/app/_fake/services/tags/tags.service";
import { BaseComponent } from "src/app/modules/base.component";

interface Chip {
  id: number;
  label: string;
  selected: boolean;
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
  form: FormGroup;
  @Input() defaultValues: Partial<ICreateKnowldege>;

  tags: {
    id: number;
    name: string;
  }[] = [];
  chips: Chip[] = [];
  set keywords(value: string[]) {
    this._keywords = value;
    this.form.patchValue({ keywords: value });
    this.updateParentModel({ keywords: value }, this.checkForm());
  }
  get keywords(): string[] {
    return this._keywords;
  }
  private _keywords: string[] = [];

  availableKeywords: string[] = [];

  constructor(
    injector: Injector,
    private fb: FormBuilder,
    private tagsService: TagsService
  ) {
    super(injector);
  }

  ngOnInit() {
    this.initForm();
    this.fetchTags();
    
    if (this.defaultValues.industry) {
      this.loadKeywordSuggestions();
    }

    if (this.defaultValues.keywords) {
      const cleanKeywords = this.defaultValues.keywords.map((k: any) => 
        typeof k === 'string' ? k : k.value
      );
      this.form.patchValue({ keywords: cleanKeywords });
      this.updateParentModel({ keywords: cleanKeywords }, this.checkForm());
    }
    
    this.updateParentModel({}, this.checkForm());
  }

  initForm() {
    this.form = this.fb.group({
      tag_ids: [this.defaultValues.tag_ids || []],
      keywords: [this.defaultValues.keywords || []],
    });

    const formChangesSubscr = this.form.valueChanges.subscribe((val) => {
      this.updateParentModel(val, this.checkForm());
    });
    this.unsubscribe.push(formChangesSubscr);
  }

  fetchTags() {
    if (this.defaultValues.industry) {
      const tagSub = this.tagsService
        .getTagsByIndustry(this.defaultValues.industry, this.lang)
        .subscribe({
          next: (tags) => {
            this.tags = tags;
            // Initialize chips based on fetched tags
            this.chips = this.tags.map((tag) => ({
              id: tag.id,
              label: tag.name,
              selected: false,
            }));
            // If there are default tags, select them
            if (
              this.defaultValues.tag_ids &&
              this.defaultValues.tag_ids.length > 0
            ) {
              this.chips.forEach((chip) => {
                if (this.defaultValues.tag_ids?.includes(chip.id)) {
                  chip.selected = true;
                }
              });
              this.updateSelectedTags();
            }
          },
          error: (error) => {
            console.error("Error fetching tags:", error);
          },
        });
      this.unsubscribe.push(tagSub);
    }
  }

  toggleSelection(chip: Chip): void {
    chip.selected = !chip.selected;
    const selectedTagIds = this.chips
      .filter((chip) => chip.selected)
      .map((chip) => chip.id);

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

  addKeyword(keyword: string) {
    const currentKeywords = this.form.get("keywords")?.value || [];
    if (!currentKeywords.includes(keyword)) {
      const newKeywords = [...currentKeywords, keyword];
      this.form.patchValue({ keywords: newKeywords });
      this.updateParentModel({ keywords: newKeywords }, this.checkForm());
    }
  }

  removeKeyword(keyword: string) {
    const currentKeywords = this.form.get("keywords")?.value || [];
    const newKeywords = currentKeywords.filter((k: string) => k !== keyword);

    this.form.patchValue({ keywords: newKeywords });
    this.updateParentModel({ keywords: newKeywords }, this.checkForm());
  }

  updateSelectedTags() {
    const selectedTags = this.chips
      .filter((chip) => chip.selected)
      .map((chip) => chip.label);
    this.form.get("tags")?.setValue(selectedTags);
  }

  checkForm() {
    return this.form.valid;
  }

  onKeywordAdded(event: any) {
    const newKeyword =
      typeof event.value === "string" ? event.value : event.value.value;
    const currentKeywords = (this.form.get("keywords")?.value || []).map(
      (k: any) => (typeof k === "string" ? k : k.value)
    );

    // Check for duplicates (case-insensitive)
    if (
      !currentKeywords.some(
        (k: any) => k.toLowerCase() === newKeyword.toLowerCase()
      )
    ) {
      const updatedKeywords = [...currentKeywords, newKeyword];
      this.form.patchValue({ keywords: updatedKeywords });
      this.updateParentModel({ keywords: updatedKeywords }, this.checkForm());
    }
  }

  onKeywordRemoved(event: any) {
    const removedKeyword =
      typeof event.value === "string" ? event.value : event.value.value;
    const currentKeywords = (this.form.get("keywords")?.value || []).map(
      (k: any) => (typeof k === "string" ? k : k.value)
    );
    const updatedKeywords = currentKeywords.filter(
      (k: string) => k !== removedKeyword
    );

    this.form.patchValue({ keywords: updatedKeywords });
    this.updateParentModel({ keywords: updatedKeywords }, this.checkForm());
  }

  private loadKeywordSuggestions() {
    const suggestionsSub = this.tagsService
      .getSuggestKeywords(this.defaultValues.industry!, this.lang)
      .subscribe({
        next: (keywords) => {
          this.availableKeywords = keywords;
        },
        error: (error) => {
          console.error('Error loading keyword suggestions:', error);
        }
      });
    this.unsubscribe.push(suggestionsSub);
  }
}
