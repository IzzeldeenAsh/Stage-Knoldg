import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Message } from "primeng/api";
import { Table } from "primeng/table";
import { Observable, Subscription } from "rxjs";
import { Position, PositionsService } from "src/app/_fake/services/positions/positions.service";
import Swal from 'sweetalert2';

@Component({
  selector: 'app-positions',
  templateUrl: './positions.component.html',
  styleUrl: './positions.component.scss'
})
export class PositionsComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  private unsubscribe: Subscription[] = [];
  listOfPositions: Position[] = [];
  isEditMode: boolean = false;
  isLoading$: Observable<boolean>;
  selectedPositionId: number | null = null;
  visible: boolean = false;
  newPositionAr: string = '';
  newPositionEn: string = '';

  @ViewChild("dt") table: Table;

  constructor(
    private positionsService: PositionsService,
    private cdr: ChangeDetectorRef
  ) {
    this.isLoading$ = this.positionsService.isLoading$;
  }

  ngOnInit(): void {
    this.getPositionsList();
  }

  showDialog() {
    this.visible = true;
    this.newPositionEn = '';
    this.newPositionAr = '';
    this.selectedPositionId = null;
    this.isEditMode = false;
  }

  editPosition(position: Position) {
    this.visible = true;
    this.newPositionEn = position.names.en;
    this.newPositionAr = position.names.ar;
    this.selectedPositionId = position.id;
    this.isEditMode = true;
  }

  get hasSuccessMessage(){
    return this.messages.some(msg=>msg.severity ==='success')
   }
   get hasErrorMessage() {
    return this.messages.some(msg => msg.severity === 'error');
  }

  getPositionsList() {
    const listSub = this.positionsService.getPositions().subscribe({
      next: (data: Position[]) => {
        this.listOfPositions = data;
        this.cdr.detectChanges();
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

  submit() {
    if (this.selectedPositionId) {
      // Update existing position
      const updatedData = {
        name: {
          en: this.newPositionEn,
          ar: this.newPositionAr
        }
      };

      const updateSub = this.positionsService.updatePosition(this.selectedPositionId, updatedData).subscribe({
        next: (res: Position) => {
          this.messages.push({
            severity: 'success',
            summary: 'Success',
            detail: 'Position updated successfully.'
          });
          this.getPositionsList();
          this.visible = false;
        },
        error: (error) => {
          this.messages = error.validationMessages || [{
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update position.'
          }];
          this.visible = false;
        }
      });

      this.unsubscribe.push(updateSub);
    } else {
      // Create new position
      const newPosition: any = {
        name: {
          en: this.newPositionEn,
          ar: this.newPositionAr
        }
      };

      const createSub = this.positionsService.createPosition(newPosition).subscribe({
        next: (res: any) => {
          this.messages.push({
            severity: 'success',
            summary: 'Success',
            detail: 'Position created successfully.'
          });
          this.getPositionsList();
          this.visible = false;
        },
        error: (error) => {
          this.messages = error.validationMessages || [{
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create position.'
          }];
        }
      });

      this.unsubscribe.push(createSub);
    }
  }

  deletePosition(positionId: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this position? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const deleteSub = this.positionsService.deletePosition(positionId).subscribe({
          next: (res: any) => {
            this.messages.push({
              severity: 'success',
              summary: 'Success',
              detail: 'Position deleted successfully.'
            });
            this.getPositionsList();
          },
          error: (error) => {
            this.messages = error.validationMessages || [{
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete position.'
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