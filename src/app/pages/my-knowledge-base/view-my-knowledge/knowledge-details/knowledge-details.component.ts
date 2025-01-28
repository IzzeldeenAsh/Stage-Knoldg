import { Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DocumentInfo, AddInsightStepsService } from 'src/app/_fake/services/add-insight-steps/add-insight-steps.service';
import { Knowledge, KnowledgeService } from 'src/app/_fake/services/knowledge/knowledge.service';
import { BaseComponent } from 'src/app/modules/base.component';
import Swal from 'sweetalert2';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-knowledge-details',
  templateUrl: './knowledge-details.component.html',
  styleUrl: './knowledge-details.component.scss'
})
export class KnowledgeDetailsComponent extends BaseComponent implements OnInit {
  knowledgeId: string;
  knowledge: Knowledge;
  documents: DocumentInfo[] = [];
  isLoading: boolean = false;

  // Add animation states
  hoveredDocumentId: number | null = null;
  activeDocumentId: number | null = 2;
  animationStates: { [key: number]: string } = {};

  documentsDummy:any = [
    {
      id: 1,
      file_name: 'Market Analysis Study',
      file_extension: 'xlsx',
      file_size: 2048000, // 2 MB
      price: 49.99,
      description: 'A detailed project report covering all aspects of the project, including milestones and outcomes.',
      highlighted: false
    },
    {
      id: 2,
      file_name: 'Industry Trends Study',
      file_extension: 'doc',
      file_size: 102400, // 100 KB
      price: 29.99,
      description: 'The wireframe design for the upcoming application project.',
      highlighted: true
    },
    {
      id: 3,
      file_name: 'Consumer Behavior Study',
      file_extension: 'docx',
      file_size: 512000, // 500 KB
      price: 19.99,
      description: 'Summary and action items from the team meeting held last week.',
      highlighted: false
    },
    {
      id: 4,
      file_name: 'Financial Impact Study',
      file_extension: 'pdf',
      file_size: 307200, // 300 KB
      price: 24.99,
      description: 'A detailed budget breakdown for the financial year 2023.',
      highlighted: false
    },
    {
      id: 5,
      file_name: 'Competitive Analysis Study',
      file_extension: 'pptx',
      file_size: 1048576, // 1 MB
      price: 39.99,
      description: 'Presentation slides for the upcoming stakeholder meeting.',
      highlighted: false
    },
    {
      id: 6,
      file_name: 'Risk Assessment Study',
      file_extension: 'txt',
      file_size: 0, // 0 bytes
      price: 0.00,
      description: null, // No description provided
      highlighted: false
    },
  ];

  constructor(
    injector: Injector,
    private route: ActivatedRoute,
    private knowledgeService: KnowledgeService,
    private addInsightStepsService: AddInsightStepsService
  ) {
    super(injector);
  }

  ngOnInit(): void {
    // Get the ID from the parent route
    this.route.parent?.params.subscribe(params => {
      this.knowledgeId = params['id'];
      if (this.knowledgeId) {
        this.loadKnowledge();
        this.loadDocuments();
      }
    });

    // Initialize animation states for each document
    this.documents.forEach(doc => {
      this.animationStates[doc.id] = 'initial';
    });
  }

  private loadKnowledge(): void {
    this.isLoading = true;
    this.knowledgeService.getKnowledgeById(Number(this.knowledgeId))
      .subscribe({
        next: (response) => {
          this.knowledge = response.data;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading knowledge:', error);
          this.isLoading = false;
        }
      });
  }

  private loadDocuments(): void {
    this.isLoading = true;
    this.knowledgeService.getListDocumentsInfo(Number(this.knowledgeId))
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
  }

  // Enhanced toggle collapse with animation
  toggleCollapse(docId: number , event: Event): void {
    event.stopPropagation();
    if (this.activeDocumentId === docId) {
      // If clicking the active document, deactivate it
      this.activeDocumentId = null;
    } else {
      // If clicking a new document, activate it
      this.activeDocumentId = docId;
    }
    this.animationStates[docId] = this.activeDocumentId === docId ? 'expanded' : 'collapsed';
  }

  // Enhanced hover handlers
  onDocumentMouseEnter(docId: number): void {
    this.hoveredDocumentId = docId;
    if (this.activeDocumentId !== docId) {
      this.animationStates[docId] = 'hovered';
    }
  }

  onDocumentMouseLeave(docId: number): void {
    this.hoveredDocumentId = null;
    if (this.activeDocumentId !== docId) {
      this.animationStates[docId] = 'initial';
    }
  }

  // Example file-icon mapping method
  getFileIconByExtension(fileExtension: string): string {
    // Adjust this method to match your current logic / icon paths
    const iconMap: { [key: string]: string } = {
      pdf: './assets/media/svg/new-files/pdf.svg',
      doc: './assets/media/svg/new-files/doc.svg',
      docx: './assets/media/svg/new-files/docx.svg',
      xls: './assets/media/svg/new-files/xls.svg',
      ppt: './assets/media/svg/new-files/ppt.svg',
      pptx: './assets/media/svg/new-files/pptx.svg',
      txt: './assets/media/svg/new-files/txt.svg',
      zip: './assets/media/svg/new-files/zip.svg',
      xlsx: './assets/media/svg/new-files/xlsx.svg',
      default: './assets/media/svg/new-files/default.svg',
    };
    const ext = fileExtension.toLowerCase();
    return iconMap[ext] || iconMap.default;
  }

  editDocument(doc: DocumentInfo, event: Event): void {
    event.stopPropagation();
    // Here you would typically open a modal or navigate to edit form
    // For now, we'll just update with the same data as an example
    const request: any = {
      file_name: doc.file_name,
      price: doc.price,
      description: doc.description || '',
      status: 'active',
      table_of_content: doc.table_of_content,
      _method: 'PUT'
    };

    this.addInsightStepsService.step3AddKnowledgeDocument(doc.id, request, true)
      .subscribe({
        next: () => {
          this.loadDocuments(); // Refresh the documents list
          // Show success message
          Swal.fire({
            title: 'Success!',
            text: 'Document updated successfully',
            icon: 'success',
            confirmButtonText: 'OK'
          });
        },
        error: (error) => {
          console.error('Error updating document:', error);
          Swal.fire({
            title: 'Error!',
            text: 'Failed to update document',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      });
  }

  deleteDocument(doc: DocumentInfo, event: Event): void {
    event.stopPropagation();
    
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.addInsightStepsService.deleteKnowledgeDocument(doc.id)
          .subscribe({
            next: () => {
              this.loadDocuments(); // Refresh the documents list
              Swal.fire(
                'Deleted!',
                'Document has been deleted.',
                'success'
              );
            },
            error: (error) => {
              console.error('Error deleting document:', error);
              Swal.fire(
                'Error!',
                'Failed to delete document.',
                'error'
              );
            }
          });
      }
    });
  }

  unpublishDocument(doc: DocumentInfo, event: Event): void {
    event.stopPropagation();
    
    Swal.fire({
      title: 'Unpublish Document',
      text: "Are you sure you want to unpublish this document?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, unpublish it!'
    }).then((result) => {
      if (result.isConfirmed) {
        const request = {
          status: 'draft',
          published_at: new Date().toISOString()
        };

        this.addInsightStepsService.publishKnowledge(doc.id, request)
          .subscribe({
            next: () => {
              this.loadDocuments(); // Refresh the documents list
              Swal.fire(
                'Unpublished!',
                'Document has been unpublished.',
                'success'
              );
            },
            error: (error) => {
              console.error('Error unpublishing document:', error);
              Swal.fire(
                'Error!',
                'Failed to unpublish document.',
                'error'
              );
            }
          });
      }
    });
  }
} 