import { ChangeDetectorRef, Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { Message } from "primeng/api";
import { Table } from "primeng/table";
import { Observable, Subscription, of } from "rxjs";
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Tag, TagsService } from "src/app/_fake/services/tags/tags.service";
import { IsicCodesService } from "src/app/_fake/services/isic-code/isic-codes.service"; // Import ISIC Codes Service
import { TreeNode } from "src/app/_fake/models/treenode";
import { IndustryService } from "src/app/_fake/services/industries/industry.service";

interface TagWithIndustries extends Tag {
  associatedIndustries: IndustryDisplay[];
}

interface IndustryDisplay {
  en: string;
  ar: string;
}

@Component({
  selector: "app-tags",
  templateUrl: "./tags.component.html",
  styleUrls: ["./tags.component.scss"],
})
export class TagsComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  private unsubscribe: Subscription[] = [];
  listOfTags: Tag[] = [];
  tagsWithIndustries: TagWithIndustries[] = [];
  isEditMode: boolean = false;
  nodes: TreeNode[] = [];
  selectedNodes: any;
  isLoading$: Observable<boolean>;
  selectedTagId: number | null = null;
  reverseLoader:boolean=false;
  visible: boolean = false;
  tagForm: FormGroup;
  categories: { id: string; name: string }[] = []; // To store category options
  industriesList: any[] = []; // Store all industries

  constructor(
    private _tags: TagsService,
    private _isic: IndustryService, // Inject ISIC Codes Service
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
      status: ['active', Validators.required],
     
    });

    this.getIndustriesList(); // Fetch industries first
    this.getIndustriesTree();
  }

  getIndustriesList() {
    this.isLoading$ = of(true)
    const industrySub = this._isic.getIndustryList().subscribe({
      next: (data) => {
        this.industriesList = data;
        this.isLoading$ = of(false)
        this.getTagsList(); // Fetch tags after industries are loaded
      },
      error: (error) => {
        this.isLoading$ = of(false)
        this.handleServerErrors(error);
      }
    });
    this.unsubscribe.push(industrySub);
  }

  getIndustriesTree() {
    this.reverseLoader = true;
    const isicSub = this._isic.getIsicCodesTree().subscribe({
      next: (res) => {
        console.log("res",res);
        this.nodes = this.disableRootNodes(res); // Disable parent nodes
      },
      error: (err) => {
        console.error('Error fetching ISIC codes:', err);
      },
      complete: () => {
        this.reverseLoader = false;
      }
    });
    this.unsubscribe.push(isicSub);
  }
  
  disableRootNodes(nodes: TreeNode[]): TreeNode[] {
    return nodes.map(node => {
      node.selectable = false; // Disable selection for root node
      node.selected = false; // Ensure node is not selected
      node.partialSelected = false; // Ensure node is not partially selected
      node.styleClass = 'root-node'; // Add a CSS class for styling
      if (node.children && node.children.length > 0) {
        node.children = this.enableChildNodes(node.children); // Ensure children remain selectable
      }
      return node;
    });
  }

  enableChildNodes(nodes: TreeNode[]): TreeNode[] {
    return nodes.map(child => {
      child.selectable = true; // Ensure child nodes are selectable
      if (child.children && child.children.length > 0) {
        child.children = this.enableChildNodes(child.children); // Recurse for deeper levels
      }
      return child;
    });
  }
  onNodeSelect(event: any) {
    if (!event.node.selectable) {
      // If the node is not selectable, remove it from the selection
      this.selectedNodes = this.selectedNodes.filter((node: TreeNode) => node.key !== event.node.key);
      this.messageService.add({
        severity: 'warn',
        summary: 'Selection Disabled',
        detail: 'This category cannot be selected.',
      });
    }
  }
  
  onNodeUnselect(event: any) {
    // Optional: Handle unselection if needed
  }
  
  selectDefaultNodes(tag:Tag) {
    this.reverseLoader=true;
    this.selectedNodes = [];
    const codesToSelect = tag.industries;
    const traverse = (nodes: any[], parentNode: any = null) => {
      nodes.forEach((node: any) => {
        node.parent = parentNode; // Set the parent property
  
        if (codesToSelect.includes(node.data.key)) {
          this.selectedNodes.push(node);
          node.selected = true; // Mark the node as selected
        }
  
        if (node.children && node.children.length) {
          traverse(node.children, node);
  
          // Update parent node selection state based on child nodes
          const allChildrenSelected = node.children.every((child: any) => child.selected);
          const someChildrenSelected = node.children.some((child: any) => child.selected || child.partialSelected);
  
          if (allChildrenSelected) {
            node.selected = true;
            node.partialSelected = false;
          } else if (someChildrenSelected) {
            node.selected = false;
            node.partialSelected = true;
          } else {
            node.selected = false;
            node.partialSelected = false;
          }
        }
      });
      }

      traverse(this.nodes);
      this.reverseLoader=false;
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
    this.isLoading$ = of(true)
    const listSub = this._tags.getTags().subscribe({
      next: (data: Tag[]) => {
        this.listOfTags = data;
        this.mapTagsWithIndustries();
        this.isLoading$ = of(false)
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.messages = [];
        this.isLoading$ = of(false)
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

  mapTagsWithIndustries() {
    this.tagsWithIndustries = this.listOfTags.map(tag => {
      const associatedIndustries = this.industriesList
        .filter(industry => industry.tags.some((t:any) => t.tag_id === tag.id))
        .map(industry => ({
          en: industry.names.en.trim(),
          ar: industry.names.ar.trim()
        }));

      return {
        ...tag,
        associatedIndustries
      };
    });
  }

  showDialog() {
    this.visible = true;
    this.selectedTagId = null;
    this.isEditMode = false;
    this.tagForm.reset();
    this.messages = [];
  }

  editTag(tag:Tag) { // Update parameter type
    this.visible = true;
    this.selectedTagId = tag.id;
    this.isEditMode = true;
    this.selectDefaultNodes(tag);
    console.log(tag);
    this.tagForm.patchValue({
      arabicName: tag.names.ar,
      englishName: tag.names.en,
      status: tag.status,
    });
    this.messages = [];

  }
  handleDialogClose(){
    this.selectedNodes=[]
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
        en: formValues.englishName.trim(),
        ar: formValues.arabicName.trim()
      },
      status: formValues.status,
      industries: this.selectedNodes.filter((node:any)=>node.selectable).map((node:any)=>node.key)
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
          this.getIndustriesList(); // Fetch industries first
          this.getIndustriesTree();
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
          this.getIndustriesList(); // Fetch industries first
          this.getIndustriesTree();
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
