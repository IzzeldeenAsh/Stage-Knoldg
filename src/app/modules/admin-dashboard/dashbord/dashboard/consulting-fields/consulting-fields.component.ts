import {
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { TreeNode, MessageService } from 'primeng/api';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { TreeTable } from 'primeng/treetable';
import { IndustryService } from 'src/app/_fake/services/industries/industry.service';
import { ConsultingFieldTreeService } from 'src/app/_fake/services/consulting-fields-tree/consulting-fields-tree.service';
import { TranslationService } from 'src/app/modules/i18n';

@Component({
  selector: 'app-consulting-fields',
  templateUrl: './consulting-fields.component.html',
  styleUrls: ['./consulting-fields.component.scss'],
})
export class ConsultingFieldsComponent implements OnInit, OnDestroy {
  messages: any[] = [];
  private unsubscribe: Subscription[] = [];
  isicnodes!: TreeNode[];
  originalIsicNodes!: TreeNode[];
  isicTreeData!: TreeNode[];
  statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
  ];
  isicForm!: FormGroup;
  selectedParentId: number | null = null;
  displayDialog: boolean = false;
  selectedNode:any;
  isUpdate: boolean = false;
  selectedNodeId: number | null = null;
  isLoading$: Observable<boolean>;
  parentKey:number | null = null;
  @ViewChild('tt') treeTable!: TreeTable; // Reference to the TreeTable
  lang:string='en'
  constructor(
    private cdr: ChangeDetectorRef,
    private isicCodesService: ConsultingFieldTreeService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private trans:TranslationService
  ) {
    this.isLoading$ = this.isicCodesService.isLoading$;
  }

  ngOnInit() {
    this.isicForm = this.fb.group({
      code: ['', Validators.required],
      nameEn: ['', Validators.required],
      nameAr: ['', Validators.required],
      status: ['', Validators.required],
      parentId: [null],
    });

    this.loadIsicCodes();
  }

  loadIsicCodes() {
    const listSub = this.isicCodesService.getConsultingCodesTree('en').subscribe({
      next: (res) => {
        this.isicnodes = res;
        this.originalIsicNodes = [...res];  // Store original data here
        this.isicTreeData = this.changeKeyToValue([...res]); // Transform only for isicTreeData
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.handleServerErrors(error);
      },
    });
    this.unsubscribe.push(listSub);
  }
  changeKeyToValue(nodes: any) {
    return nodes.map((node: any) => {
      const newNode = {
        ...node,
        value: node.data.key, // Ensure the top-level 'value' is set from 'key'
        children: node.children ? this.changeKeyToValue(node.children) : []
      };
      delete newNode.key;
      
      if (newNode.data && newNode.data.key !== undefined) {
        newNode.data = {
          ...newNode.data,
          value: newNode.data.key
        };
        delete newNode.data.key;
      }
  
      return newNode;
    });
  }
  showDialog() {
    this.displayDialog = true;
    this.selectedNodeId = null; // Reset selected node ID for create
    this.parentKey=null;
    this.selectedNode=null;
    this.isUpdate = false; // Set to false when adding a new ISIC code
    this.isicForm.reset(); // Reset the form
  }

  editIsicCode(node: any) {
    console.log('node', node);
    this.displayDialog = true; // Open dialog
    this.selectedNodeId = node.node.data.key; // Set the ID for update
    this.isUpdate = true; // Set to true for editing mode
    
    const parentValue = node.node.parent ? node.node.parent.key : null;
    this.parentKey = parentValue;
    this.selectedNode = this.findNodeByValue(this.isicTreeData, this.parentKey);
    this.isicForm.patchValue({
      code: node.node.data.code,
      nameEn: node.node.data.nameEn,
      nameAr: node.node.data.nameAr,
      status: node.node.data.status,
      parentId: parentValue,
    });
  }
  findNodeByValue(nodes: any[], value: any): any | null {
    for (const item of nodes) {
      if (item.data.value === value) {
        return item;
      }
      if (item.children && item.children.length > 0) {
        const found = this.findNodeByValue(item.children, value);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  private handleServerErrors(error: any) {
    this.messages = [];

    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      const errorKeyToFormControlName: any = {
        'code': 'code',
        'name.en': 'nameEn',
        'name.ar': 'nameAr',
        'status': 'status',
        'parent_id': 'parentId',
      };

      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          const formControlName = errorKeyToFormControlName[key];
          if (formControlName) {
            const control = this.isicForm.get(formControlName);
            if (control) {
              control.setErrors({ serverError: messages[0] });
              control.markAsTouched();
            }
          } else {
            this.messages.push({ severity: 'error', summary: '', detail: messages.join(', ') });
          }
        }
      }
    } else {
      this.messages.push({
        severity: 'error',
        summary: 'Error',
        detail: 'An unexpected error occurred.',
      });
    }
  }

  get code() {
    return this.isicForm.get('code');
  }

  get nameEn() {
    return this.isicForm.get('nameEn');
  }

  get nameAr() {
    return this.isicForm.get('nameAr');
  }

  get status() {
    return this.isicForm.get('status');
  }

  get parentId() {
    return this.isicForm.get('parentId');
  }

  submit() {
    this.messages = [];

    if (this.isicForm.invalid) {
      this.isicForm.markAllAsTouched();
      return;
    }
    const formValues = this.isicForm.value;
    const isicCode = {
      code: formValues.code,
      name: {
        en: formValues.nameEn,
        ar: formValues.nameAr,
      },
      status: formValues.status,
      parent_id: this.selectedNode.value,
    };

    if (this.isUpdate && this.selectedNodeId !== null) {
      const updateSub = this.isicCodesService.updateConsultingField(this.selectedNodeId, isicCode,'en').subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'ISIC Code updated successfully.',
          });
          this.loadIsicCodes();
          this.displayDialog = false;
          this.parentKey=null;
          this.selectedNode=null;
          this.isicForm.reset();
        },
        error: (error) => {
          this.handleServerErrors(error);
        },
      });
      this.unsubscribe.push(updateSub);
    } else {
      const createSub = this.isicCodesService.createConsultingField(isicCode,'en').subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'ISIC Code created successfully.',
          });
          this.loadIsicCodes();
          this.displayDialog = false;
          this.parentKey=null;
          this.selectedNode=null;
          this.isicForm.reset();
        },
        error: (error) => {
          this.handleServerErrors(error);
        },
      });
      this.unsubscribe.push(createSub);
    }
  }

  deleteIsicCode(node: any) {
    const id = node.node.data.key;
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this ISIC Code? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        const deleteSub = this.isicCodesService.deleteIsicCode(id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'ISIC Code deleted successfully.',
            });
            this.loadIsicCodes();
          },
          error: (error) => {
            this.handleServerErrors(error);
          },
        });
        this.unsubscribe.push(deleteSub);
      }
    });
  }

 
  applyFilter(event: any) {
    const searchTerm = event.target.value.trim().toLowerCase();

    if (!searchTerm) {
      // If search term is empty, reset to original data
      this.isicnodes = [...this.originalIsicNodes];
      return;
    }

    // Otherwise, filter nodes
    this.isicnodes = this.filterNodes(searchTerm, this.originalIsicNodes);
  }

  filterNodes(searchTerm: string, nodes: TreeNode[]): TreeNode[] {
    const filteredNodes: TreeNode[] = [];

    nodes.forEach((node) => {
      const matched = this.isMatch(searchTerm, node);
      const childMatches = this.filterNodes(searchTerm, node.children || []);

      if (matched || childMatches.length) {
        filteredNodes.push({
          ...node,
          children: childMatches,
        });
      }
    });

    return filteredNodes;
  }

  isMatch(searchTerm: string, node: TreeNode): boolean {
    return (
      node.data.code.toLowerCase().includes(searchTerm) ||
      node.data.label.toLowerCase().includes(searchTerm) ||
      node.data.nameEn.toLowerCase().includes(searchTerm) ||
      node.data.nameAr.toLowerCase().includes(searchTerm)
    );
  }
  
  onCancel() {
    this.displayDialog = false;
    this.parentKey=null;
    this.selectedNode=null
    this.isicForm.reset();
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }

  get hasSuccessMessage() {
    return this.messages.some((msg: any) => msg.severity === 'success');
  }

  get hasErrorMessage() {
    return this.messages.some((msg: any) => msg.severity === 'error');
  }
}