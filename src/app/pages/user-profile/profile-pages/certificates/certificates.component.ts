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
  selector: "app-certificates",
  templateUrl: "./certificates.component.html",
  styleUrl: "./certificates.component.scss",
})
export class CertificatesComponent extends BaseComponent implements OnInit {
  profile: IKnoldgProfile;
  lang: string = "en";
  loadingProfile: boolean = false;
  documentTypes: Document[];
  isLoadingDocumentTypes: boolean = false;
  displayAddCertDialog: boolean = false;
  displayDeleteDialog: boolean = false;
  selectedDocType: string;
  selectedFile: File | null = null;
  isUploading: boolean = false;
  isDeleting: boolean = false;
  selectedCertificate: any = null;

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

  private createFormData(): FormData {
    const formData = new FormData();
    formData.append("first_name", this.profile.first_name);
    formData.append("last_name", this.profile.last_name);
    if (this.profile.country_id) {
      formData.append("country_id", this.profile.country_id.toString());
    }
    if (this.profile.bio) {
      formData.append("bio", this.profile.bio);
    }
    if (this.profile.phone) {
      formData.append("phone", this.profile.phone);
    }
    // Append regular industries
    if (this.profile.industries.length > 0) {
      this.profile.industries.forEach((industry: any) => {
        formData.append("industries[]", industry.id);
      });
    }
    if (this.profile.consulting_field.length > 0) {
      this.profile.consulting_field.forEach((field: any) => {
        formData.append("consulting_field[]", field.id);
      });
    }
    // Append regular consulting fields
 
    if (this.profile.roles.includes("company") && this.profile.company?.legal_name) {
      formData.append("legal_name", this.profile.company.legal_name);
      formData.append("about_us", this.profile.company.about_us);
    }
    if (this.profile.roles.includes("company") && this.profile.company?.website) {
      formData.append("website", this.profile.company.website);
    }
    return formData;
  }

  showAddCertDialog() {
    this.displayAddCertDialog = true;
    this.selectedDocType = '';
    this.selectedFile = null;
    this.isUploading = false; // Reset loading state when opening dialog
  }

  onFileSelect(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      // Check file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
      if (allowedTypes.includes(file.type)) {
        this.selectedFile = file;
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

  uploadCertificate() {
    if (!this.selectedDocType || !this.selectedFile) {
      return;
    }

    this.isUploading = true;
    const formData = this.createFormData();
    
    // Add the new certificate
    formData.append(`certification[${this.profile.certifications.length}][type]`, this.selectedDocType);
    formData.append(`certification[${this.profile.certifications.length}][file]`, this.selectedFile);

    const uploadSub = this._profilePost.postProfile(formData).subscribe({
      next: (response: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Certificate uploaded successfully'
        });
        this.displayAddCertDialog = false;
        this.getProfileService.clearProfile();
        this.getProfile(); // Refresh the profile to show new certificate
      },
      error: (error: Error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to upload certificate'
        });
        this.isUploading = false; // Reset loading state on error
      },
      complete: () => {
        this.isUploading = false;
      }
    });

    this.unsubscribe.push(uploadSub);
  }

  confirmDelete(cert: any) {
    this.selectedCertificate = cert;
    this.displayDeleteDialog = true;
  }

  deleteCertificate() {
    if (!this.selectedCertificate) {
      return;
    }

    this.isDeleting = true;
    const deleteSub = this._profilePost.deleteCertificate(this.selectedCertificate.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Certificate deleted successfully'
        });
        this.displayDeleteDialog = false;
        this.getProfileService.clearProfile();
        this.getProfile(); // Refresh the profile to update the certificates list
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete certificate'
        });
      },
      complete: () => {
        this.isDeleting = false;
      }
    });

    this.unsubscribe.push(deleteSub);
  }
}
