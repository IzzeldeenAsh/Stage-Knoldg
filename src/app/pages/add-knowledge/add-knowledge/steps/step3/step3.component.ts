import { Component, Injector, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseComponent } from 'src/app/modules/base.component';
import { ICreateKnowldege } from '../../create-account.helper';
import { AddInsightStepsService } from 'src/app/_fake/services/add-insight-steps/add-insight-steps.service';

@Component({
  selector: 'app-step3',
  templateUrl: './step3.component.html',
  styleUrls: ['./step3.component.scss']
})
export class Step3Component extends BaseComponent implements OnInit {
  @Input('updateParentModel') updateParentModel: (
    part: Partial<ICreateKnowldege>,
    isFormValid: boolean
  ) => void;
  @Input() defaultValues: Partial<ICreateKnowldege>;
  @Input() knowledgeId!: number;

  form: FormGroup;
  isLoading = false;
  documents: any[] = [];

  constructor(
    injector: Injector,
    private fb: FormBuilder,
    private addInsightStepsService: AddInsightStepsService
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.initForm();
    this.loadDocuments();
  }

  initForm(): void {
    this.form = this.fb.group({
      description: [this.defaultValues.description || '', [Validators.required]]
    });

    const formChanges = this.form.valueChanges.subscribe(val => {
      // Merge document descriptions with the main description
      const documentDescriptions = this.documents.map(doc => ({
        id: doc.id,
        description: doc.description || ''
      }));

      this.updateParentModel(
        { 
          description: val.description,
          documentDescriptions
        },
        this.form.valid
      );
    });

    this.unsubscribe.push(formChanges);
  }

  loadDocuments(): void {
    if (!this.knowledgeId) return;
    
    this.isLoading = true;
    const loadSub = this.addInsightStepsService.getListDocumentsInfo(this.knowledgeId)
      .subscribe({
        next: (response) => {
          this.documents = response.data;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading documents:', error);
          this.isLoading = false;
        }
      });
    
    this.unsubscribe.push(loadSub);
  }

  updateDocumentDescription(docId: number, description: string): void {
    const index = this.documents.findIndex(doc => doc.id === docId);
    if (index !== -1) {
      this.documents[index].description = description;
      
      // Update parent model with all document descriptions
      const documentDescriptions = this.documents.map(doc => ({
        id: doc.id,
        description: doc.description || ''
      }));
      
      this.updateParentModel(
        { documentDescriptions },
        this.form.valid
      );
    }
  }
} 