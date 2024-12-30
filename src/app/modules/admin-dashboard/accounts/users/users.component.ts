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
  currentInsighterId: number | null = null;
  currentInsighterStatus: string = '';
  insighterItems: MenuItem[] = [];

  companyInsighterDialog: boolean = false;
  selectedCompanyInsighter: IForsightaProfile = {} as IForsightaProfile;
  currentCompanyInsighterId: number | null = null;
  currentCompanyStatus: string = '';
  items: MenuItem[] = [];

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

  // Utility Methods
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

  hideDialog(): void {
    this.clientDialog = false;
    this.insighterDialog = false;
    this.companyInsighterDialog = false;
  }

  // Client Methods
  loadClients(): void {
    this.usersListService.getClients().subscribe({
      next: (data) => {
        this.clients = data;
        this.originalClients = data;
      },
      error: (err) => this.handleServerErrors(err)
    });
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
      title: 'Enter note for client deletion',
      input: 'textarea',
      inputPlaceholder: 'Enter your staff notes here...',
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'You need to enter a note!';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const staffNotes = result.value;
        this.usersListService.deactivateAndDeleteClient(clientId, staffNotes).subscribe({
          next: () => {
            this.loadClients();
            this.showSuccess('', 'Client deactivated and deleted successfully');
          },
          error: (err) => {
            this.handleServerErrors(err);
          }
        });
      }
    });
  }

  applyClientFilter(event: any): void {
    const query = (event.target.value || '').toLowerCase();
    this.clients = this.originalClients.filter(client =>
      (client.name && client.name.toLowerCase().includes(query)) ||
      (client.email && client.email.toLowerCase().includes(query)) ||
      (client.first_name && client.first_name.toLowerCase().includes(query)) ||
      (client.last_name && client.last_name.toLowerCase().includes(query))
    );
  }

  // Individual Insighter Methods
  loadIndividualInsighters(): void {
    this.usersListService.getInsighters().subscribe({
      next: (data) => {
        this.individualInsighters = data;
        this.originalIndividualInsighters = data;
      },
      error: (err) => this.handleServerErrors(err)
    });
  }

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
            this.deactivateInsighter(this.currentInsighterId);
          }
        },
        disabled: this.currentInsighterStatus === 'inactive'
      },
      {
        label: 'Deactivate & delete',
        icon: 'pi pi-trash',
        command: () => {
          if (this.currentInsighterId !== null) {
            this.deactivateInsighterWithDateDelete(this.currentInsighterId);
          }
        },
      },
     
    ];
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
            this.deactivateInsighter(this.currentInsighterId);
          }
        },
        disabled: this.currentInsighterStatus === 'inactive'
      },
      {
        label: 'Deactivate & delete',
        icon: 'pi pi-trash',
        command: () => {
          if (this.currentInsighterId !== null) {
            this.deactivateInsighterWithDateDelete(this.currentInsighterId);
          }
        },
      },
     
    ];
  }

  setCurrentInsighter(insighterId: number, status: string): void {
    this.currentInsighterId = insighterId;
    this.currentInsighterStatus = status.toLowerCase();
    this.updateInsighterMenuItems();
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

  activateInsighter(insighterId: number, status: string): void {
    const action = status === 'active' ? 'activated' : 'deactivated';
    
    Swal.fire({
      title: `Enter note for ${action} insighter`,
      input: 'textarea',
      inputPlaceholder: 'Enter your staff notes here...',
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'You need to enter a note!';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const staffNotes = result.value;
        const activateSub = this.usersListService.activateInsighter(insighterId, staffNotes).subscribe({
          next: () => {
            this.loadIndividualInsighters();
            this.currentInsighterStatus = status.toLowerCase();
            this.updateInsighterMenuItems();
            this.showSuccess('', `Insighter ${action} successfully.`);
          },
          error: (err) => {
            this.handleServerErrors(err);
          },
        });
        this.unsubscribe.push(activateSub);
      }
    });
  }

  deactivateInsighter(insighterId: number): void {
    Swal.fire({
      title: 'Enter note for deactivated insighter',
      input: 'textarea',
      inputPlaceholder: 'Enter your staff notes here...',
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'You need to enter a note!';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const staffNotes = result.value;
        const deactivateSub = this.usersListService.deactivateInsighter(insighterId, staffNotes).subscribe({
          next: () => {
            this.loadIndividualInsighters();
            this.currentInsighterStatus = 'inactive';
            this.updateInsighterMenuItems();
            this.showSuccess('', 'Insighter deactivated successfully.');
          },
          error: (err) => {
            this.handleServerErrors(err);
          },
        });
        this.unsubscribe.push(deactivateSub);
      }
    });
  }

  deactivateInsighterWithDateDelete(insighterId: number): void {
    Swal.fire({
      title: 'Enter note for deactivated insighter with date delete',
      input: 'textarea',
      inputPlaceholder: 'Enter your staff notes here...',
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'You need to enter a note!';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const staffNotes = result.value;
        const deactivateSub = this.usersListService.deactivateInsighterWithDataDelete(insighterId, staffNotes).subscribe({
          next: () => {
            this.loadIndividualInsighters();
            this.currentInsighterStatus = 'inactive';
            this.updateInsighterMenuItems();
            this.showSuccess('', 'Insighter deactivated with date delete successfully.');
          },
          error: (err) => {
            this.handleServerErrors(err);
          },
        });
        this.unsubscribe.push(deactivateSub);
      }
    });
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

  deleteInsighter(insighterId: number): void {
   const deleteSub = this.usersListService.deleteInsighter(insighterId).subscribe({
      next: () => {
        this.loadIndividualInsighters();
        this.loadClients();
        this.showSuccess('', 'Insighter deleted successfully.');
      },
      error: (err) => {
        this.handleServerErrors(err);
      }
    });
    this.unsubscribe.push(deleteSub);
  }

  applyInsighterFilter(event: any): void {
    const query = (event.target.value || '').toLowerCase();
    this.individualInsighters = this.originalIndividualInsighters.filter(insighter =>
      (insighter.name && insighter.name.toLowerCase().includes(query)) ||
      (insighter.email && insighter.email.toLowerCase().includes(query)) ||
      (insighter.country && insighter.country.toLowerCase().includes(query))
    );
  }

  // Company Insighter Methods
  loadCompanyInsighters(): void {
    this.usersListService.getCompanyInsighters().subscribe({
      next: (data) => {
        this.companyInsighters = data;
        this.originalCompanyInsighters = data;
      },
      error: (err) => this.handleServerErrors(err)
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
            this.deactivateCompanyInsighter(this.currentCompanyInsighterId);
          }
        },
        disabled: this.currentCompanyStatus === 'inactive'
      },
      {
        label: 'Deactivate with date delete',
      icon: 'pi pi-trash',
        command: () => {
          if (this.currentCompanyInsighterId !== null) {
            this.deactivateCompanyWithDateDelete(this.currentCompanyInsighterId);
          }
        },
        disabled: this.currentCompanyStatus === 'inactive'
      }
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
            this.deactivateCompanyInsighter(this.currentCompanyInsighterId);
          }
        },
        disabled: this.currentCompanyStatus === 'inactive'
      },
      {
        label: 'Deactivate & delete',
        icon: 'pi pi-trash',
        command: () => {
          if (this.currentCompanyInsighterId !== null) {
            this.deactivateCompanyWithDateDelete(this.currentCompanyInsighterId);
          }
        },
        // disabled: this.currentCompanyStatus === 'inactive'
      },
     
    ];
  }

  deactivateCompanyWithDateDelete(companyInsighterId: number): void {
    Swal.fire({
      title: 'Enter note for deactivated company insighter with date delete',
      input: 'textarea',
      inputPlaceholder: 'Enter your staff notes here...',
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'You need to enter a note!';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const staffNotes = result.value;
        const deactivateSub = this.usersListService.deactivateCompanyWithDataDelete(companyInsighterId, staffNotes).subscribe({
          next: () => {
            this.loadCompanyInsighters();
            this.currentCompanyStatus = 'inactive';
            this.updateMenuItems();
            this.showSuccess('', 'Company insighter deactivated with date delete successfully.');
          },
          error: (err) => {
            this.handleServerErrors(err);
          },
        });
        this.unsubscribe.push(deactivateSub);
      }
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

  activateCompanyInsighter(companyInsighterId: number, status: string): void {
    const action = status === 'active' ? 'activated' : 'deactivated';
    
    Swal.fire({
      title: `Enter note for ${action} company insighter`,
      input: 'textarea', 
      inputPlaceholder: 'Enter your staff notes here...',
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'You need to enter a note!';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const staffNotes = result.value;
        const activateSub = this.usersListService.activateCompanyInsighter(companyInsighterId, staffNotes).subscribe({
          next: () => {
            this.loadCompanyInsighters();
            this.currentCompanyStatus = status.toLowerCase();
            this.updateMenuItems();
            this.showSuccess('', `Company insighter ${action} successfully.`);
          },
          error: (err) => {
            this.handleServerErrors(err);
          },
        });
        this.unsubscribe.push(activateSub);
      }
    });
  }

  deactivateCompanyInsighter(companyInsighterId: number): void {
    Swal.fire({
      title: 'Enter note for deactivated company insighter',
      input: 'textarea',
      inputPlaceholder: 'Enter your staff notes here...',
      showCancelButton: true,
      confirmButtonText: 'Submit', 
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'You need to enter a note!';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const staffNotes = result.value;
        const deactivateSub = this.usersListService.deactivateCompanyInsighter(companyInsighterId, staffNotes).subscribe({
          next: () => {
            this.loadCompanyInsighters();
            this.currentCompanyStatus = 'inactive';
            this.updateMenuItems();
            this.showSuccess('', 'Company insighter deactivated successfully.');
          },
          error: (err) => {
            this.handleServerErrors(err);
          },
        });
        this.unsubscribe.push(deactivateSub);
      }
    });
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
        this.handleServerErrors(err);
      }
    });
    this.unsubscribe.push(deleteSub);
  }

  private handleServerErrors(error: any) {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
         this.showError('',messages.join(", "));
        }
      }
    } else {
  
      this.showError('','An unexpected error occurred.');
    }
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
