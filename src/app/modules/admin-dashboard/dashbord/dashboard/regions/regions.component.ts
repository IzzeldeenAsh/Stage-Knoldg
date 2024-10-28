import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Message } from "primeng/api";
import { Table } from "primeng/table";
import { Observable, Subscription } from "rxjs";
import Swal from 'sweetalert2';
import { Region, RegionsService } from "src/app/_fake/services/region/regions.service";

@Component({
  selector: "app-regions",
  templateUrl: "./regions.component.html",
  styleUrls: ["./regions.component.scss"],
})
export class RegionsComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  private unsubscribe: Subscription[] = [];
  listOfRegions: Region[] = [];
  isEditMode: boolean = false;
  isLoading$: Observable<boolean>;
  selectedRegionId: number | null = null;
  visible: boolean = false;

  // Form fields
  newRegionEn: string = '';
  newRegionAr: string = '';

  @ViewChild("dt") table: Table;

  constructor(
    private regionsService: RegionsService,
    private cdr: ChangeDetectorRef
  ) {
    this.isLoading$ = this.regionsService.isLoading$;
  }

  ngOnInit(): void {
    this.getRegionsList();
  }

  showDialog() {
    this.visible = true;
    this.resetForm();
    this.selectedRegionId = null;
    this.isEditMode = false;
  }

  editRegion(region: Region) {
    this.visible = true;
    this.newRegionEn = region.names.en;
    this.newRegionAr = region.names.ar;
    this.selectedRegionId = region.id;
    this.isEditMode = true;
  }

  resetForm() {
    this.newRegionEn = '';
    this.newRegionAr = '';
  }

  getRegionsList() {
    const listSub = this.regionsService.getRegions().subscribe({
      next: (data: Region[]) => {
        this.listOfRegions = data;
        this.cdr.detectChanges();
        console.log("listOfRegions", this.listOfRegions);
      },
      error: (error) => {
        this.messages = [];

        if (error.validationMessages) {
          this.messages = error.validationMessages;
        } else {
          this.messages.push({
            severity: "error",
            summary: "Error",
            detail: "An unexpected error occurred.",
          });
        }
      },
    });
    this.unsubscribe.push(listSub);
  }

  applyFilter(event: any) {
    const value = event.target.value.trim().toLowerCase();
    this.table.filterGlobal(value, "contains");
  }
  get hasSuccessMessage(){
    return this.messages.some(msg=>msg.severity ==='success')
   }
   get hasErrorMessage() {
    return this.messages.some(msg => msg.severity === 'error');
  }

  submit() {
    this.messages=[]
    const regionData = {
      name: {
        en: this.newRegionEn,
        ar: this.newRegionAr
      }
    };

    if (this.selectedRegionId) {
      // Update existing region
      const updateSub = this.regionsService.updateRegion(this.selectedRegionId, regionData).subscribe({
        next: (res: Region) => {
          this.messages.push({
            severity: 'success',
            summary: 'Success',
            detail: 'Region updated successfully.'
          });
          this.getRegionsList();
          this.visible = false;
        },
        error: (error) => {
          this.messages = error.validationMessages || [{
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update region.'
          }];
          this.visible = false;
        }
      });

      this.unsubscribe.push(updateSub);
    } else {
      // Create new region
      const createSub = this.regionsService.createRegion(regionData).subscribe({
        next: (res: any) => {
          this.messages.push({
            severity: 'success',
            summary: 'Success',
            detail: 'Region created successfully.'
          });
          this.getRegionsList();
          this.visible = false;
        },
        error: (error) => {
          this.messages = error.validationMessages || [{
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create region.'
          }];
        }
      });

      this.unsubscribe.push(createSub);
    }
  }

  deleteRegion(regionId: number) {
    this.messages=[]
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this region? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const deleteSub = this.regionsService.deleteRegion(regionId).subscribe({
          next: (res: any) => {
            this.messages.push({
              severity: 'success',
              summary: 'Success',
              detail: 'Region deleted successfully.'
            });
            this.getRegionsList();
          },
          error: (error) => {
            this.messages = error.validationMessages || [{
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete region.'
            }];
          }
        });
        this.unsubscribe.push(deleteSub);
      }
    });
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
