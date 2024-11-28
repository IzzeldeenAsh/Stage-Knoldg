import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { IForsightaProfile } from 'src/app/_fake/models/profile.interface';
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
constructor(scrollAnims: ScrollAnimsService,private auth:AuthService,messageService:MessageService,private translationService:TranslationService) {
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
}
