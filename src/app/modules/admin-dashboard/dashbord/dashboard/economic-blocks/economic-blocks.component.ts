import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { EconomicBlockService, AdminEconomicBloc, AdminEconomicBlocResponse } from 'src/app/_fake/services/economic-block/economic-block.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-economic-blocks',
  templateUrl: './economic-blocks.component.html',
  styleUrls: ['./economic-blocks.component.scss']
})
export class EconomicBlocksComponent implements OnInit {
  economicBlocks: AdminEconomicBloc[] = [];
  filteredBlocks: AdminEconomicBloc[] = [];
  displayDialog: boolean = false;
  editMode: boolean = false;
  selectedBlock: AdminEconomicBloc | null = null;
  blockForm: FormGroup;
  loading: boolean = false;
  searchTerm: string = '';

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
        this.filteredBlocks = [...this.economicBlocks];
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
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this economic block!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then((result) => {
      if (result.isConfirmed) {
        this.economicBlockService.deleteEconomicBloc(block.id).subscribe({
          next: () => {
            Swal.fire(
              'Deleted!',
              'Economic block has been deleted.',
              'success'
            );
            this.loadEconomicBlocks();
          },
          error: (error) => {
            Swal.fire(
              'Error!',
              'Failed to delete economic block.',
              'error'
            );
          }
        });
      }
    });
  }

  onSearch(event: any): void {
    const term = event.target.value.toLowerCase();
    this.searchTerm = term;
    this.filterBlocks();
  }

  filterBlocks(): void {
    if (!this.searchTerm) {
      this.filteredBlocks = [...this.economicBlocks];
    } else {
      this.filteredBlocks = this.economicBlocks.filter(block => 
        block.names.en.toLowerCase().includes(this.searchTerm) ||
        block.names.ar.toLowerCase().includes(this.searchTerm) ||
        block.id.toString().includes(this.searchTerm)
      );
    }
  }
}