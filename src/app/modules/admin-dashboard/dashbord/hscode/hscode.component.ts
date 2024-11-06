import {
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Message, TreeNode } from 'primeng/api';
import { Table } from 'primeng/table';
import { Observable, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { HSCode, HSCodeService } from 'src/app/_fake/services/hs-code-management/hscode.service';
import { IsicCodesService } from 'src/app/_fake/services/isic-code/isic-codes.service';


@Component({
  selector: 'app-hscode',
  templateUrl: './hscode.component.html',
  styleUrls: ['./hscode.component.scss'],
})
export class HSCodeComponent implements OnInit {
  messages: Message[] = [];
  private unsubscribe: Subscription[] = [];
  listOfHSCodes: HSCode[] = [];
  isEditMode: boolean = false;
  isicTreeData: TreeNode[] = [];
  selectedNode:any;
  isLoading$: Observable<boolean>;
  selectedHSCodeId: number | null = null;
  visible: boolean = false;
  hscodeForm: FormGroup;
  statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' }
  ];
  constructor(
    private _hscodes: HSCodeService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private isicCodesService: IsicCodesService,
    private messageService: MessageService
  ) {
    this.isLoading$ = this._hscodes.isLoading$;
  }

  
ngOnInit(): void {
  this.hscodeForm = this.fb.group({
    arabicName: ['', Validators.required],
    englishName: ['', Validators.required],
    code: ['', Validators.required],
    status: ['', Validators.required],
  });

  this.loadIsicCodes(); // Method to populate isicTreeData
  this.getHSCodesList();
}
loadIsicCodes() {
  const listSub = this.isicCodesService.getIsicCodesTreeParent().subscribe({
    next: (res) => {
      console.log("res",res);
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
    this.visible = true;
    this.selectedHSCodeId = null;
    this.isEditMode = false;
    this.hscodeForm.reset();
  }

  editHSCode(hscode: HSCode) {
    this.visible = true;
    this.selectedHSCodeId = hscode.id;
    this.isEditMode = true;
    console.log(hscode);
    // Find the node in isicTreeData corresponding to isic_code_id
    this.selectedNode = this.findNodeById(this.isicTreeData, hscode.isic_code_id);
    console.log("this.selectedNode",this.selectedNode);
    // Patch the other fields in the form
    this.hscodeForm.patchValue({
      arabicName: hscode.names.ar,
      englishName: hscode.names.en,
      code: hscode.code,
      status: hscode.status,
    });
  }
  
  // Helper method to find a node by ID in a tree structure
  findNodeById(nodes: any[], id: any): TreeNode | null {
    console.log("nodes",nodes);
    for (const node of nodes) {
      if (node.value === id) {
        return node;
      }
      if (node.children) {
        const foundNode = this.findNodeById(node.children, id);
        if (foundNode) {
          return foundNode;
        }
      }
    }
    return null;
  }
  

  private handleServerErrors(error: any) {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      const errorKeyToFormControlName: any = {
        'name.en': 'englishName',
        'name.ar': 'arabicName',
        code: 'code',
        isic_code_id: 'isic_code_id',
        status: 'status',
      };

      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          const formControlName = errorKeyToFormControlName[key];
          if (formControlName) {
            const control = this.hscodeForm.get(formControlName);
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

  getHSCodesList() {
    const listSub = this._hscodes.getHSCodes().subscribe({
      next: (data: HSCode[]) => {
        this.listOfHSCodes = data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.messages = [];
        if (error.validationMessages) {
          this.messages = error.validationMessages;
        } else {
          this.messages.push({
            severity: 'error',
            summary: 'Error',
            detail: 'An unexpected error occurred.',
          });
        }
      },
    });
    this.unsubscribe.push(listSub);
  }

  @ViewChild('dt') table: Table;

  applyFilter(event: any) {
    const value = event.target.value.trim().toLowerCase();
    this.table.filterGlobal(value, 'contains');
  }

  get hasSuccessMessage() {
    return this.messages.some((msg) => msg.severity === 'success');
  }

  get hasErrorMessage() {
    return this.messages.some((msg) => msg.severity === 'error');
  }

  onCancel() {
    this.visible = false;
    this.hscodeForm.reset();
  }

  get arabicName() {
    return this.hscodeForm.get('arabicName');
  }

  get englishName() {
    return this.hscodeForm.get('englishName');
  }

  get code() {
    return this.hscodeForm.get('code');
  }

  get isic_code_id() {
    return this.hscodeForm.get('isic_code_id');
  }

  get status() {
    return this.hscodeForm.get('status');
  }

  submit() {
    this.messages = [];

    if (this.hscodeForm.invalid || !this.selectedNode) {
      this.hscodeForm.markAllAsTouched();
      return;
    }

    const formValues = this.hscodeForm.value;

    if (this.selectedHSCodeId) {
      const updatedData = {
        name: {
          en: formValues.englishName,
          ar: formValues.arabicName,
        },
        code: formValues.code,
        isic_code_id: this.selectedNode.value,
        status: formValues.status,
      };

      const updateSub = this._hscodes
        .updateHSCode(this.selectedHSCodeId, updatedData)
        .subscribe({
          next: (res: HSCode) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'HSCode updated successfully.',
            });
            this.getHSCodesList();
            this.visible = false;
            this.hscodeForm.reset();
          },
          error: (error) => {
            this.handleServerErrors(error);
          },
        });

      this.unsubscribe.push(updateSub);
    } else {
      const newHSCode: any = {
        name: {
          en: formValues.englishName,
          ar: formValues.arabicName,
        },
        code: formValues.code,
        isic_code_id: this.selectedNode.value,
        status: formValues.status,
      };

      const createSub = this._hscodes.createHSCode(newHSCode).subscribe({
        next: (res: any) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'HSCode created successfully.',
          });
          this.getHSCodesList();
          this.visible = false;
          this.hscodeForm.reset();
        },
        error: (error) => {
          this.handleServerErrors(error);
        },
      });

      this.unsubscribe.push(createSub);
    }
  }

  deleteHSCode(hscodeId: number) {
    this.messages = [];

    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this HSCode? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        const deleteSub = this._hscodes.deleteHSCode(hscodeId).subscribe({
          next: (res: any) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'HSCode deleted successfully.',
            });
            this.getHSCodesList();
          },
          error: (error) => {
            this.handleServerErrors(error);
          },
        });
      }
    });
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
