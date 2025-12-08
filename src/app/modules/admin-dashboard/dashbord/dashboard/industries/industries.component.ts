import {
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
  Injector,
} from '@angular/core';
import { TreeNode } from 'primeng/api';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import Swal from 'sweetalert2';
import { TreeTable } from 'primeng/treetable';
import { IndustryService } from 'src/app/_fake/services/industries/industry.service';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-industries',
  templateUrl: './industries.component.html',
  styleUrls: ['./industries.component.scss'],
})
export class IndustriesComponent extends BaseComponent implements OnInit {
  messages: any[] = [];

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

  selectedParentNode: TreeNode | number = 0;

  constructor(
     injector: Injector,
    private cdr: ChangeDetectorRef,
    private industriesService: IndustryService,
    private fb: FormBuilder,
    // private messageService: MessageService,
    // private trans: TranslationService
  ) {
    super(injector);
    this.isLoading$ = this.industriesService.isLoading$;
  }

  ngOnInit() {
    this.isicForm = this.fb.group({
      nameEn: ['', Validators.required],
      nameAr: ['', Validators.required],
      status: ['', Validators.required],
      parentNode: [0],
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
    this.selectedParentNode = 0;
    this.isicForm.reset();
  }

  editIsicCode(rowNode: any) {
    this.displayDialog = true;
    this.isUpdate = true;
    this.selectedParentNode = 0;

    const dataNode = rowNode.node.data;
    this.selectedNodeId = dataNode.key;

    const parentValue = rowNode.node.parent ? rowNode.node.parent.data.key : 0;
    if (parentValue) {
      this.selectedParentNode = this.parentsOnlyTreeData.find(
        (node: any) => node.value === parentValue
      ) || 0;
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
    const hasActiveFilter = !!(this.selectedStatus || this.searchTerm);
    this.isicnodes = this.filterNodesRecursively(
      this.originalIsicNodes,
      this.selectedStatus,
      this.searchTerm.toLowerCase()
    );
    if (hasActiveFilter) {
      this.expandAllVisibleNodes();
    }
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

  private expandAllVisibleNodes(): void {
    if (!this.isicnodes || this.isicnodes.length === 0) {
      return;
    }
    const expandRecursively = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        node.expanded = true;
        if (node.children && node.children.length > 0) {
          expandRecursively(node.children);
        }
      }
    };
    expandRecursively(this.isicnodes);
    this.cdr.detectChanges();
  }

  onCancel() {
    this.displayDialog = false;
    this.selectedParentNode = 0;
    this.isicForm.reset();
  }

  private handleServerErrors(error: any) {
    // Prefer toast errors + inline field errors
    const defaultSummary = this.lang === 'ar' ? 'حدث خطأ' : 'An error occurred';
    try {
      const serverErrors = error?.error?.errors;
      const topMessage = error?.error?.message;

      if (topMessage && (!serverErrors || !serverErrors.common)) {
        this.showError(defaultSummary, topMessage);
      }

      if (serverErrors) {
        const errorKeyToFormControlName: Record<string, string> = {
          'name.en': 'nameEn',
          'name.ar': 'nameAr',
          status: 'status',
          parent_id: 'parentNode',
        };

        Object.keys(serverErrors).forEach((key) => {
          const messages = serverErrors[key];
          const joined = Array.isArray(messages) ? messages.join(', ') : String(messages);

          // Map known keys to form controls for inline display
          const controlName = errorKeyToFormControlName[key];
          if (controlName) {
            const control = this.isicForm.get(controlName);
            if (control) {
              control.setErrors({ serverError: joined });
              control.markAsTouched();
            }
            return;
          }

          // 'common' or any other non-field error -> toast
          this.showError(defaultSummary, joined);
        });
        return;
      }

      // Fallback generic
      this.showError(defaultSummary, this.lang === 'ar' ? 'حدث خطأ غير متوقع.' : 'An unexpected error occurred.');
    } catch {
      this.showError(defaultSummary, this.lang === 'ar' ? 'حدث خطأ غير متوقع.' : 'An unexpected error occurred.');
    }
  }

  // ngOnDestroy() {
  //   this.unsubscribe.forEach((sb) => sb.unsubscribe());
  // }

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