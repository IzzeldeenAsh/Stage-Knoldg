import { Component, Injector, OnInit } from "@angular/core";
import { MessageService } from "primeng/api";
import { first } from "rxjs";
import { IKnoldgProfile } from "src/app/_fake/models/profile.interface";
import { ProfileService } from "src/app/_fake/services/profile-picture/profile.service";
import { ScrollAnimsService } from "src/app/_fake/services/scroll-anims/scroll-anims.service";
import { BaseComponent } from "src/app/modules/base.component";
import { TranslationService } from "src/app/modules/i18n";
import { ProfileService as GetProfileService } from "src/app/_fake/services/get-profile/get-profile.service";

@Component({
  selector: "app-overview",
  templateUrl: "./overview.component.html",
  styleUrl: "./overview.component.scss",
})
export class OverviewComponent extends BaseComponent implements OnInit {
  profile: IKnoldgProfile;
  lang: string = "en";
  loadingProfile: boolean = false;
  constructor(
    scrollAnims: ScrollAnimsService,
    private profileService: ProfileService,
    private getProfileService: GetProfileService,
    injector: Injector
  ) {
    super(injector);
  }
  ngOnInit(): void {
    this.getProfile();
    this.handleLanguage();
  }

  handleLanguage() {
      const onLanguageSub = this.translate
        .onLanguageChange()
        .subscribe((lang) => {
          this.lang = lang;
        });
      this.unsubscribe.push(onLanguageSub);
  }
  getProfile() {
    this.loadingProfile = true;
    const getProfileSub = this.getProfileService.getProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.loadingProfile = false;
        
        // Debug logs to check social data
        console.log('Profile roles:', this.profile?.roles);
        console.log('Profile social:', this.profile?.social);
        console.log('Company social:', this.profile?.company?.social);
        if (this.profile?.company?.social) {
          console.log('Company social length:', this.profile.company.social.length);
          console.log('Company social is array:', Array.isArray(this.profile.company.social));
        }
      },
      error: (error) => {
        this.loadingProfile = false;
      },
    });
    this.unsubscribe.push(getProfileSub);
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Preview the selected image

      this.uploadImage(file);
    }
  }

  uploadImage(file: File) {
    this.profileService
      .updateProfilePhoto(file)
      .pipe(first())
      .subscribe(
        (response: any) => {
          // Handle successful upload
          this.messageService.add({
            severity: "success",
            summary: "Profile Picture Updated",
            detail: "Your profile picture has been updated successfully.",
          });
          document.location.reload();
        },
        (error: any) => {
          // Handle error
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: "An error occurred while updating your profile picture.",
          });
        }
      );
  }

  getLogoBackgroundImage(){
    return this.profile.profile_photo_url ? `url(${this.profile.profile_photo_url})` : 'url(../../../assets/media/svg/avatars/blank.svg)';
  }

  hasCompanySocial(): boolean {
    // More defensive check to ensure the social array exists and has items
    return !!this.profile?.company?.social && Array.isArray(this.profile?.company?.social) && this.profile?.company?.social?.length > 0;
  }

  // Combine both personal and company social links
  getSocialLinks(): any[] {
    let socialLinks: any[] = [];
    
    // Add user's personal social links if available
    if (this.profile?.social && Array.isArray(this.profile.social)) {
      socialLinks = [...this.profile.social];
    }
    
    // Add company social links if available
    if (this.profile?.company?.social && Array.isArray(this.profile.company.social)) {
      socialLinks = [...socialLinks, ...this.profile.company.social];
    }
    
    return socialLinks;
  }

  // Debug method to check company social data in console
  logCompanySocial(): void {
    console.log('Company social data:', this.profile?.company?.social);
  }
}
