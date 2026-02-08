import { Component, Injector, OnInit } from "@angular/core";
import { IKnoldgProfile } from "src/app/_fake/models/profile.interface";
import {
  Document,
  DocumentsService,
} from "src/app/_fake/services/douments-types/documents-types.service";
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
  
  // Certificate properties
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
    private getProfileService: ProfileService
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
      error: () => {
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
      error: () => {
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


  // Personal Certificate Methods
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
        this.showError(
          this.lang === "ar" ? "حدث خطأ" : "Error",
          this.lang === "ar" ? "نوع الملف غير صحيح. يرجى رفع ملفات PDF أو DOC أو DOCX أو JPG أو PNG فقط." : "Invalid file type. Please upload PDF, DOC, DOCX, JPG or PNG files only."
        );
        event.target.value = '';
      }
    }
  }

  uploadCertificate() {
    if (!this.selectedDocType || !this.selectedFile) {
      return;
    }

    this.isUploading = true;

    const uploadSub = this._profilePost.uploadCertificate(this.selectedDocType, this.selectedFile).subscribe({
      next: () => {
        this.showSuccess('Success', 'Certificate uploaded successfully');
        this.displayAddCertDialog = false;
        this.getProfileService.clearProfile();
        this.getProfile();
      },
      error: (error: any) => {
        if (error.error && error.error.errors) {
          const serverErrors = error.error.errors;
          for (const key in serverErrors) {
            if (serverErrors.hasOwnProperty(key)) {
              const messages = serverErrors[key];
              this.showError(
                this.lang === "ar" ? "حدث خطأ" : "An error occurred",
                messages.join(", ")
              );
            }
          }
        } else {
          this.showError(
            this.lang === "ar" ? "حدث خطأ" : "An error occurred",
            this.lang === "ar" ? "حدث خطأ" : "Failed to upload certificate"
          );
        }
        this.isUploading = false;
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
        this.showSuccess('Success', 'Certificate deleted successfully');
        this.displayDeleteDialog = false;
        this.getProfileService.clearProfile();
        this.getProfile();
      },
      error: () => {
        this.showError(
          this.lang === "ar" ? "حدث خطأ" : "Error",
          this.lang === "ar" ? "فشل في حذف الشهادة" : "Failed to delete certificate"
        );
      },
      complete: () => {
        this.isDeleting = false;
      }
    });

    this.unsubscribe.push(deleteSub);
  }
  

}
