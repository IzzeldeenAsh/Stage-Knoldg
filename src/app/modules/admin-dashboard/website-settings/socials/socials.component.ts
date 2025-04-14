import { Component, OnInit } from '@angular/core';
import { WebsiteSettingsService } from '../website-settings.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';

interface Social {
  id: number;
  key: string;
  value: string;
  type?: string;
}

@Component({
  selector: 'app-socials',
  templateUrl: './socials.component.html',
  styleUrls: ['./socials.component.scss']
})
export class SocialsComponent implements OnInit {
  socials: Social[] = [];
  loading: boolean = false;
  editForm: FormGroup;
  editingId: number | null = null;

  constructor(
    private websiteSettingsService: WebsiteSettingsService,
    private fb: FormBuilder,
    private messageService: MessageService
  ) {
    this.editForm = this.fb.group({
      value: ['', Validators.required],
      type: ['social']
    });
  }

  ngOnInit(): void {
    this.loadSocials();
  }

  loadSocials(): void {
    this.loading = true;
    this.websiteSettingsService.getConfiguration().subscribe({
      next: (response) => {
        if (response && response.data) {
          this.socials = response.data.filter((item: any) => 
            item.key === 'facebook' || 
            item.key === 'x' || 
            item.key === 'instagram' ||
            item.key === 'phone' ||
            item.key === 'email' ||
            item.key === 'postal'
          );
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading socials:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load social media links'
        });
        this.loading = false;
      }
    });
  }

  editSocial(social: Social): void {
    this.editingId = social.id;
    this.editForm.patchValue({
      value: social.value,
      type: 'social'
    });
  }

  saveSocial(): void {
    if (this.editForm.valid && this.editingId) {
      this.loading = true;
      this.websiteSettingsService.updateConfiguration(this.editingId, this.editForm.value).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Social media link updated successfully'
          });
          this.loadSocials();
          this.cancelEdit();
        },
        error: (error) => {
          console.error('Error updating social:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update social media link'
          });
          this.loading = false;
        }
      });
    }
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editForm.reset({
      type: 'social'
    });
  }
} 