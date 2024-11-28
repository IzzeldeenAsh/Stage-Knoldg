import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { IForsightaProfile } from 'src/app/_fake/models/profile.interface';
import { ScrollAnimsService } from 'src/app/_fake/services/scroll-anims/scroll-anims.service';
import { AuthService } from 'src/app/modules/auth';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-documents',
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss'
})
export class DocumentsComponent extends BaseComponent implements OnInit {
  profile: IForsightaProfile;
  lang: string = "en";
  loadingProfile: boolean = false;
  documentTypes:Document[]
  isLoadingDocumentTypes:boolean=true;
  constructor(
    scrollAnims: ScrollAnimsService,
    private auth: AuthService,
    messageService: MessageService,
  ) {
    super(scrollAnims, messageService);
  }
  ngOnInit(): void {
    this.getProfile();
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

  getFileIcon(url: string | undefined) {
    if (url) {
      const extension = url.split('.').pop()?.toLowerCase();
      const iconPath = `./assets/media/svg/files/${extension}.svg`;
      // Optionally, you can add logic to handle missing icons
      return iconPath;
    }
    return './assets/media/svg/files/default.svg';
  }
}
