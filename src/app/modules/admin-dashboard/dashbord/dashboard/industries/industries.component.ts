import {
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { TreeNode, MessageService } from 'primeng/api';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { TreeTable } from 'primeng/treetable';
import { TranslationService } from 'src/app/modules/i18n';
import { IndustryService } from 'src/app/_fake/services/industries/industry.service';

@Component({
  selector: 'app-industries',
  templateUrl: './industries.component.html',
  styleUrls: ['./industries.component.scss'],
})
export class IndustriesComponent implements OnInit, OnDestroy {
  messages: any[] = [];
  private unsubscribe: Subscription[] = [];

  isicnodes!: TreeNode[];
  originalIsicNodes!: TreeNode[];
  isicTreeData!: TreeNode[];

  parentsOnlyTreeData!: TreeNode[];

  statusOptions = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Suggestion', value: 'suggestion' },
  ];

  isicForm!: FormGroup;
  displayDialog = false;
  isUpdate = false;
  selectedNodeId: number | null = null;
  isLoading$: Observable<boolean>;
  @ViewChild('tt') treeTable!: TreeTable;
  lang = 'en';
  selectedStatus = '';
  searchTerm = '';

  selectedParentNode: TreeNode | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private industriesService: IndustryService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private trans: TranslationService
  ) {
    this.isLoading$ = this.industriesService.isLoading$;
  }

  ngOnInit() {
    this.isicForm = this.fb.group({
      nameEn: ['', Validators.required],
      nameAr: ['', Validators.required],
      status: ['', Validators.required],
      parentNode: [null],
    });

    this.loadIndustries();
  }

  loadIndustries() {
    const listSub = this.industriesService.getIsicCodesTree('en').subscribe({
      next: (res) => {
        this.isicnodes = res;
        this.originalIsicNodes = [...res];

        this.isicTreeData = this.changeKeyToValue([...res]);

        this.parentsOnlyTreeData = this.isicTreeData.map((node) => {
          return {
            ...node,
            children: [],
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
    this.selectedParentNode = null;
    this.isicForm.reset();
  }

  editIsicCode(rowNode: any) {
    this.displayDialog = true;
    this.isUpdate = true;
    this.selectedParentNode = null;

    const dataNode = rowNode.node.data;
    this.selectedNodeId = dataNode.key;

    const parentValue = rowNode.node.parent ? rowNode.node.parent.data.key : null;
    if (parentValue) {
      this.selectedParentNode = this.parentsOnlyTreeData.find(
        (node: any) => node.value === parentValue
      ) || null;
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
    const isicCode = {
      name: {
        en: formValues.nameEn,
        ar: formValues.nameAr,
      },
      status: formValues.status,
      parent_id: formValues.parentNode ? formValues.parentNode.value : 0,
    };

    if (this.isUpdate && this.selectedNodeId !== null) {
      const updateSub = this.industriesService
        .updateIsicCode(this.selectedNodeId, isicCode)
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Industry updated successfully.',
            });
            this.loadIndustries();
            this.displayDialog = false;
            this.isicForm.reset();
          },
          error: (error) => {
            this.handleServerErrors(error);
          },
        });
      this.unsubscribe.push(updateSub);
    } else {
      const createSub = this.industriesService
        .createIsicCode(isicCode, 'en')
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Industry created successfully.',
            });
            this.loadIndustries();
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
      text: 'Do you want to delete this Industry? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        const deleteSub = this.industriesService.deleteIsicCode(id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Industry deleted successfully.',
            });
            this.loadIndustries();
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

  filterNodesRecursively(
    nodes: TreeNode[],
    selectedStatus: string,
    searchTerm: string
  ): TreeNode[] {
    const filteredNodes: TreeNode[] = [];

    for (const node of nodes) {
      const childMatches = node.children
        ? this.filterNodesRecursively(node.children, selectedStatus, searchTerm)
        : [];
      const matches = this.isNodeMatch(node, selectedStatus, searchTerm);

      if (matches || childMatches.length > 0) {
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
        status: 'status',
        parent_id: 'parentNode',
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

  get nameEn() {
    return this.isicForm.get('nameEn');
  }
  get nameAr() {
    return this.isicForm.get('nameAr');
  }
  get status() {
    return this.isicForm.get('status');
  }
  get parentNode() {
    return this.isicForm.get('parentNode');
  }

  get hasSuccessMessage() {
    return this.messages.some((msg: any) => msg.severity === 'success');
  }
  get hasErrorMessage() {
    return this.messages.some((msg: any) => msg.severity === 'error');
  }
}