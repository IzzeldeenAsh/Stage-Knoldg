import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormsModule } from '@angular/forms';
import { RegionsService, Continent, Region } from '../../_fake/services/region/regions.service';
import { InputTextModule } from 'primeng/inputtext';
import { TruncateTextPipe } from 'src/app/pipes/truncate-pipe/truncate-text.pipe';

@Component({
  selector: 'app-select-region',
  standalone: true,
  imports: [CommonModule, DialogModule, MultiSelectModule, TruncateTextPipe, FormsModule, InputTextModule],
  templateUrl: './select-region.component.html',
  styleUrls: ['./select-region.component.scss']
})
export class SelectRegionComponent implements OnInit {
  @Input() placeholder: string = 'Select Region...';
  @Input() title: string = 'Select Regions';
  @Output() regionsSelected = new EventEmitter<Continent[]>();

  dialogVisible: boolean = false;
  regions: Continent[] = [];
  selectedRegions: Continent[] = [];
  displayValue: string = '';

  constructor(private regionsService: RegionsService) {}

  ngOnInit() {
    this.loadRegions();
  }

  loadRegions() {
    this.regionsService.getRegionsList().subscribe({
      next: (regions) => {
        this.regions = regions;
      },
      error: (error) => {
        console.error('Error loading regions:', error);
      }
    });
  }

  showDialog() {
    this.dialogVisible = true;
  }

  onRegionsSelect(regions: Continent[]) {
    this.selectedRegions = regions;
    this.displayValue = this.selectedRegions.map(region => region.name).join(', ');
  }

  onConfirm() {
    if (this.selectedRegions && this.selectedRegions.length > 0) {
      this.regionsSelected.emit(this.selectedRegions);
    }
    this.dialogVisible = false;
  }

  getCountryFlagPath(flag: string): string {
    try { 
      return `../../../assets/media/flags/${flag}.svg`;
    } catch {
      return `../../../assets/media/flags/default.svg`;
    }
  }

  onFlagError(event: any) {
    event.target.src = `../../../../assets/media/flags/default.svg`;
  }
}
