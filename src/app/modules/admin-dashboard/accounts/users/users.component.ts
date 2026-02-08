import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { UsersListService } from 'src/app/_fake/services/users-list/users-list.service';
import { IKnoldgProfile } from 'src/app/_fake/models/profile.interface';

interface DataState {
  clients: boolean;
  insighters: boolean;
  companies: boolean;
}

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  providers: [MessageService]
})
export class UsersComponent implements OnInit, OnDestroy {
  @ViewChild('clientsTable') clientsTable?: Table;
  @ViewChild('insightersTable') insightersTable?: Table;
  @ViewChild('companiesTable') companiesTable?: Table;

  clients: IKnoldgProfile[] = [];
  insighters: IKnoldgProfile[] = [];
  companies: IKnoldgProfile[] = [];

  activeTab = 0;
  searchValue = '';

  private readonly subscriptions: Subscription[] = [];
  private loaded: DataState = {
    clients: false,
    insighters: false,
    companies: false
  };

  get isLoading$() {
    return this.usersListService.isLoading$;
  }

  get totalClients(): number {
    return this.clients.length;
  }

  get totalInsighters(): number {
    return this.insighters.length;
  }

  get totalCompanies(): number {
    return this.companies.length;
  }

  constructor(
    private readonly usersListService: UsersListService,
    private readonly messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadClients();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  onTabChange(index: number): void {
    this.activeTab = index;
    this.resetSearch();
    this.clientsTable?.clear();
    this.insightersTable?.clear();
    this.companiesTable?.clear();

    if (index === 0) {
      this.loadClients();
    } else if (index === 1) {
      this.loadInsighters();
    } else {
      this.loadCompanies();
    }
  }

  applyFilter(value: string, table: 'clients' | 'insighters' | 'companies'): void {
    const normalized = value?.trim().toLowerCase() ?? '';
    if (table === 'clients' && this.clientsTable) {
      this.clientsTable.filterGlobal(normalized, 'contains');
    }
    if (table === 'insighters' && this.insightersTable) {
      this.insightersTable.filterGlobal(normalized, 'contains');
    }
    if (table === 'companies' && this.companiesTable) {
      this.companiesTable.filterGlobal(normalized, 'contains');
    }
  }

  clearFilters(): void {
    this.resetSearch();
    this.clientsTable?.clear();
    this.insightersTable?.clear();
    this.companiesTable?.clear();
  }

  private loadClients(force = false): void {
    if (!force && this.loaded.clients) {
      return;
    }
    const sub = this.usersListService.getClients().subscribe({
      next: (data) => {
        this.clients = data.filter((client) => client.roles.length === 1) || [];
        this.loaded.clients = true;
        this.clientsTable?.clear();
      },
      error: (error) => {
        this.showError(this.extractErrorMessage(error, 'Could not load clients. Please try again.'));
      }
    });
    this.subscriptions.push(sub);
  }

  private loadInsighters(force = false): void {
    if (!force && this.loaded.insighters) {
      return;
    }
    const sub = this.usersListService.getInsighters().subscribe({
      next: (data) => {
        this.insighters = data || [];
        this.loaded.insighters = true;
        this.insightersTable?.clear();
      },
      error: (error) => {
        this.showError(this.extractErrorMessage(error, 'Could not load insighters. Please try again.'));
      }
    });
    this.subscriptions.push(sub);
  }

  private loadCompanies(force = false): void {
    if (!force && this.loaded.companies) {
      return;
    }
    const sub = this.usersListService.getCompanyInsighters().subscribe({
      next: (data) => {
        this.companies = data || [];
        this.loaded.companies = true;
        this.companiesTable?.clear();
      },
      error: (error) => {
        this.showError(this.extractErrorMessage(error, 'Could not load companies. Please try again.'));
      }
    });
    this.subscriptions.push(sub);
  }

  async deactivateClient(client: IKnoldgProfile): Promise<void> {
    const notes = await this.promptForNotes('Deactivate & Delete Client', 'Provide notes for this action');
    if (!notes) {
      return;
    }

    const sub = this.usersListService
      .deactivateAndDeleteClient(client.id, notes)
      .subscribe({
        next: () => {
          this.showSuccess(`Client ${client.name} removed successfully.`);
          this.loadClients(true);
        },
        error: (error) => {
          this.showError(this.extractErrorMessage(error, 'Could not process the request. Please try again.'));
        }
      });
    this.subscriptions.push(sub);
  }

  async handleInsighterAction(
    insighter: IKnoldgProfile,
    action: 'activate' | 'deactivate' | 'deactivate-delete'
  ): Promise<void> {
    const actionLabels = {
      activate: 'Activate Insighter',
      deactivate: 'Deactivate Insighter',
      'deactivate-delete': 'Deactivate & Delete Insighter'
    };

    const notes = await this.promptForNotes(actionLabels[action], 'Staff notes are required for this action');
    if (!notes) {
      return;
    }

    let request$;
    if (action === 'activate') {
      request$ = this.usersListService.activateInsighter(insighter.id, notes);
    } else if (action === 'deactivate') {
      request$ = this.usersListService.deactivateInsighter(insighter.id, notes);
    } else {
      request$ = this.usersListService.deactivateInsighterWithDataDelete(insighter.id, notes);
    }

    const sub = request$.subscribe({
      next: () => {
        this.showSuccess(`Action completed for ${insighter.name}.`);
        this.loadInsighters(true);
      },
      error: (error) => {
        this.showError(this.extractErrorMessage(error, 'Could not process the request. Please try again.'));
      }
    });
    this.subscriptions.push(sub);
  }

  async handleCompanyAction(
    company: IKnoldgProfile,
    action: 'activate' | 'deactivate' | 'deactivate-delete'
  ): Promise<void> {
    const actionLabels = {
      activate: 'Activate Company',
      deactivate: 'Deactivate Company',
      'deactivate-delete': 'Deactivate & Delete Company'
    };

    const notes = await this.promptForNotes(actionLabels[action], 'Staff notes are required for this action');
    if (!notes) {
      return;
    }

    let request$;
    if (action === 'activate') {
      request$ = this.usersListService.activateCompanyInsighter(company.id, notes);
    } else if (action === 'deactivate') {
      request$ = this.usersListService.deactivateCompanyInsighter(company.id, notes);
    } else {
      request$ = this.usersListService.deactivateCompanyWithDataDelete(company.id, notes);
    }

    const sub = request$.subscribe({
      next: () => {
        this.showSuccess(`Action completed for ${company.name}.`);
        this.loadCompanies(true);
      },
      error: (error) => {
        this.showError(this.extractErrorMessage(error, 'Could not process the request. Please try again.'));
      }
    });
    this.subscriptions.push(sub);
  }

  private async promptForNotes(title: string, placeholder: string): Promise<string | null> {
    const result = await Swal.fire({
      title,
      input: 'textarea',
      inputLabel: 'Staff notes',
      inputPlaceholder: placeholder,
      inputAttributes: {
        'aria-label': 'Staff notes'
      },
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Staff notes are required.';
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#1b84ff',
      cancelButtonColor: '#a1a5b7'
    });

    return result.isConfirmed && result.value ? result.value.trim() : null;
  }

  private showSuccess(message: string): void {
    this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
  }

  private showError(message: string): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
  }

  private resetSearch(): void {
    this.searchValue = '';
  }

  private extractErrorMessage(error: any, fallback: string): string {
    return error?.error?.message || error?.message || fallback;
  }

  formatNames(items?: Array<{ name?: string } | string>): string {
    if (!Array.isArray(items) || !items.length) {
      return '-';
    }

    const names = items
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }
        return item?.name ?? '';
      })
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    return names.length ? names.join(', ') : '-';
  }
}
