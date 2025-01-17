import { Component, OnInit } from '@angular/core';
import { KnowldegePackegesService, Package } from 'src/app/_fake/services/knowldege-packages/knowldege-packeges.service';
import Swal from 'sweetalert2';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ScheduleDialogComponent } from './schedule-dialog/schedule-dialog.component';

@Component({
  selector: 'app-packages',
  templateUrl: './packages.component.html',
  providers: [DialogService]
})
export class PackagesComponent implements OnInit {
  private packageService: KnowldegePackegesService;
  packages: Package[] = [];
  isLoading$: any;
  ref: DynamicDialogRef | undefined;

  constructor(
    packageService: KnowldegePackegesService,
    public dialogService: DialogService
  ) {
    this.packageService = packageService;
    this.isLoading$ = this.packageService.isLoading$;
  }

  ngOnInit(): void {
    this.loadPackages();
  }

  loadPackages() {
    this.packageService.getPackages().subscribe({
      next: (response) => {
        this.packages = response.data;
      },
      error: (error) => {
        console.error('Error loading packages:', error);
      }
    });
  }

  onDelete(packageId: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this package!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it'
    }).then((result) => {
      if (result.isConfirmed) {
        this.packageService.deletePackage(packageId).subscribe({
          next: () => {
            this.loadPackages();
            Swal.fire('Deleted!', 'Package has been deleted.', 'success');
          },
          error: (error) => {
            console.error('Error deleting package:', error);
            Swal.fire('Error!', 'Failed to delete package.', 'error');
          }
        });
      }
    });
  }

  updateStatus(packageId: number, status: 'scheduled' | 'published' | 'unpublished') {
    if (status === 'published') {
      const currentDateTime = this.getFormattedDateTime();
      this.packageService.updatePackageStatus(packageId, status, currentDateTime).subscribe({
        next: () => {
          this.loadPackages();
          Swal.fire('Updated!', 'Package status has been updated.', 'success');
        },
        error: (error) => {
          console.error('Error updating package status:', error);
          Swal.fire('Error!', 'Failed to update package status.', 'error');
        }
      });
    } else if (status === 'scheduled') {
      this.ref = this.dialogService.open(ScheduleDialogComponent, {
        header: 'Schedule Package',
        width: '400px',
        data: {}
      });

      this.ref.onClose.subscribe((selectedDateTime: string | null) => {
        if (selectedDateTime) {
          const date = new Date(selectedDateTime);
          const formattedDate = this.formatDateToString(date);
          this.packageService.updatePackageStatus(packageId, status, formattedDate).subscribe({
            next: () => {
              this.loadPackages();
              Swal.fire('Scheduled!', 'Package has been scheduled.', 'success');
            },
            error: (error) => {
              console.error('Error scheduling package:', error);
              Swal.fire('Error!', 'Failed to schedule package.', 'error');
            }
          });
        }
      });
    } else if (status === 'unpublished') {
      this.packageService.updatePackageStatus(packageId, status).subscribe({
        next: () => {
          this.loadPackages();
          Swal.fire('Updated!', 'Package status has been updated.', 'success');
        },
        error: (error) => {
          console.error('Error updating package status:', error);
          Swal.fire('Error!', 'Failed to update package status.', 'error');
        }
      });
    }
  }

  private getFormattedDateTime(): string {
    const now = new Date();
    return this.formatDateToString(now);
  }

  private formatDateToString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  ngOnDestroy() {
    if (this.ref) {
      this.ref.close();
    }
  }
} 