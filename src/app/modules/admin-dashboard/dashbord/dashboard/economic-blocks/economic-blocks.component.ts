import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { EconomicBlockService, AdminEconomicBloc, AdminEconomicBlocResponse } from 'src/app/_fake/services/economic-block/economic-block.service';

@Component({
  selector: 'app-economic-blocks',
  templateUrl: './economic-blocks.component.html',
  styleUrls: ['./economic-blocks.component.scss']
})
export class EconomicBlocksComponent implements OnInit {
  economicBlocks: AdminEconomicBloc[] = [];
  displayDialog: boolean = false;
  editMode: boolean = false;
  selectedBlock: AdminEconomicBloc | null = null;
  blockForm: FormGroup;
  loading: boolean = false;

  constructor(
    private economicBlockService: EconomicBlockService,
    private messageService: MessageService,
    private fb: FormBuilder
  ) {
    this.blockForm = this.fb.group({
      name: this.fb.group({
        en: ['', Validators.required],
        ar: ['', Validators.required]
      })
    });
  }

  ngOnInit(): void {
    this.loadEconomicBlocks();
  }

  loadEconomicBlocks(): void {
    this.loading = true;
    this.economicBlockService.getAdminEconomicBlocs().subscribe({
      next: (response: AdminEconomicBlocResponse) => {
        this.economicBlocks = response.data;
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load economic blocks' });
        this.loading = false;
      }
    });
  }

  showAddDialog(): void {
    this.editMode = false;
    this.selectedBlock = null;
    this.blockForm.reset();
    this.displayDialog = true;
  }

  showEditDialog(block: AdminEconomicBloc): void {
    this.editMode = true;
    this.selectedBlock = block;
    this.blockForm.patchValue({
      name: {
        en: block.names.en,
        ar: block.names.ar
      }
    });
    this.displayDialog = true;
  }

  hideDialog(): void {
    this.displayDialog = false;
    this.blockForm.reset();
  }

  saveBlock(): void {
    if (this.blockForm.invalid) {
      return;
    }

    const blockData = this.blockForm.value;
    
    if (this.editMode && this.selectedBlock) {
      this.economicBlockService.updateEconomicBloc(this.selectedBlock.id, blockData).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Economic block updated successfully' });
          this.loadEconomicBlocks();
          this.hideDialog();
        },
        error: (error) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update economic block' });
        }
      });
    } else {
      this.economicBlockService.createEconomicBloc(blockData).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Economic block created successfully' });
          this.loadEconomicBlocks();
          this.hideDialog();
        },
        error: (error) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create economic block' });
        }
      });
    }
  }

  deleteBlock(block: AdminEconomicBloc): void {
    if (confirm('Are you sure you want to delete this economic block?')) {
      this.economicBlockService.deleteEconomicBloc(block.id).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Economic block deleted successfully' });
          this.loadEconomicBlocks();
        },
        error: (error) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete economic block' });
        }
      });
    }
  }
} 