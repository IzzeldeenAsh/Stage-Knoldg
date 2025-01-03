// src/app/pages/wizards/step3/step3.component.ts

import {
  Component,
  ElementRef,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormArray, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Subscription, Observable, of } from "rxjs";
import { ICreateAccount } from "../../create-account.helper";
import {
  Document,
  DocumentsService,
} from "src/app/_fake/services/douments-types/documents-types.service.spec";
import { BaseComponent } from "src/app/modules/base.component";

@Component({
  selector: "app-step3",
  templateUrl: "./step3.component.html",
})
export class Step3Component extends BaseComponent implements OnInit, OnDestroy {
  @Input("updateParentModel") updateParentModel: (
    part: Partial<ICreateAccount>,
    isFormValid: boolean
  ) => void;
  form: FormGroup;

  @Input() defaultValues: Partial<ICreateAccount>;

  @ViewChild("fileInput") fileInput: ElementRef<HTMLInputElement>;

  documentTypes: Document[] = [];
  isLoadingDocumentTypes: boolean = false;
  documentTypesError: string = "";
  isLoading$: Observable<boolean> = of(false);
  constructor(
    private fb: FormBuilder,
    private documentsService: DocumentsService,
    injector: Injector
  ) {
    super(injector);
    this.isLoading$ = this.documentsService.isLoading$
  }

  ngOnInit() {
    this.initForm();
    this.loadDocumentTypes();
    this.updateParentModel({}, this.checkForm());
  }

  initForm() {
    this.form = this.fb.group({
      certifications: this.fb.array([]),
    });

    if (this.defaultValues?.certifications) {
      this.defaultValues.certifications.forEach((cert) => {
        this.addCertification(cert);
      });
    }

    const formChangesSubscr = this.form.valueChanges.subscribe((val) => {
      this.updateParentModel(val, this.checkForm());
    });
    this.unsubscribe.push(formChangesSubscr);
  }

  loadDocumentTypes() {
    this.isLoadingDocumentTypes = true;
    const docTypesSub = this.documentsService.getDocumentsTypes().subscribe({
      next: (types) => {
        this.documentTypes = types;
        this.isLoadingDocumentTypes = false;
      },
      error: (error) => {
        this.documentTypesError = "Failed to load document types.";
        this.isLoadingDocumentTypes = false;
        console.error(error);
      },
    });
    this.unsubscribe.push(docTypesSub);
  }

  get certifications(): FormArray<FormGroup> {
    return this.form.get("certifications") as FormArray;
  }
  get certificationControls(): FormGroup[] {
    return this.certifications.controls as FormGroup[];
  }
  addCertification(cert?: { type?: string; file?: File }) {
    const certForm = this.fb.group({
      type: [cert?.type || "", [Validators.required]],
      file: [cert?.file || null, [Validators.required]],
    });
    this.certifications.push(certForm);
    this.updateParentModel(this.form.value, this.checkForm());
  }

  removeCertification(index: number) {
    this.certifications.removeAt(index);
    this.updateParentModel(this.form.value, this.checkForm());
    // Optionally reset the file input if needed
    // this.fileInput.nativeElement.value = '';
  }

  onDropzoneClick() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    this.handleFiles(files);
    // Reset the file input to allow re-uploading the same file if needed
    this.fileInput.nativeElement.value = "";
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      const files = event.dataTransfer.files;
      this.handleFiles(files);
    }
  }

  handleFiles(files: FileList) {
    const MAX_SIZE_MB = 2;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    for (let i = 0; i < files.length; i++) {
      const file = files.item(i);
      if (file) {
        if (file.size > MAX_SIZE_BYTES) {
          this.showError('', `File "${file.name}" exceeds the 2MB size limit.`);
          continue; // Skip adding this file
        }
        this.addCertification({ file });
      }
    }
  }

  getFileIcon(file: File) {
    if (file) {
      const extension = file.name.split(".").pop()?.toLowerCase();
      const iconPath = `./assets/media/svg/files/${extension}.svg`;
      // Optionally, you can add logic to handle missing icons
      return iconPath;
    }
    return "./assets/media/svg/files/default.svg";
  }

  checkForm() {
    return this.form.valid;
  }


  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
