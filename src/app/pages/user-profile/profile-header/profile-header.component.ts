import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { IForsightaProfile } from 'src/app/_fake/models/profile.interface';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { ProfileService } from 'src/app/_fake/services/profile-picture/profile.service';

@Component({
  selector: 'app-profile-header',
  templateUrl: './profile-header.component.html',
  styleUrls: ['./profile-header.component.scss'],
  providers: [MessageService],
})
export class ProfileHeaderComponent implements OnInit {
  @Input() profile: IForsightaProfile;
  @Output() photoupdated: EventEmitter<void> = new EventEmitter<void>();

  selectedImage: any = null;
  profileImage: string;

  constructor(
    private messageService: MessageService,
    private profileService: ProfileService,
    private http: HttpClient
  ) {}

  ngOnInit() {

    this.profileImage = this.getProfileImage();
  }

  getProfileImage(): string {
    console.log('this.selectediamge',this.profile);
    if (this.selectedImage) {
      return this.selectedImage;
    } else if (this.profile.company?.logo) {
      return this.profile.company.logo;
    } else if (this.profile.profile_photo_url) {
      return this.profile.profile_photo_url;
    } else {
      return 'assets/media/avatars/blank.png';
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Preview the selected image
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImage = e.target.result;
        this.profileImage = this.selectedImage;
      };
      reader.readAsDataURL(file);

      // Upload the image to the server
      this.uploadImage(file);
    }
  }

  onCancel(): void {
    // Reset the selected image
    this.selectedImage = null;
    this.profileImage = this.getProfileImage();
  }

  onRemove(): void {
    // Call service to remove the image on the server
    this.profileService.removeProfilePhoto().subscribe(
      (response:any) => {
        this.profileImage = 'assets/media/avatars/blank.png';
        this.photoupdated.emit();
        this.messageService.add({
          severity: 'success',
          summary: 'Profile Picture Removed',
          detail: 'Your profile picture has been removed successfully.',
        });
      },
      (error:any) => {
        // Handle error
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'An error occurred while removing your profile picture.',
        });
      }
    );
  }

  uploadImage(file: File): void {
    this.profileService.updateProfilePhoto(file).subscribe(
      (response:any) => {
        // Handle successful upload
        this.photoupdated.emit();
        this.messageService.add({
          severity: 'success',
          summary: 'Profile Picture Updated',
          detail: 'Your profile picture has been updated successfully.',
        });
        document.location.reload();
      },
      (error:any) => {
        // Handle error
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'An error occurred while updating your profile picture.',
        });
      }
    );
  }
}
