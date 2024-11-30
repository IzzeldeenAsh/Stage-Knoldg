import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { first } from 'rxjs';
import { IForsightaProfile } from 'src/app/_fake/models/profile.interface';
import { ProfileService } from 'src/app/_fake/services/profile-picture/profile.service';
import { ScrollAnimsService } from 'src/app/_fake/services/scroll-anims/scroll-anims.service';
import { AuthService } from 'src/app/modules/auth';
import { BaseComponent } from 'src/app/modules/base.component';
import { TranslationService } from 'src/app/modules/i18n';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss'
})
export class OverviewComponent extends BaseComponent implements OnInit {
  profile:IForsightaProfile; 
  lang:string ='en';
  loadingProfile:boolean=false;
constructor(scrollAnims: ScrollAnimsService,    private profileService: ProfileService,private auth:AuthService,messageService:MessageService,private translationService:TranslationService) {
  super(scrollAnims,messageService);
}
  ngOnInit(): void {
   
    this.getProfile()
    this.handleLanguage()
   }

  

   handleLanguage(){
    this.lang = this.translationService.getSelectedLanguage()
   const onLanguageSub=  this.translationService.onLanguageChange().subscribe((lang)=>{
      this.lang = lang
    });
    this.unsubscribe.push(onLanguageSub)
   }
   getProfile(){
    this.loadingProfile=true;
    const getProfileSub = this.auth.getProfile().subscribe({
        next : ( profile)=>{
          this.profile = profile
          this.loadingProfile=false;
        },
        error:(error)=>{
          this.loadingProfile=false;
        }
    });
    this.unsubscribe.push(getProfileSub)
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Preview the selected image

      this.uploadImage(file);
    }
  }

  uploadImage(file:File){
    this.profileService.updateProfilePhoto(file)
    .pipe(first())
    .subscribe(
      (response:any) => {
        // Handle successful upload
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
