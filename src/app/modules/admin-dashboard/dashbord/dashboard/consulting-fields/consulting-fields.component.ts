import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TreeNode, MessageService } from 'primeng/api';
import { TreeTable } from 'primeng/treetable';
import { Observable, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { ConsultingFieldTreeService } from 'src/app/_fake/services/consulting-fields-tree/consulting-fields-tree.service';
import { TranslationService } from 'src/app/modules/i18n';

@Component({
  selector: 'app-consulting-fields',
  templateUrl: './consulting-fields.component.html',
  styleUrls: ['./consulting-fields.component.scss'],
})
export class ConsultingFieldsComponent implements OnInit, OnDestroy {
  isicForm!: FormGroup;
  isicnodes!: TreeNode[];
  originalIsicNodes!: TreeNode[];
  isicTreeData!: TreeNode[];
  selectedNodeId: number | null = null;
  displayDialog: boolean = false;
  isUpdate: boolean = false;

    // Add this to hold parent-level only data
    parentsOnlyTreeData!: TreeNode[];


  statusOptions = [
    { label: 'All',        value: '' },
    { label: 'Active',     value: 'active' },
    { label: 'Inactive',   value: 'inactive' },
    { label: 'Suggestion', value: 'suggestion' }
  ];
  selectedStatus: string = '';
  searchTerm: string = '';
  isLoading$: Observable<boolean>;
  messages: any[] = [];
  selectedParentNode: any;
  private unsubscribe: Subscription[] = [];

  @ViewChild('tt') treeTable!: TreeTable; 

  constructor(
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private messageService: MessageService,
    private isicCodesService: ConsultingFieldTreeService,
    private trans: TranslationService
  ) {
    this.isLoading$ = this.isicCodesService.isLoading$;
  }

  ngOnInit() {
    this.isicForm = this.fb.group({
      nameEn:   ['', Validators.required],
      nameAr:   ['', Validators.required],
      status:   ['', Validators.required],
      parentNode: [null],
    });

    this.loadIsicCodes();
  }

  loadIsicCodes() {
    const listSub = this.isicCodesService.getConsultingCodesTree('en').subscribe({
      next: (res) => {
        this.isicnodes = res;
        this.originalIsicNodes = [...res];
        this.isicTreeData = this.changeKeyToValue([...res]);

        // Strip out children so only the top-level (parents) appear
        this.parentsOnlyTreeData = this.isicTreeData.map(node => {
          return {
            ...node,
            children: [] // remove children
          };
        });

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.handleServerErrors(error);
      },
    });
    this.unsubscribe.push(listSub);
  }

  changeKeyToValue(nodes: TreeNode[]): TreeNode[] {
    return nodes.map((node) => {
      const newNode = {
        ...node,
        value: node.data.key,
        children: node.children ? this.changeKeyToValue(node.children) : [],
      };
      delete newNode.key;

      if (newNode.data && newNode.data.key !== undefined) {
        newNode.data = {
          ...newNode.data,
          value: newNode.data.key,
        };
        delete newNode.data.key;
      }

      return newNode;
    });
  }

  showDialog() {
    this.displayDialog = true;
    this.isUpdate = false;
    this.isicForm.reset();
  }

  editIsicCode(rowNode: any) {
    this.displayDialog = true;
    this.selectedParentNode = null;
    this.isUpdate = true;
    // This is the node you clicked to edit
    const dataNode = rowNode.node.data;
    this.selectedNodeId = dataNode.key;
    const parentValue = rowNode.node.parent ? rowNode.node.parent.data.key : null;
    if(parentValue) {
      this.selectedParentNode = this.parentsOnlyTreeData.find((node:any) => node.value === parentValue);
    }
    this.isicForm.patchValue({
      nameEn: dataNode.nameEn,
      nameAr: dataNode.nameAr,
      status: dataNode.status,
      parentNode: this.selectedParentNode,
    });
  }

  submit() {
    this.messages = [];
    if (this.isicForm.invalid) {
      this.isicForm.markAllAsTouched();
      return;
    }

    const formValues = this.isicForm.value;
    // Construct the payload that the backend expects
    const isicCode = {
      name: {
        en: formValues.nameEn,
        ar: formValues.nameAr,
      },
      status: formValues.status,
      parent_id: formValues.parentNode ? formValues.parentNode.value : 0,
    };

    if (this.isUpdate && this.selectedNodeId !== null) {
      // Update mode
      const updateSub = this.isicCodesService
        .updateConsultingField(this.selectedNodeId, isicCode, 'en')
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Consulting field updated successfully.',
            });
            this.loadIsicCodes();
            this.displayDialog = false;
            this.isicForm.reset();
          },
          error: (error) => {
            this.handleServerErrors(error);
          },
        });
      this.unsubscribe.push(updateSub);
    } else {
      // Create mode
      const createSub = this.isicCodesService
        .createConsultingField(isicCode, 'en')
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Consulting field created successfully.',
            });
            this.loadIsicCodes();
            this.displayDialog = false;
            this.isicForm.reset();
          },
          error: (error) => {
            this.handleServerErrors(error);
          },
        });
      this.unsubscribe.push(createSub);
    }
  }

  deleteIsicCode(rowNode: any) {
    const id = rowNode.node.data.key;
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this field? This action cannot be undone.',
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
              detail: 'Consulting field deleted successfully.',
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
    this.searchTerm = event.target.value.trim().toLowerCase();
    this.applyFilters();
  }

  applyStatusFilter() {
    this.applyFilters();
  }

  applyFilters() {
    this.isicnodes = this.filterNodesRecursively(
      this.originalIsicNodes,
      this.selectedStatus,
      this.searchTerm.toLowerCase()
    );
  }

  filterNodesRecursively(nodes: TreeNode[], selectedStatus: string, searchTerm: string): TreeNode[] {
    const filteredNodes: TreeNode[] = [];
    for (const node of nodes) {
      const childMatches = node.children
        ? this.filterNodesRecursively(node.children, selectedStatus, searchTerm)
        : [];
      const matchesCurrentNode = this.isNodeMatch(node, selectedStatus, searchTerm);

      if (matchesCurrentNode || childMatches.length > 0) {
        filteredNodes.push({
          ...node,
          children: childMatches,
        });
      }
    }
    return filteredNodes;
  }

  isNodeMatch(node: TreeNode, selectedStatus: string, searchTerm: string): boolean {
    const { status, code, label, nameEn, nameAr } = node.data;
    const statusMatches = !selectedStatus || status === selectedStatus;

    const termMatches =
      !searchTerm ||
      (code && code.toLowerCase().includes(searchTerm)) ||
      (label && label.toLowerCase().includes(searchTerm)) ||
      (nameEn && nameEn.toLowerCase().includes(searchTerm)) ||
      (nameAr && nameAr.toLowerCase().includes(searchTerm));

    return statusMatches && termMatches;
  }

  onCancel() {
    this.displayDialog = false;
    this.isicForm.reset();
  }

  private handleServerErrors(error: any) {
    this.messages = [];
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      const errorKeyToFormControlName: any = {
        'name.en': 'nameEn',
        'name.ar': 'nameAr',
        'status': 'status',
        'parent_id': 'parentNode',
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
            this.messages.push({
              severity: 'error',
              summary: '',
              detail: messages.join(', '),
            });
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

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }

  get nameEn()   { return this.isicForm.get('nameEn');   }
  get nameAr()   { return this.isicForm.get('nameAr');   }
  get status()   { return this.isicForm.get('status');   }
  get parentNode() { return this.isicForm.get('parentNode'); }

  get hasSuccessMessage() {
    return this.messages.some((msg) => msg.severity === 'success');
  }
  get hasErrorMessage() {
    return this.messages.some((msg) => msg.severity === 'error');
  }
}