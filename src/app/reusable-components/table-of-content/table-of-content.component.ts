import { Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { ICreateKnowldege } from 'src/app/pages/add-knowledge/create-account.helper';
import { TranslationModule } from 'src/app/modules/i18n';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-table-of-content',
  standalone: true,
  imports: [CommonModule, TranslationModule,ReactiveFormsModule, FormsModule],
  templateUrl: './table-of-content.component.html',
  styleUrls: ['./table-of-content.component.scss'],
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
export class TableOfContentComponent implements OnInit, OnChanges {
  @Input() initialToc: string; // Expecting stringified JSON { chapters: [ { name, index, subChapters: [...] } ] }
  @Output() tocChange = new EventEmitter<any>();
  tocForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.tocForm = this.fb.group({
      chapters: this.fb.array([])
    });

    // Add debounceTime to prevent interference with typing
    this.tocForm.valueChanges.pipe(
      debounceTime(300)  // Wait 300ms after changes before emitting
    ).subscribe(value => {
      if (this.tocForm.valid) {
        this.tocChange.emit(value);
      }
    });
  }

  ngOnInit(): void {
    if (this.initialToc) {
      try {
        const parsedToc = JSON.parse(this.initialToc);
        if (parsedToc.chapters && parsedToc.chapters.length > 0) {
          this.loadChapters(parsedToc.chapters);
        } else {
          this.addChapter();
        }
      } catch (e) {
        console.error('Failed to parse initialToc:', e);
        this.addChapter();
      }
    } else {
      this.addChapter(); // Initialize with one chapter if no initial TOC
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialToc'] && changes['initialToc'].currentValue) {
      try {
        const parsedToc = JSON.parse(changes['initialToc'].currentValue);
        const chapters = parsedToc.chapters;
        if (chapters && chapters.length > 0) {
          this.loadChapters(chapters);
        }
      } catch (e) {
        console.error('Failed to parse initialToc in ngOnChanges:', e);
      }
    }
  }

  /**
   * Loads chapters into the form from the provided data.
   * @param chaptersData Array of chapter objects.
   */
  loadChapters(chaptersData: any[]) {
    this.chapters.clear();
    chaptersData.forEach(ch => {
      const chapterGroup = this.createChapter();
      chapterGroup.patchValue({
        name: ch.name,
        // index: ch.index
      });
      (ch.subChapters || []).forEach((sub: any) => {
        const subGroup = this.createSubChapter();
        subGroup.patchValue({
          name: sub.name,
          index: sub.index
        });
        (chapterGroup.get('subChapters') as FormArray).push(subGroup);
      });
      this.chapters.push(chapterGroup);
    });
  }

  // Getter for chapters FormArray
  get chapters(): FormArray {
    return this.tocForm.get('chapters') as FormArray;
  }

  // Method to get subChapters FormArray for a given chapter
  getSubChapters(chapterIndex: number): FormArray {
    return this.chapters.at(chapterIndex).get('subChapters') as FormArray;
  }

  // Method to create a new chapter FormGroup
  private createChapter(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      // index: [null, [Validators.required, Validators.min(1)]],
      subChapters: this.fb.array([])
    });
  }

  // Method to add a new chapter
  addChapter(): void {
    this.chapters.push(this.createChapter());
  }

  // Method to remove a chapter
  removeChapter(index: number): void {
    this.chapters.removeAt(index);
  }

  // Method to create a new subchapter FormGroup
  private createSubChapter(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      // index: [null, [Validators.required, Validators.min(1)]]
    });
  }

  // Method to add a subchapter to a specific chapter
  addSubChapter(chapterIndex: number): void {
    this.getSubChapters(chapterIndex).push(this.createSubChapter());
  }

  // Method to remove a subchapter from a specific chapter
  removeSubChapter(chapterIndex: number, subChapterIndex: number): void {
    this.getSubChapters(chapterIndex).removeAt(subChapterIndex);
  }

  reset() {
    this.tocForm.reset();
  }
}
