import { Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IKnoldgProfile } from 'src/app/_fake/models/profile.interface';
import { ProfileService } from 'src/app/_fake/services/profile-picture/profile.service';
import { ScrollAnimsService } from 'src/app/_fake/services/scroll-anims/scroll-anims.service';
import { BaseComponent } from 'src/app/modules/base.component';
import { ProfileService as GetProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';

interface SocialLink {
  type: string;
  link: string;
}

@Component({
  selector: 'app-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.scss']
})
export class CompanyComponent extends BaseComponent implements OnInit {
  profile: IKnoldgProfile = {} as IKnoldgProfile;
  id: string = '';
  loadingProfile: boolean = true;
  isMe: boolean = false;
  lang: string = 'en';

  constructor(
    injector: Injector,
    private profilePictureService: ProfileService,
    private getProfileService: GetProfileService,
    public scrollAnims: ScrollAnimsService,
    private route: ActivatedRoute
  ) {
    super(injector);
    this.id = this.route.snapshot.params['id'];
  }

  ngOnInit(): void {
    this.loadProfileData();
    this.handleLanguage();
  }

  loadProfileData(): void {
    this.observeUser();
    this.observeParamId();
    this.loadProfile();
  }

  observeParamId(): void {
    this.route.params.subscribe((params: any) => {
      if (params['id']) {
        this.id = params['id'];
        this.loadProfile();
      }
    });
  }

  observeUser(): void {
    // Get user information from auth service
    // Since this is just a demo component, we'll assume the user is always viewing their own profile
    this.isMe = true;
  }

  loadProfile(): void {
    this.loadingProfile = true;
    // Using getProfile without a parameter will return the current user's profile
    // For a specific user, a boolean or undefined parameter might be needed based on API design
    this.getProfileService.getProfile().subscribe((profile: IKnoldgProfile) => {
      this.profile = profile;
      this.loadingProfile = false;
    });
  }

  // Method to get company social links for display
  getCompanySocialLinks(): SocialLink[] {
    if (!this.profile || !this.profile.company || !this.profile.company.social || !this.profile.company.social.length) {
      return [];
    }
    return this.profile.company.social;
  }

  // Helper method to check if a string starts with http or https
  isValidUrl(url: string | undefined): boolean {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://');
  }

  // Format URL by ensuring it starts with https://
  formatUrl(url: string | undefined): string {
    if (!url) return '#';
    return this.isValidUrl(url) ? url : `https://${url}`;
  }

  handleLanguage(): void {
    // Handle language logic here as needed
    this.lang = this.translate.getSelectedLanguage();
    const langSub = this.translate.onLanguageChange().subscribe((lang: string) => {
      this.lang = lang;
    });
    this.unsubscribe.push(langSub);
  }
}
