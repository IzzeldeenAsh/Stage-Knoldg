 // Start of Selection
import { Component, Injector, OnInit } from '@angular/core';
import { UsersListService } from 'src/app/_fake/services/users-list/users-list.service';
import { IForsightaProfile } from 'src/app/_fake/models/profile.interface';
import Swal from 'sweetalert2';
import { BaseComponent } from 'src/app/modules/base.component';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent extends BaseComponent implements OnInit {
  private bgClasses: string[] = [
    'bg-light-success',
    'bg-light-danger',
    'bg-light-warning',
    'bg-light-info',
    'bg-light-primary',
  ];

  // Arrays to display in the tables
  clients: IForsightaProfile[] = [];
  individualInsighters: IForsightaProfile[] = [];
  companyInsighters: IForsightaProfile[] = [];

  // Original arrays to preserve data for filtering
  originalClients: IForsightaProfile[] = [];
  originalIndividualInsighters: IForsightaProfile[] = [];
  originalCompanyInsighters: IForsightaProfile[] = [];

  isLoading: boolean = false;

  // Dialogs
  clientDialog: boolean = false;
  selectedClient: IForsightaProfile = {} as IForsightaProfile;
  
  insighterDialog: boolean = false;
  selectedInsighter: IForsightaProfile = {} as IForsightaProfile;
  currentCompanyInsighterId: number | null = null;
  companyInsighterDialog: boolean = false;
  selectedCompanyInsighter: IForsightaProfile = {} as IForsightaProfile;
  items: MenuItem[] = [];
  currentCompanyStatus: string = '';
  insighterItems: MenuItem[] = [];
  currentInsighterId: number | null = null;
  currentInsighterStatus: string = '';

  constructor(injector: Injector, private usersListService: UsersListService) {
    super(injector);
  }

  ngOnInit(): void {
    this.loadClients();
    this.loadIndividualInsighters();
    this.loadCompanyInsighters();
    this.initializeMenuItems();
    this.initializeInsighterMenuItems();
  }
  // Initialize menu items for Individual Insighters
  initializeInsighterMenuItems(): void {
    this.insighterItems = [
      {
        label: 'Activate',
        icon: 'pi pi-check',
        command: () => {
          if (this.currentInsighterId !== null) {
            this.activateInsighter(this.currentInsighterId, 'active');
          }
        },
        disabled: this.currentInsighterStatus === 'active'
      },
      {
        label: 'Deactivate',
        icon: 'pi pi-times',
        command: () => {
          if (this.currentInsighterId !== null) {
            this.activateInsighter(this.currentInsighterId, 'inactive');
          }
        },
        disabled: this.currentInsighterStatus === 'inactive'
      },
     
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => {
          if (this.currentInsighterId !== null) {
            this.confirmDeleteInsighter(this.currentInsighterId);
          }
        }
      }
    ];
  }
  activateInsighter(insighterId: number, status: string): void {
    const action = status === 'active' ? 'activated' : 'deactivated';
    // Assuming there's a service method to activate/deactivate an insighter
    const activateSub = this.usersListService.activateInsighter(insighterId, status).subscribe({
      next: () => {
        this.loadIndividualInsighters();
        this.currentInsighterStatus = status.toLowerCase();
        this.updateInsighterMenuItems();
        this.showSuccess('', `Insighter ${action} successfully.`);
      },
      error: () => {
        this.showError('', `There was a problem ${action} the insighter.`);
      },
    });
    this.unsubscribe.push(activateSub);
  }
  updateInsighterMenuItems(): void {
    this.insighterItems = [
      {
        label: 'Activate',
        icon: 'pi pi-check',
        command: () => {
          if (this.currentInsighterId !== null) {
            this.activateInsighter(this.currentInsighterId, 'active');
          }
        },
        disabled: this.currentInsighterStatus === 'active'
      },
      {
        label: 'Deactivate',
        icon: 'pi pi-times',
        command: () => {
          if (this.currentInsighterId !== null) {
            this.activateInsighter(this.currentInsighterId, 'inactive');
          }
        },
        disabled: this.currentInsighterStatus === 'inactive'
      },
     
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => {
          if (this.currentInsighterId !== null) {
            this.confirmDeleteInsighter(this.currentInsighterId);
          }
        }
      }
    ];
  }
  setCurrentInsighter(insighterId: number, status: string): void {
    this.currentInsighterId = insighterId;
    this.currentInsighterStatus = status.toLowerCase();
    this.updateInsighterMenuItems();
  }
  confirmDeleteInsighter(insighterId: number): void {
    Swal.fire({
      title: 'Are you sure you want to delete this insighter?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteInsighter(insighterId);
      }
    });
  }
  initializeMenuItems(): void {
    this.items = [
      {
        label: 'Activate',
        icon: 'pi pi-check',
        command: () => {
          if (this.currentCompanyInsighterId !== null) {
            this.activateCompanyInsighter(this.currentCompanyInsighterId, 'active');
          }
        },
        disabled: this.currentCompanyStatus === 'active'
      },
      {
        label: 'Deactivate',
        icon: 'pi pi-times',
        command: () => {
          if (this.currentCompanyInsighterId !== null) {
            this.activateCompanyInsighter(this.currentCompanyInsighterId, 'inactive');
          }
        },
        disabled: this.currentCompanyStatus === 'inactive'
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => {
          if (this.currentCompanyInsighterId !== null) {
            this.confirmDeleteCompanyInsighter(this.currentCompanyInsighterId);
          }
        },
      },
    ];
  }

  updateMenuItems(): void {
    this.items = [
      {
        label: 'Activate',
        icon: 'pi pi-check',
        command: () => {
          if (this.currentCompanyInsighterId !== null) {
            this.activateCompanyInsighter(this.currentCompanyInsighterId, 'active');
          }
        },
        disabled: this.currentCompanyStatus === 'active'
      },
      {
        label: 'Deactivate',
        icon: 'pi pi-times',
        command: () => {
          if (this.currentCompanyInsighterId !== null) {
            this.activateCompanyInsighter(this.currentCompanyInsighterId, 'inactive');
          }
        },
        disabled: this.currentCompanyStatus === 'inactive'
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => {
          if (this.currentCompanyInsighterId !== null) {
            this.confirmDeleteCompanyInsighter(this.currentCompanyInsighterId);
          }
        },
      },
    ];
  }

  confirmDeleteCompanyInsighter(companyInsighterId: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to delete this company insighter?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteCompanyInsighter(companyInsighterId);
      }
    });
  }

  getInitials(fullName: string): string {
    if (!fullName) return '';
    const names = fullName.split(' ');
    const initials = names.map(name => name.charAt(0).toUpperCase());
    return initials.slice(0, 2).join('');
  }

  /**
   * Returns a random background class from the predefined list.
   * @returns A background class string
   */
  getRandomBgClass(): string {
    const randomIndex = Math.floor(Math.random() * this.bgClasses.length);
    return this.bgClasses[randomIndex];
  }

  // Clients
  loadClients(): void {
    this.usersListService.getClients().subscribe({
      next: (data) => {
        this.clients = data;
        this.originalClients = data;
      },
      error: (err) => console.error(err)
    });
  }

  setCurrentCompanyInsighter(insighterId: number): void {
    this.currentCompanyInsighterId = insighterId;
    const insighter = this.companyInsighters.find(ci => ci.id === insighterId);
    if (insighter && insighter.company) {
      this.currentCompanyStatus = insighter.company.status.toLowerCase();
    } else {
      this.currentCompanyStatus = '';
    }
    this.updateMenuItems();
  }

  activateCompanyInsighter(companyInsighterId: number, status: string): void {
    const action = status === 'active' ? 'activated' : 'deactivated';
    const activateSub = this.usersListService.activateCompanyInsighter(companyInsighterId, status).subscribe({
      next: () => {
        this.loadCompanyInsighters();
        this.currentCompanyStatus = status.toLowerCase();
        this.updateMenuItems();
        this.showSuccess('', `Company insighter ${action} successfully.`);
      },
      error: () => {
        this.showError('', `There was a problem ${action} the company insighter.`);
      },
    });
    this.unsubscribe.push(activateSub);
  }

  openNewClient(): void {
    this.selectedClient = {} as IForsightaProfile;
    this.clientDialog = true;
  }

  editClient(client: IForsightaProfile): void {
    this.selectedClient = { ...client };
    this.clientDialog = true;
  }

  saveClient(): void {
    if (this.selectedClient.id) {
      // Update client logic
      // this.usersListService.updateClient(this.selectedClient).subscribe(...)
    } else {
      // Create client logic
      // this.usersListService.createClient(this.selectedClient).subscribe(...)
    }
    this.clientDialog = false;
    this.loadClients();
  }

  deleteClient(clientId: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to delete this client?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.usersListService.deleteClient(clientId).subscribe({
          next: () => {
            this.loadClients();
            this.showSuccess('','Client deleted successfully');
          },
          error: (err) => {
            console.error(err);
            this.showError('','There was a problem deleting the client.');
          }
        });
      }
    });
  }

  hideDialog(): void {
    this.clientDialog = false;
    this.insighterDialog = false;
    this.companyInsighterDialog = false;
  }

  // Individual Insighters
  loadIndividualInsighters(): void {
    this.usersListService.getInsighters().subscribe({
      next: (data) => {
        this.individualInsighters = data;
        this.originalIndividualInsighters = data;
      },
      error: (err) => console.error(err)
    });
  }

  openNewInsighter(): void {
    this.selectedInsighter = {} as IForsightaProfile;
    this.insighterDialog = true;
  }

  editInsighter(insighter: IForsightaProfile): void {
    this.selectedInsighter = { ...insighter };
    this.insighterDialog = true;
  }

  saveInsighter(): void {
    if (this.selectedInsighter.id) {
      // Update insighter logic
      // this.usersListService.updateInsighter(this.selectedInsighter).subscribe(...)
    } else {
      // Create insighter logic
      // this.usersListService.createInsighter(this.selectedInsighter).subscribe(...)
    }
    this.insighterDialog = false;
    this.loadIndividualInsighters();
  }

  deleteInsighter(insighterId: number): void {
   const deleteSub = this.usersListService.deleteInsighter(insighterId).subscribe({
      next: () => {
        this.loadIndividualInsighters();
        this.loadClients();
        this.showSuccess('', 'Insighter deleted successfully.');
      },
      error: (err) => {
        console.error(err);
        this.showError('', 'There was a problem deleting the insighter.');
      }
    });
    this.unsubscribe.push(deleteSub);
  }

  // Company Insighters
  loadCompanyInsighters(): void {
    this.usersListService.getCompanyInsighters().subscribe({
      next: (data) => {
        this.companyInsighters = data;
        this.originalCompanyInsighters = data;
      },
      error: (err) => console.error(err)
    });
  }

  openNewCompanyInsighter(): void {
    this.selectedCompanyInsighter = {} as IForsightaProfile;
    this.companyInsighterDialog = true;
  }

  editCompanyInsighter(companyInsighter: IForsightaProfile): void {
    this.selectedCompanyInsighter = { ...companyInsighter };
    this.companyInsighterDialog = true;
    this.setCurrentCompanyInsighter(companyInsighter.id);
  }

  saveCompanyInsighter(): void {
    if (this.selectedCompanyInsighter.id) {
      // Update company insighter logic
      // this.usersListService.updateCompanyInsighter(this.selectedCompanyInsighter).subscribe(...)
    } else {
      // Create company insighter logic
      // this.usersListService.createCompanyInsighter(this.selectedCompanyInsighter).subscribe(...)
    }
    this.companyInsighterDialog = false;
    this.loadCompanyInsighters();
  }

  deleteCompanyInsighter(companyInsighterId: number): void {
  const deleteSub = this.usersListService.deleteCompanyInsighter(companyInsighterId).subscribe({
      next: () => {
        this.loadCompanyInsighters();
        this.loadClients();
        this.showSuccess('', 'Insighter deleted successfully.');
        if (this.currentCompanyInsighterId === companyInsighterId) {
          this.currentCompanyInsighterId = null;
          this.currentCompanyStatus = '';
          this.updateMenuItems();
        }
      },
      error: (err) => {
        console.error(err);
        this.showError('', 'There was a problem deleting the insighter.');
      }
    });
    this.unsubscribe.push(deleteSub);
  }

  // Filtering Methods
  applyClientFilter(event: any): void {
    const query = (event.target.value || '').toLowerCase();
    this.clients = this.originalClients.filter(client =>
      (client.name && client.name.toLowerCase().includes(query)) ||
      (client.email && client.email.toLowerCase().includes(query)) ||
      (client.first_name && client.first_name.toLowerCase().includes(query)) ||
      (client.last_name && client.last_name.toLowerCase().includes(query))
    );
  }

  applyInsighterFilter(event: any): void {
    const query = (event.target.value || '').toLowerCase();
    this.individualInsighters = this.originalIndividualInsighters.filter(insighter =>
      (insighter.name && insighter.name.toLowerCase().includes(query)) ||
      (insighter.email && insighter.email.toLowerCase().includes(query)) ||
      (insighter.country && insighter.country.toLowerCase().includes(query))
    );
  }

  applyCompanyInsighterFilter(event: any): void {
    const query = (event.target.value || '').toLowerCase();
    this.companyInsighters = this.originalCompanyInsighters.filter(ci =>
      (ci.name && ci.name.toLowerCase().includes(query)) ||
      (ci.email && ci.email.toLowerCase().includes(query)) ||
      (ci.company?.legal_name && ci.company.legal_name.toLowerCase().includes(query))
    );
  }
}
