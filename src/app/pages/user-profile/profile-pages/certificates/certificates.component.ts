import { Component, OnInit } from "@angular/core";
import { MessageService } from "primeng/api";
import { IForsightaProfile } from "src/app/_fake/models/profile.interface";
import { Document, DocumentsService } from "src/app/_fake/services/douments-types/documents-types.service.spec";
import { ScrollAnimsService } from "src/app/_fake/services/scroll-anims/scroll-anims.service";
import { AuthService } from "src/app/modules/auth";
import { BaseComponent } from "src/app/modules/base.component";
import { TranslationService } from "src/app/modules/i18n";

@Component({
  selector: "app-certificates",
  templateUrl: "./certificates.component.html",
  styleUrl: "./certificates.component.scss",
})
export class CertificatesComponent extends BaseComponent implements OnInit {
  profile: IForsightaProfile;
  lang: string = "en";
  loadingProfile: boolean = false;
  documentTypes:Document[]
  isLoadingDocumentTypes:boolean=true;
  constructor(
    scrollAnims: ScrollAnimsService,
    private auth: AuthService,
    messageService: MessageService,
    private translationService: TranslationService,
    private documentsService: DocumentsService,
  ) {
    super(scrollAnims, messageService);
  }
  ngOnInit(): void {
    this.loadDocList()
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

  loadDocList(){
    const docListSub = this.documentsService.getDocumentsTypes().subscribe(
      {
        next  : (types)=>{
          this.documentTypes = types;
          this.isLoadingDocumentTypes = false;
        },
        error: (error)=>{
          this.isLoadingDocumentTypes = false;
        }
      }
    )
    this.unsubscribe.push(docListSub)
  }

  getFileIcon(url: string) {
    if (url) {
      const extension = url.split('.').pop()?.toLowerCase();
      const iconPath = `./assets/media/svg/files/${extension}.svg`;
      // Optionally, you can add logic to handle missing icons
      return iconPath;
    }
    return './assets/media/svg/files/default.svg';
  }

  gerCertName(certId:string){
    const doc =  this.documentTypes.find((cert)=>cert.id ===certId);
    if (doc){
      return doc.name 
    }else{
      return "Other"
    }
   }
}
