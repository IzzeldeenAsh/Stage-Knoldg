import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  Renderer2,
} from "@angular/core";
import { Router } from "@angular/router";
import { MessageService } from "primeng/api";
import { first } from "rxjs";
import { FileUploadService } from "src/app/_fake/services/upload-picture/upload-picture";
import { AuthService, UserType } from "src/app/modules/auth";

@Component({
  selector: "app-topbar",
  templateUrl: "./topbar.component.html",
  styleUrls: ["./topbar.component.scss"],
})
export class TopbarComponent implements OnInit {
  user: UserType;

  constructor(
    private elRef: ElementRef,
    private renderer: Renderer2,
    private _auth: AuthService,
    private router: Router,
    private fileUploadService: FileUploadService,
    private messageService: MessageService
  ) {}
  ngOnInit(): void {
    this.getProfile();
    // this._auth.currentUser$.pipe(first()).subscribe((res) => {
    //   this.user = res;
    //   console.log("res", res);
    // });
  }
  signOut() {
    this._auth.logout().pipe(first()).subscribe({
      next : (res)=>{
          localStorage.removeItem("foresighta-creds");
          localStorage.removeItem("currentUser");
          localStorage.removeItem("authToken");
          document.location.reload();
      },
      error: (err)=>{
        localStorage.removeItem("foresighta-creds");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("authToken");
        document.location.reload();
      }
    });
    this.router.navigateByUrl("/auth/login");
  }

  getProfile(){
    this._auth.getProfile().pipe(first()).subscribe({
      next :(res)=>{
        this.user = res
      },
      error:(error)=>{
        this.messageService.add({
          severity: "error",
          summary: "Error",
          detail: "Cannot get profile.",
        });
      }
    })
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (!file) {
        this.messageService.add({
          severity: "error",
          summary: "Error",
          detail: "No file selected",
        });
        return;
      }
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        this.messageService.add({
          severity: "error",
          summary: "Error",
          detail: "Invalid file type. Please upload a JPG, PNG, or WEBP file.",
        });
        return;
      }

      this.fileUploadService.uploadProfilePhoto(file).subscribe({
        next: (res) => {
          this.messageService.add({
            severity: "success",
            summary: "Success",
            detail: "Photo uploaded successfully",
          });
          this.getProfile()
        },
        error: (error) => {
          const errorMessage = error.error?.message || "Failed to upload photo";
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: errorMessage,
          });
        },
      });
    }
  }

  isMenuOpen = false;
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }
  @HostListener("document:click", ["$event"])
  handleClickOutside(event: Event): void {
    const clickedInside = this.elRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.closeMenu();
    }
  }
}
