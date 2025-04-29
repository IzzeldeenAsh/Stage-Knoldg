import { Component, Injector, OnInit } from "@angular/core";
import { MessageService } from "primeng/api";
import { IKnoldgProfile } from "src/app/_fake/models/profile.interface";
import {
  Document,
  DocumentsService,
} from "src/app/_fake/services/douments-types/documents-types.service.spec";
import { ProfileService } from "src/app/_fake/services/get-profile/get-profile.service";
import { UpdateProfileService } from "src/app/_fake/services/profile/profile.service";
import { BaseComponent } from "src/app/modules/base.component";

@Component({
  selector: "app-company-certificates",
  templateUrl: "./company-certificates.component.html",
  styleUrl: "./company-certificates.component.scss",
})
export class CompanyCertificatesComponent extends BaseComponent implements OnInit {
  profile: IKnoldgProfile;
  lang: string = "en";
  loadingProfile: boolean = false;
  documentTypes: Document[];
  isLoadingDocumentTypes: boolean = false;
  
  // Company certificate properties
  displayAddCompanyCertDialog: boolean = false;
  displayCompanyDeleteDialog: boolean = false;
  selectedCompanyDocType: string;
  selectedCompanyFile: File | null = null;
  isUploadingCompany: boolean = false;
  isDeletingCompany: boolean = false;
  selectedCompanyCertificate: any = null;

  constructor(
    private documentsService: DocumentsService,
    injector: Injector,
    private _profilePost: UpdateProfileService,
    private getProfileService: ProfileService,
    public messageService: MessageService
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.loadDocList();
    this.getProfile();
  }

  getProfile() {
    this.loadingProfile = true;
    const getProfileSub = this.getProfileService.getProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.loadingProfile = false;
      },
      error: (error) => {
        this.loadingProfile = false;
      },
    });
    this.unsubscribe.push(getProfileSub);
  }

  loadDocList() {
    const docListSub = this.documentsService.getDocumentsTypes().subscribe({
      next: (types) => {
        this.documentTypes = types;
        this.isLoadingDocumentTypes = false;
      },
      error: (error) => {
        this.isLoadingDocumentTypes = false;
      },
    });
    this.unsubscribe.push(docListSub);
  }

  getFileIcon(url: string) {
    if (url) {
      const extension = url.split(".").pop()?.toLowerCase();
      const iconPath = `./assets/media/svg/files/${extension}.svg`;
      // Optionally, you can add logic to handle missing icons
      return iconPath;
    }
    return "./assets/media/svg/files/default.svg";
  }

  gerCertName(certId: string) {
    if (!this.documentTypes || this.documentTypes.length === 0) {
      return "Other";
    }
    const doc = this.documentTypes.find((cert) => cert.id === certId);
    return doc ? doc.name : "Other";
  }

  // Company Certificate Form Data
  private createCompanyFormData(): FormData {
    const formData = new FormData();
    
    if (this.profile.company?.legal_name) {
      formData.append("legal_name", this.profile.company.legal_name);
    }
    
    if (this.profile.company?.about_us) {
      formData.append("about_us", this.profile.company.about_us);
    }
    
    if (this.profile.company?.website) {
      formData.append("website", this.profile.company.website);
    }
    
    // Add company industries if any
    if (this.profile.company && this.profile.company.industries && this.profile.company.industries.length > 0) {
      this.profile.company.industries.forEach((industry: any) => {
        formData.append("industries[]", industry.id);
      });
    }
    
    // Add company consulting fields if any
    if (this.profile.company && this.profile.company.consulting_field && this.profile.company.consulting_field.length > 0) {
      this.profile.company.consulting_field.forEach((field: any) => {
        formData.append("consulting_field[]", field.id);
      });
    }
    
    return formData;
  }
  
  // Company Certificate Methods
  showAddCompanyCertDialog() {
    this.displayAddCompanyCertDialog = true;
    this.selectedCompanyDocType = '';
    this.selectedCompanyFile = null;
    this.isUploadingCompany = false;
  }
  
  onCompanyFileSelect(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      // Check file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
      if (allowedTypes.includes(file.type)) {
        this.selectedCompanyFile = file;
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Invalid file type. Please upload PDF, DOC, DOCX, JPG or PNG files only.'
        });
        event.target.value = '';
      }
    }
  }
  
  uploadCompanyCertificate() {
    if (!this.selectedCompanyDocType || !this.selectedCompanyFile) {
      return;
    }

    this.isUploadingCompany = true;
    const formData = this.createCompanyFormData();
    
    // Always use index 0 for company certificate upload
    formData.append('certification[0][type]', this.selectedCompanyDocType);
    formData.append('certification[0][file]', this.selectedCompanyFile);

    const uploadSub = this._profilePost.updateCompanyInfo(formData).subscribe({
      next: (response: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Company certificate uploaded successfully'
        });
        this.displayAddCompanyCertDialog = false;
        this.getProfileService.clearProfile();
        this.getProfile(); // Refresh the profile to show new certificate
      },
      error: (error: any) => {
        // Handle detailed API errors
        let errorMessage = 'Failed to upload company certificate';
        
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }
        
        // Check for specific validation errors
        if (error.error && error.error.errors) {
          const errorKeys = Object.keys(error.error.errors);
          if (errorKeys.length > 0) {
            const firstError = error.error.errors[errorKeys[0]];
            if (Array.isArray(firstError) && firstError.length > 0) {
              errorMessage = firstError[0];
            }
          }
        }
        
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage
        });
        
        this.isUploadingCompany = false;
      },
      complete: () => {
        this.isUploadingCompany = false;
      }
    });

    this.unsubscribe.push(uploadSub);
  }
  
  confirmCompanyDelete(cert: any) {
    this.selectedCompanyCertificate = cert;
    this.displayCompanyDeleteDialog = true;
  }
  
  deleteCompanyCertificate() {
    if (!this.selectedCompanyCertificate) {
      return;
    }

    this.isDeletingCompany = true;
    // Use the dedicated company certificate deletion method
    const deleteSub = this._profilePost.deleteCompanyCertificate(this.selectedCompanyCertificate.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Company certificate deleted successfully'
        });
        this.displayCompanyDeleteDialog = false;
        this.getProfileService.clearProfile();
        this.getProfile(); // Refresh the profile to update the certificates list
      },
      error: (error: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete company certificate'
        });
      },
      complete: () => {
        this.isDeletingCompany = false;
      }
    });

    this.unsubscribe.push(deleteSub);
  }
}
