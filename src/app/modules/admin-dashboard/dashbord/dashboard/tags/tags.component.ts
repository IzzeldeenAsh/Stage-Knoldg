import { ChangeDetectorRef, Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { Message } from "primeng/api";
import { Table } from "primeng/table";
import { Observable, Subscription } from "rxjs";
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Tag, TagsService } from "src/app/_fake/services/tags/tags.service";

@Component({
  selector: "app-tags",
  templateUrl: "./tags.component.html",
  styleUrls: ["./tags.component.scss"],
})
export class TagsComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  private unsubscribe: Subscription[] = [];
  listOfTags: Tag[] = [];
  isEditMode: boolean = false;
  isLoading$: Observable<boolean>;
  selectedTagId: number | null = null;
  visible: boolean = false;
  tagForm: FormGroup;
  categories: { id: string; name: string }[] = []; // To store category options

  constructor(
    private _tags: TagsService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private messageService: MessageService
  ) {
    this.isLoading$ = this._tags.isLoading$;
  }

  ngOnInit(): void {
    this.tagForm = this.fb.group({
      arabicName: ['', Validators.required],
      englishName: ['', Validators.required],
      status: ['Active', Validators.required],
      category: [null, Validators.required] // Initialize to hold the full category object
    });

    this.getTagsList();
    this.getCategories(); // Fetch categories for the dropdown
  }

  getCategories() {
    const categorySub = this._tags.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (error) => {
        this.handleServerErrors(error);
      }
    });
    this.unsubscribe.push(categorySub);
  }

  getTagsList() {
    const listSub = this._tags.getTags().subscribe({
      next: (data: Tag[]) => {
        this.listOfTags = data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.messages = [];

        if (error.validationMessages) {
          this.messages = error.validationMessages;
        } else {
          this.messages.push({
            severity: "error",
            summary: "Error",
            detail: "An unexpected error occurred.",
          });
        }
      },
    });
    this.unsubscribe.push(listSub);
  }

  showDialog() {
    this.visible = true;
    this.selectedTagId = null;
    this.isEditMode = false;
    this.tagForm.reset();
    this.messages = [];
  }

  editTag(tag: Tag) {
    this.visible = true;
    this.selectedTagId = tag.id;
    this.isEditMode = true;
    console.log(tag);
    this.tagForm.patchValue({
      arabicName: tag.names.ar,
      englishName: tag.names.en,
      status: tag.status,
      category: this.categories.find(cat => cat.id === tag.category) // Match selected category object
    });
    this.messages = [];
  }

  private handleServerErrors(error: any) {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
  
      // Map the error keys to form controls
      const errorKeyToFormControlName: any = {
        'name.en': 'englishName',
        'name.ar': 'arabicName',
        'status': 'status',
        'category': 'category'
      };
  
      // Loop through each error and set it on the respective form control
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key]; // Get the array of error messages for this key
          const formControlName = errorKeyToFormControlName[key]; // Get the mapped form control name
  
          if (formControlName) {
            // If the error maps to a form control, set the server error on the control
            const control = this.tagForm.get(formControlName);
            if (control) {
              control.setErrors({ serverError: messages[0] }); // Use the first message or customize as needed
              control.markAsTouched(); // Mark as touched to display the error immediately
            }
          }
        }
      }
    }
  }
  
  

 

  applyFilter(event: any) {
    const value = event.target.value.trim().toLowerCase();
    this.table.filterGlobal(value, "contains");
  }

  get hasSuccessMessage() {
    return this.messages.some(msg => msg.severity === 'success');
  }

  get hasErrorMessage() {
    return this.messages.some(msg => msg.severity === 'error');
  }
  get status() {
    return this.tagForm.get('status');
  }
  
  get category() {
    return this.tagForm.get('category');
  }
  onCancel() {
    this.visible = false;
    this.tagForm.reset();
    this.messages = [];
  }

  get arabicName() {
    return this.tagForm.get('arabicName');
  }

  get englishName() {
    return this.tagForm.get('englishName');
  }

  submit() {
    this.messages = [];

    if (this.tagForm.invalid) {
      this.tagForm.markAllAsTouched();
      return;
    }

    const formValues = this.tagForm.value;

    const tagData = {
      
        name: {
          en: formValues.englishName,
          ar: formValues.arabicName
        },
        status: formValues.status,
        category: formValues.category.id // Only pass category ID to the backend
      }
   

    if (this.selectedTagId) {
      // Update existing tag
      const updateSub = this._tags.updateTag(this.selectedTagId, tagData).subscribe({
        next: (res: Tag) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Tag updated successfully.',
          });
          this.getTagsList(); // Refresh the list after update
          this.visible = false; // Close dialog
          this.tagForm.reset(); // Reset the form
        },
        error: (error) => {
          this.handleServerErrors(error);
        }
      });

      this.unsubscribe.push(updateSub);
    } else {
      // Create a new tag
      const createSub = this._tags.createTag(tagData).subscribe({
        next: (res: any) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Tag created successfully.',
          });
          this.getTagsList(); // Refresh the list after creation
          this.visible = false; // Close dialog
          this.tagForm.reset(); // Reset the form
        },
        error: (error) => {
          this.handleServerErrors(error);
        }
      });

      this.unsubscribe.push(createSub);
    }
  }

  deleteTag(tagId: number) {
    this.messages = [];
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this tag? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const deleteSub = this._tags.deleteTag(tagId).subscribe({
          next: (res: any) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Tag deleted successfully.',
            });
            this.getTagsList();
          },
          error: (error) => {
            this.handleServerErrors(error);
          }
        });
        this.unsubscribe.push(deleteSub);
      }
    });
  }

  ngOnDestroy() {
    this.unsubscribe.forEach(sb => sb.unsubscribe());
  }

  @ViewChild("dt") table: Table;
}
