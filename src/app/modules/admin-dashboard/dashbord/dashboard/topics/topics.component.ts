import { ChangeDetectorRef, Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { Message } from "primeng/api";
import { Table } from "primeng/table";
import { Observable, Subscription, of } from "rxjs";
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Topic, TopicsService } from "src/app/_fake/services/topic-service/topic.service";
import { TreeNode } from "src/app/_fake/models/treenode";
import { IndustryService } from "src/app/_fake/services/industries/industry.service";

@Component({
  selector: "app-topics",
  templateUrl: "./topics.component.html",
  styleUrls: ["./topics.component.scss"],
})
export class TopicsComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  private unsubscribe: Subscription[] = [];
  listOfTopics: Topic[] = [];
  isEditMode: boolean = false;
  nodes: TreeNode[] = [];
  selectedNode:any = null;
  isLoading$: Observable<boolean>;
  selectedTopicId: number | null = null;
  reverseLoader: boolean = false;
  visible: boolean = false;
  topicForm: FormGroup;
  industriesList: any[] = []; // Store all industries
  submitted = false;
  constructor(
    private _topics: TopicsService,
    private _isic: IndustryService, // Inject ISIC Codes Service
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private messageService: MessageService
  ) {
    this.isLoading$ = this._topics.isLoading$;
  }

  ngOnInit(): void {
    this.topicForm = this.fb.group({
      arabicName: ['', Validators.required],
      englishName: ['', Validators.required],
    });

    this.getIndustriesList(); // Fetch industries first
    this.getIndustriesTree();
  }

  getIndustriesList() {
    this.isLoading$=of(true)
    const industrySub = this._isic.getIndustryList().subscribe({
      next: (data) => {
        this.industriesList = data;
        this.getTopicsList(); // Fetch topics after industries are loaded
      },
      error: (error) => {
        this.handleServerErrors(error);
      }
    });
    this.unsubscribe.push(industrySub);
  }
  getIndustryName(industryId: number): string {
    const industry = this.industriesList.find(ind => ind.id === industryId);
    return industry ? `${industry.names.en} | ${industry.names.ar}` : 'N/A';
  }
  
  getIndustriesTree() {
    this.reverseLoader = true;
    const isicSub = this._isic.getIsicCodesTree( 'en').subscribe({
      next: (res) => {
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
      this.selectedNode = null;
      this.messageService.add({
        severity: 'warn',
        summary: 'Selection Disabled',
        detail: 'This category cannot be selected.',
      });
    } else {
      // Ensure only leaf nodes can be selected
      if (event.node.children && event.node.children.length > 0) {
        this.selectedNode = null;
        this.messageService.add({
          severity: 'warn',
          summary: 'Selection Restricted',
          detail: 'Please select a child industry (leaf node).',
        });
      } else {
        this.selectedNode = event.node;
      }
    }
  }

  onNodeUnselect(event: any) {
    this.selectedNode = null;
  }

  selectDefaultNode(topic: Topic) {
    this.reverseLoader = true;
    this.selectedNode = null;
    const industryIdToSelect = topic.industry_id;

    const traverse = (nodes: TreeNode[], parentNode: TreeNode | null = null) => {
      nodes.forEach((node: any) => {
        node.parent = parentNode; // Set the parent property

        if (node.data.key === industryIdToSelect) {
          this.selectedNode = node;
          node.selected = true; // Mark the node as selected
        }

        if (node.children && node.children.length) {
          traverse(node.children, node);
        }
      });
    };

    traverse(this.nodes);
    this.expandToSelectedNode();
    this.reverseLoader = false;
  }

  getTopicsList() {
    const listSub = this._topics.getTopics().subscribe({
      next: (data: Topic[]) => {
        this.listOfTopics = data;
        this.isLoading$=of(false)
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.messages = [];
        this.isLoading$=of(false)
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
    this.selectedTopicId = null;
    this.isEditMode = false;
    this.topicForm.reset();
    this.selectedNode = null;
    this.messages = [];
  }

  editTopic(topic: Topic) {
    this.visible = true;
    this.selectedTopicId = topic.id;
    this.isEditMode = true;
    this.selectDefaultNode(topic);
    this.topicForm.patchValue({
      arabicName: topic.names.ar,
      englishName: topic.names.en,
    });
    this.messages = [];
  }

  handleDialogClose() {
    this.selectedNode = null;
  }

  private handleServerErrors(error: any) {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;

      // Map the error keys to form controls
      const errorKeyToFormControlName: any = {
        'name.en': 'englishName',
        'name.ar': 'arabicName',
        'status': 'status',
        'industry_id': 'industry'
      };

      // Loop through each error and set it on the respective form control
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key]; // Get the array of error messages for this key
          const formControlName = errorKeyToFormControlName[key]; // Get the mapped form control name

          if (formControlName) {
            // If the error maps to a form control, set the server error on the control
            const control = this.topicForm.get(formControlName);
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
    return this.topicForm.get('status');
  }

  get industry() {
    return this.topicForm.get('industry');
  }

  onCancel() {
    this.visible = false;
    this.topicForm.reset();
    this.messages = [];
    this.selectedNode = null;
    this.submitted = false; // Reset submitted
  }
  
  get arabicName() {
    return this.topicForm.get('arabicName');
  }

  get englishName() {
    return this.topicForm.get('englishName');
  }

  submit() {
    this.messages = [];
    this.submitted = true; 
    if (this.topicForm.invalid || !this.selectedNode) {
      this.topicForm.markAllAsTouched();
      if (!this.selectedNode) {
        this.messageService.add({
          severity: 'error',
          summary: 'Industry Required',
          detail: 'Please select an industry.',
        });
      }
      return;
    }

    const formValues = this.topicForm.value;

    const topicData = {
      name: {
        en: formValues.englishName.trim(),
        ar: formValues.arabicName.trim()
      },
      industry_id: this.selectedNode.data.key
    };

    if (this.selectedTopicId) {
      // Update existing topic
      const updateSub = this._topics.updateTopic(this.selectedTopicId, topicData).subscribe({
        next: (res: Topic) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Topic updated successfully.',
          });
          this.getTopicsList();
          this.visible = false; // Close dialog
          this.topicForm.reset(); // Reset the form
          this.selectedNode = null;
        },
        error: (error) => {
          this.handleServerErrors(error);
        }
      });

      this.unsubscribe.push(updateSub);
    } else {
      // Create a new topic
      const createSub = this._topics.createTopic(topicData).subscribe({
        next: (res: any) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Topic created successfully.',
          });
          this.getTopicsList();
          this.visible = false; // Close dialog
          this.topicForm.reset(); // Reset the form
          this.selectedNode = null;
        },
        error: (error) => {
          this.handleServerErrors(error);
        }
      });

      this.unsubscribe.push(createSub);
    }
     // After successful submission
  this.visible = false; // Close dialog
  this.topicForm.reset(); // Reset the form
  this.selectedNode = null;
  this.submitted = false; // Reset submitted
  }

  deleteTopic(topicId: number) {
    this.messages = [];
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this topic? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const deleteSub = this._topics.deleteTopic(topicId).subscribe({
          next: (res: any) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Topic deleted successfully.',
            });
            this.getTopicsList();
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

  expandToSelectedNode() {
    if (this.selectedNode) {
      this.expandAncestors(this.nodes, this.selectedNode);
    }
  }
  expandAncestors(nodes: TreeNode[], targetNode: TreeNode, path: TreeNode[] = []): boolean {
    for (let node of nodes) {
      const currentPath = [...path, node];
      if (node === targetNode) {
        // Expand all nodes in the current path
        currentPath.forEach(n => n.expanded = true);
        return true;
      }
      if (node.children && node.children.length) {
        const found = this.expandAncestors(node.children, targetNode, currentPath);
        if (found) {
          node.expanded = true;
          return true;
        }
      }
    }
    return false;
  }

  @ViewChild("dt") table: Table;
}
