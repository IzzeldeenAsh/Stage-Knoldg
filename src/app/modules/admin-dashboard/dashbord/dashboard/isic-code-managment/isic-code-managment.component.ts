import {
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { TreeNode, MessageService } from 'primeng/api';
import { IsicCodesService } from 'src/app/_fake/services/isic-code/isic-codes.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subscription, of } from 'rxjs';
import Swal from 'sweetalert2';
import { TreeTable } from 'primeng/treetable';

@Component({
  selector: 'app-isic-code-managment',
  templateUrl: './isic-code-managment.component.html',
  styleUrls: ['./isic-code-managment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ISICCodeManagmentComponent implements OnInit, OnDestroy {
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
  selectedNode: any;
  isUpdate: boolean = false;
  selectedNodeId: number | null = null;
  isLoading$: Observable<boolean>;
  parentKey: number | null = null;

  @ViewChild('tt') treeTable!: TreeTable; // Reference to the TreeTable

  constructor(
    private cdr: ChangeDetectorRef,
    private isicCodesService: IsicCodesService,
    private fb: FormBuilder,
    private messageService: MessageService
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
    this.isLoading$ = of(true);
    const listSub = this.isicCodesService.getIsicCodesTree('en').subscribe({
      next: (res) => {
        this.isicnodes = res;
        this.originalIsicNodes = [...res];  // Store original data here
        this.isicTreeData = this.changeKeyToValue([...res]); // Transform for the tree select
        this.isLoading$ = of(false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading$ = of(false);
        this.handleServerErrors(error);
      },
    });
    this.unsubscribe.push(listSub);
  }

  changeKeyToValue(nodes: any) {
    return nodes.map((node: any) => {
      const newNode = {
        ...node,
        value: node.data.key, // Set the top-level 'value' from 'key'
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
    this.selectedNodeId = null; // Reset for create
    this.parentKey = null;
    this.selectedNode = null;
    this.isUpdate = false; // Set mode to create
    this.isicForm.reset();
  }

  editIsicCode(node: any) {
    this.displayDialog = true; // Open dialog
    this.selectedNodeId = node.node.data.key; // Set the ID for update
    this.isUpdate = true; // Editing mode
    
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
      parent_id: this.selectedNode ? this.selectedNode.value : null,
    };

    if (this.isUpdate && this.selectedNodeId !== null) {
      const updateSub = this.isicCodesService.updateIsicCode(this.selectedNodeId, isicCode).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'ISIC Code updated successfully.',
          });
          this.loadIsicCodes();
          this.displayDialog = false;
          this.parentKey = null;
          this.selectedNode = null;
          this.isicForm.reset();
        },
        error: (error) => {
          this.handleServerErrors(error);
        },
      });
      this.unsubscribe.push(updateSub);
    } else {
      const createSub = this.isicCodesService.createIsicCode(isicCode).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'ISIC Code created successfully.',
          });
          this.loadIsicCodes();
          this.displayDialog = false;
          this.parentKey = null;
          this.selectedNode = null;
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

  // Updated search using built-in TreeTable filtering
  applyFilter(event: any) {
    const searchTerm = event.target.value;
    this.treeTable.filterGlobal(searchTerm, 'contains');
  }

  onCancel() {
    this.displayDialog = false;
    this.parentKey = null;
    this.selectedNode = null;
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
