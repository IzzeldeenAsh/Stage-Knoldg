import { Component, Injector, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseComponent } from 'src/app/modules/base.component';
import { ICreateKnowldege } from '../../create-account.helper';
import { AddInsightStepsService, DocumentParserResponse } from 'src/app/_fake/services/add-insight-steps/add-insight-steps.service';
import { catchError, delay, finalize, map, Observable, of } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';

// Add the Chapter interface
export interface Chapter {
  chapter: {
    title: string;
    sub_child: { title: string; }[];
  };
}

// Interface for chapter in UI
interface ChapterItem {
  title: string;
}

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
  validationErrors: { [key: string]: string[] } = {};
  isCurrentFormValid = false;
  
  // Track loading state for each document
  documentLoadingStates: { [key: number]: boolean } = {};
  
  // Track error state for each document
  documentAbstractErrors: { [key: number]: boolean } = {};
  
  // Store TinyMCE editor instances
  editorInstances: { [key: number]: any } = {};

  // Animation control properties
  typingSpeed = 10; // ms per character
  animationTimers: { [key: number]: any } = {};
  tocRowSpeed = 220; // ms per TOC row (visual animation)
  tocAnimationTimers: { [key: number]: any } = {};

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

  private normalizeTableOfContent(raw: any): string[] {
    if (!raw) return [];

    // Most common: array of strings (new API)
    if (Array.isArray(raw)) {
      return raw
        .map((item: any) => {
          if (typeof item === 'string') return item;
          if (item?.chapter?.title) return item.chapter.title;
          if (item?.title) return item.title;
          return '';
        })
        .map((s: string) => (s || '').trim())
        .filter((s: string) => !!s);
    }

    // Sometimes backend may return a single string (fallback)
    if (typeof raw === 'string') {
      const t = raw.trim();
      return t ? [t] : [];
    }

    return [];
  }

  private buildApiTableOfContent(items: string[]): any[] {
    const clean = (items || []).map(s => (s || '').trim()).filter(Boolean);
    return clean.map((title: string) => ({
      chapter: {
        title,
        sub_child: []
      }
    }));
  }
  
  // Store editor instance when initialized
  handleEditorInit(event: any, docId: number): void {
    this.editorInstances[docId] = event.editor;
    
    // Add change event listener to update document description on content change
    event.editor.on('Change', () => {
      const content = event.editor.getContent();
      this.updateDocumentDescription(docId, content);
    });
  }

  // Function to handle Generate AI Abstract button click for a specific document
  generateAIAbstract(docId: number): void {
    this.documentLoadingStates[docId] = true;
    this.documentAbstractErrors[docId] = false;
    
    // First trigger document parsing with POST request
    const parserSubscription = this.addInsightStepsService.runDocumentParser(docId)
      .subscribe({
        next: () => {
          // After successful parsing, start polling for results
          this.startSummaryPolling(docId);
        },
        error: (error: any) => {
          console.error(`Error starting document parsing for document ${docId}:`, error);
          this.documentLoadingStates[docId] = false;
          this.documentAbstractErrors[docId] = true;
        }
      });
    
    this.unsubscribe.push(parserSubscription);
  }
  
  // Start polling for document summary
  startSummaryPolling(docId: number): void {
    // Set maximum time to show loader (25 seconds)
    const maxWaitTime = 25000;
    const pollingInterval = 2000; // Check every 2 seconds
    let elapsedTime = 0;
    let polling: any;
    
    // Start polling
    polling = setInterval(() => {
      elapsedTime += pollingInterval;
      
      // Call the fetchDocumentSummary method to check for summary
      this.fetchDocumentSummary(docId, polling);
      
      // Stop polling if we've reached the max time
      if (elapsedTime >= maxWaitTime) {
        clearInterval(polling);
        
        // Ensure loading state is turned off after max time
        if (this.documentLoadingStates[docId]) {
          this.documentLoadingStates[docId] = false;
          this.documentAbstractErrors[docId] = true; // Set error state if we couldn't get data after timeout
        }
      }
    }, pollingInterval);
  }

  // Fetch document summary from AI parser API
  fetchDocumentSummary(docId: number, pollingIntervalId?: any): void {
    // Loading state is already set to true when this is called
    
    const summarySubscription = this.addInsightStepsService.getDocumentSummary(docId)
      .subscribe({
        next: (response: DocumentParserResponse) => {
          const index = this.documents.findIndex(doc => doc.id === docId);
          if (index !== -1 && response.data) {
            // Check if data has a summary object with abstract property
            let summary = null;
            const responseData: any = response.data;
            
            if (typeof responseData === 'object' && responseData.summary && typeof responseData.summary === 'object') {
              summary = responseData.summary.abstract || null;
            } else if (typeof responseData === 'string') {
              summary = responseData;
            } else if (responseData.summary && typeof responseData.summary === 'string') {
              summary = responseData.summary;
            }

            // Extract AI table of content (new API)
            const tocItems = (typeof responseData === 'object')
              ? this.normalizeTableOfContent(responseData.table_of_content)
              : [];
            
            if (summary) {
              // We have a valid abstract, use it directly
              const formattedDescription = summary;
              
              // Update document description with formatted content
              this.documents[index].description = formattedDescription;
              this.documents[index].touched = true;
              
              // Enable animation for this document
              this.documents[index].animatedAbstract = true;
              this.documents[index].animatedAbstractText = ''; // Start empty for typing animation
              this.documents[index].showEditor = false; // Hide editor initially
              
              // Start typing animation
              this.startTypingAnimation(docId, formattedDescription);

              // Apply AI table of content if present
              if (tocItems.length > 0) {
                this.documents[index].aiTableOfContent = tocItems;
                this.documents[index].table_of_content = this.buildApiTableOfContent(tocItems);

                const isEditMode = this.isEditMode();
                if (isEditMode) {
                  // Only in explicit edit mode: show editor directly
                  this.documents[index].showChapters = true;
                  this.documents[index].chapters = tocItems.map((t: string) => ({ title: t }));
                  this.documents[index].animatedToc = false;
                  this.documents[index].animatedTocComplete = true;
                } else {
                  // Always show preview mode first (user clicks Edit to switch)
                  this.documents[index].showChapters = false;
                  this.documents[index].animatedToc = true;
                  this.documents[index].animatedTocItems = [];
                  this.documents[index].animatedTocComplete = false;
                  this.startTocRowAnimation(docId, tocItems);
                }
              } else {
                this.documents[index].aiTableOfContent = [];
                this.documents[index].showChapters = false;
                this.documents[index].animatedToc = false;
                this.documents[index].animatedTocComplete = false;
              }
              
              // Validate and update parent model
              this.validateDocuments();
              this.updateParentModelWithDocuments();
              this.documentAbstractErrors[docId] = false;
              
              // Clear polling interval if we have a valid summary
              if (pollingIntervalId) {
                clearInterval(pollingIntervalId);
              }
              
              // Turn off loading
              this.documentLoadingStates[docId] = false;
            } else {
              // No summary data returned
              // Don't set error yet - continue polling until timeout
              if (!pollingIntervalId) {
                this.documentAbstractErrors[docId] = true;
                console.error(`No summary data returned for document ${docId}`);
                this.documentLoadingStates[docId] = false;
              }
            }
          } else {
            // No data returned or document not found
            // Don't set error yet - continue polling until timeout
            if (!pollingIntervalId) {
              this.documentAbstractErrors[docId] = true;
              console.error(`No data returned or document not found for document ${docId}`);
              this.documentLoadingStates[docId] = false;
            }
          }
        },
        error: (error) => {
          console.error(`Error getting document summary for document ${docId}:`, error);
          
          // Check if this is the specific metadata error we want to ignore
          const isMetadataError = error?.error?.message?.includes('Attempt to read property "metadata" on null');
          
          // Only update UI state if this was the final request OR if it's not the specific error we're ignoring
          if (!pollingIntervalId && !isMetadataError) {
            this.documentLoadingStates[docId] = false;
            this.documentAbstractErrors[docId] = true;
          }
          // If it's the metadata error and we're polling, we just continue polling until timeout
        }
      });
    
    this.unsubscribe.push(summarySubscription);
  }
  
  // Show editor for a document with animated abstract
  showEditor(docId: number): void {
    const index = this.documents.findIndex(doc => doc.id === docId);
    if (index !== -1) {
      this.documents[index].showEditor = true;
      
      // Update TinyMCE editor content with the full description
      if (this.editorInstances[docId]) {
        this.editorInstances[docId].setContent(this.documents[index].description);
      }
    }
  }

  // Show TOC editor (p-table) and prefill chapters from AI table of content
  editAITableOfContent(docId: number): void {
    const index = this.documents.findIndex(doc => doc.id === docId);
    if (index === -1) return;

    const tocItems: string[] = (this.documents[index].aiTableOfContent || []) as string[];
    if (!tocItems || tocItems.length === 0) return;

    this.documents[index].showChapters = true;
    this.documents[index].chapters = tocItems.map((t: string) => ({ title: t }));
    this.documents[index].newChapterTitle = '';
    this.updateTableOfContent(index);
    this.updateParentModelWithDocuments();
  }
  
  // Start typing animation for abstract
  startTypingAnimation(docId: number, text: string): void {
    const index = this.documents.findIndex(doc => doc.id === docId);
    if (index === -1) return;
    
    const chars = text.length;
    let currentPos = 0;
    this.documents[index].animatedAbstractComplete = false;
    
    // Clear any existing animation timer
    if (this.animationTimers[docId]) {
      clearInterval(this.animationTimers[docId]);
    }
    
    // Start animation interval
    this.animationTimers[docId] = setInterval(() => {
      if (currentPos < chars) {
        // Add next character to the animated text
        this.documents[index].animatedAbstractText = text.substring(0, currentPos + 1);
        currentPos++;
      } else {
        // Animation complete
        clearInterval(this.animationTimers[docId]);
        this.documents[index].animatedAbstractComplete = true;
      }
    }, this.typingSpeed);
  }

  // Animate TOC as rows appearing one-by-one
  startTocRowAnimation(docId: number, items: string[]): void {
    const index = this.documents.findIndex(doc => doc.id === docId);
    if (index === -1) return;

    // Clear any existing TOC animation timer
    if (this.tocAnimationTimers[docId]) {
      clearInterval(this.tocAnimationTimers[docId]);
    }

    this.documents[index].animatedTocItems = [];
    this.documents[index].animatedTocComplete = false;

    let current = 0;
    const total = (items || []).length;

    this.tocAnimationTimers[docId] = setInterval(() => {
      if (current < total) {
        this.documents[index].animatedTocItems.push(items[current]);
        current++;
      } else {
        clearInterval(this.tocAnimationTimers[docId]);
        this.documents[index].animatedTocComplete = true;
      }
    }, this.tocRowSpeed);
  }

  initForm(): void {
    this.form = this.fb.group({
      description: [this.defaultValues.description || '', []]
    });

    const formChanges = this.form.valueChanges.subscribe(val => {
      // Merge document descriptions with the main description
      const documentDescriptions = this.documents.map(doc => ({
        id: doc.id,
        description: doc.description || '',
        table_of_content: doc.table_of_content || []
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
          this.documents = response.data.map(doc => {
            // Normalize existing table_of_content from API (strings OR objects)
            const tocItems = this.normalizeTableOfContent(doc.table_of_content);
            const hasTableOfContent = tocItems.length > 0;
            // Initialize chapters array from table_of_content if it exists
            const chapters = hasTableOfContent
              ? tocItems.map((t: string) => ({ title: t }))
              : [];
            
            // Always start with preview mode - user must click Edit to switch to editable mode
            // Only exception: explicit edit mode where knowledge was already saved and user is editing
            const isEditMode = this.isEditMode();
            
            // Initialize loading state for this document - start with false
            this.documentLoadingStates[doc.id] = false;
            // Initialize error state for this document
            this.documentAbstractErrors[doc.id] = false;
            
            return {
              ...doc,
              fileIcon: this.getFileIconByExtension(doc.file_extension),
              // Always start with preview mode (showChapters = false) - user clicks Edit to switch
              showChapters: false,
              // Initialize chapters from existing table_of_content (for when Edit is clicked)
              chapters: chapters,
              // Keep AI table_of_content around for preview/edit even if user doesn't toggle
              aiTableOfContent: tocItems,
              // Preview/animation state for AI TOC - enable animation if we have TOC and not in edit mode
              animatedToc: !isEditMode && hasTableOfContent,
              animatedTocItems: [],
              animatedTocComplete: isEditMode ? true : !hasTableOfContent,
              newChapterTitle: '',
              // Track validation errors for each document
              hasError: false,
              // Track if the field has been touched
              touched: false,
              // For animation control
              animatedAbstract: false,
              animatedAbstractText: '',
              animatedAbstractComplete: false,
              showEditor: false
            };
          });
          
          // Set loading indicators immediately for documents without descriptions
          this.documents.forEach(doc => {
            if (!doc.description || doc.description.trim() === '') {
              // Set loading state to true before auto-triggering document parsing
              this.documentLoadingStates[doc.id] = true;
              this.documentAbstractErrors[doc.id] = false;
              // Auto-trigger document parsing for documents without descriptions
              this.startSummaryPolling(doc.id);
            } else {
              // Check if we're in edit mode or user is going back to this step
              const isEditMode = this.isEditMode();
              const hasSubmittedValues = this.hasSubmittedValues();
              
              if (isEditMode || hasSubmittedValues) {
                // Skip animation and show editor directly
                doc.animatedAbstract = false;
                doc.showEditor = true;
                doc.animatedAbstractComplete = true;
              } else {
                // For new documents, show animation
                doc.animatedAbstract = true;
                doc.showEditor = false;
                // Start typing animation with a short delay to ensure UI is ready
                setTimeout(() => {
                  this.startTypingAnimation(doc.id, doc.description);
                }, 500);
              }
            }

            // If we already have TOC from list-docs response, animate preview
            if (doc.aiTableOfContent && doc.aiTableOfContent.length > 0) {
              const isEditMode = this.isEditMode();

              if (isEditMode) {
                // Only in explicit edit mode (knowledge already saved), show editable section directly
                doc.showChapters = true;
                doc.animatedToc = false;
                doc.animatedTocComplete = true;
              } else {
                // In all other cases, show preview mode (user clicks Edit to switch)
                doc.showChapters = false;
                if (doc.animatedToc) {
                  setTimeout(() => {
                    this.startTocRowAnimation(doc.id, doc.aiTableOfContent);
                  }, 500);
                }
              }

              // Ensure API-format table_of_content exists for submission
              doc.table_of_content = this.buildApiTableOfContent(doc.aiTableOfContent);
            }
          });
          
          this.isLoading = false;
          
          // After loading documents, validate them and update the parent model
          this.validateDocuments();
          this.updateParentModelWithDocuments();
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
      // Mark as touched once the user interacts with the field
      this.documents[index].touched = true;
      
      // Validate the field
      if (description && description.trim()) {
        this.documents[index].hasError = false;
        delete this.validationErrors[`documents.${index}.description`];
      } else {
        this.documents[index].hasError = true;
        this.validationErrors[`documents.${index}.description`] = ["The document description field is required."];
      }
      
      this.validateDocuments();
      this.updateParentModelWithDocuments();
    }
  }

  toggleChapters(docId: number): void {
    const index = this.documents.findIndex(doc => doc.id === docId);
    if (index !== -1) {
      this.documents[index].showChapters = !this.documents[index].showChapters;
      
      // Initialize chapters/table_of_content if toggled on
      if (this.documents[index].showChapters) {
        const tocItems = this.normalizeTableOfContent(this.documents[index].table_of_content);
        const aiTocItems = (this.documents[index].aiTableOfContent || []) as string[];

        // Prefer existing API TOC, otherwise fall back to AI TOC preview items
        const seed = tocItems.length > 0 ? tocItems : aiTocItems;
        if (seed.length > 0) {
          this.documents[index].chapters = seed.map((t: string) => ({ title: t }));
          this.updateTableOfContent(index);
        } else {
          this.documents[index].table_of_content = [];
          this.documents[index].chapters = [];
        }
      }
      
      // Clean up if toggled off
      if (!this.documents[index].showChapters) {
        this.documents[index].table_of_content = [];
        this.documents[index].chapters = [];
        this.documents[index].newChapterTitle = '';
      }
      
      this.updateParentModelWithDocuments();
    }
  }

  addChapter(docId: number): void {
    const index = this.documents.findIndex(doc => doc.id === docId);
    if (index !== -1 && this.documents[index].newChapterTitle.trim()) {
      // Initialize chapters array if it doesn't exist
      if (!this.documents[index].chapters) {
        this.documents[index].chapters = [];
      }
      
      // Add chapter to UI list
      this.documents[index].chapters.push({
        title: this.documents[index].newChapterTitle.trim()
      });
      
      // Update table_of_content for API
      this.updateTableOfContent(index);
      
      // Clear input
      this.documents[index].newChapterTitle = '';
      
      this.updateParentModelWithDocuments();
    }
  }

  // Remove a chapter
  removeChapter(docId: number, chapterIndex: number): void {
    const docIndex = this.documents.findIndex(doc => doc.id === docId);
    if (docIndex !== -1 && this.documents[docIndex].chapters) {
      this.documents[docIndex].chapters.splice(chapterIndex, 1);
      this.updateTableOfContent(docIndex);
      this.updateParentModelWithDocuments();
    }
  }

  // Move chapter up
  moveChapterUp(docId: number, chapterIndex: number): void {
    const docIndex = this.documents.findIndex(doc => doc.id === docId);
    if (docIndex === -1 || chapterIndex <= 0) return;
    const chapters = this.documents[docIndex].chapters || [];
    [chapters[chapterIndex - 1], chapters[chapterIndex]] = [chapters[chapterIndex], chapters[chapterIndex - 1]];
    this.documents[docIndex].chapters = chapters;
    this.updateTableOfContent(docIndex);
    this.updateParentModelWithDocuments();
  }

  // Move chapter down
  moveChapterDown(docId: number, chapterIndex: number): void {
    const docIndex = this.documents.findIndex(doc => doc.id === docId);
    if (docIndex === -1) return;
    const chapters = this.documents[docIndex].chapters || [];
    if (chapterIndex >= chapters.length - 1) return;
    [chapters[chapterIndex + 1], chapters[chapterIndex]] = [chapters[chapterIndex], chapters[chapterIndex + 1]];
    this.documents[docIndex].chapters = chapters;
    this.updateTableOfContent(docIndex);
    this.updateParentModelWithDocuments();
  }

  // Handle inline chapter title edits
  onChapterTitleChange(docId: number, chapterIndex: number): void {
    const docIndex = this.documents.findIndex(doc => doc.id === docId);
    if (docIndex !== -1 && this.documents[docIndex].chapters) {
      // Ensure title is a string (avoid undefined)
      const title = this.documents[docIndex].chapters[chapterIndex]?.title || '';
      this.documents[docIndex].chapters[chapterIndex].title = title;
      this.updateTableOfContent(docIndex);
      this.updateParentModelWithDocuments();
    }
  }

  // Update the table_of_content based on chapters
  private updateTableOfContent(docIndex: number): void {
    if (this.documents[docIndex].chapters && this.documents[docIndex].chapters.length > 0) {
      this.documents[docIndex].table_of_content = this.buildApiTableOfContent(
        this.documents[docIndex].chapters.map((c: ChapterItem) => c.title)
      );
    } else {
      this.documents[docIndex].table_of_content = []; // Set to empty array instead of undefined
    }
  }

  // Validate all documents and update form validity
  validateDocuments(): boolean {
    this.validationErrors = {};
    let isValid = true;
    
    // First check the main description (already handled by form validators)
    if (!this.form.get('description')?.valid) {
      isValid = false;
    }
    
    // Then check each document's description
    this.documents.forEach((doc, index) => {
      // Check description requirement regardless of touched state
      if (!doc.description || !doc.description.trim()) {
        // Mark document as having an error
        doc.hasError = true;
        this.validationErrors[`documents.${index}.description`] = ["The document description field is required."];
        isValid = false;
      } else {
        doc.hasError = false;
      }
    });
    
    // Update the form's validity
    this.isCurrentFormValid = this.form.valid && isValid;
    
    return isValid; // Return validation result for external checks
  }

  // Update parent model with all document descriptions and table_of_content
  private updateParentModelWithDocuments(): void {
    const documentDescriptions = this.documents.map(doc => {
      const result: any = {
        id: doc.id,
        description: doc.description || ''
      };

      // Always include table_of_content (AI or manual) to keep backend in sync
      result.table_of_content = doc.table_of_content || [];
      
      return result;
    });
    
    // Pass the form validity status that considers both the main form and document descriptions
    this.updateParentModel(
      { 
        description: this.form.get('description')?.value, // Keep for UI purposes but it won't be sent to API
        documentDescriptions 
      },
      this.form.valid && !this.hasDocumentErrors()
    );
  }

  // Helper method to check if there are any document errors
  private hasDocumentErrors(): boolean {
    return this.documents.some(doc => doc.hasError || !doc.description || !doc.description.trim());
  }

  private getFileIconByExtension(extension: string): string {
    const iconMap: { [key: string]: string } = {
      pdf: './assets/media/svg/new-files/pdf.svg',
      doc: './assets/media/svg/new-files/doc.svg',
      docx: './assets/media/svg/new-files/docx.svg',
      xls: './assets/media/svg/new-files/xls.svg',
      xlsx: './assets/media/svg/new-files/xlsx.svg',
      ppt: './assets/media/svg/new-files/ppt.svg',
      pptx: './assets/media/svg/new-files/pptx.svg',
      txt: './assets/media/svg/new-files/txt.svg',
      zip: './assets/media/svg/new-files/zip.svg',
      rar: './assets/media/svg/new-files/zip.svg'
    };
    return iconMap[extension?.toLowerCase()] || './assets/media/svg/files/default.svg';
  }

  // Check if we're in edit mode (knowledge has existing content)
  private isEditMode(): boolean {
    return !!this.knowledgeId && !!this.defaultValues && (
      !!this.defaultValues.title || 
      !!this.defaultValues.description ||
      !!this.defaultValues.industry ||
      !!this.defaultValues.topicId
    );
  }

  // Check if user has submitted values (navigating back to this step)
  private hasSubmittedValues(): boolean {
    return !!this.defaultValues?.documentDescriptions && 
           this.defaultValues.documentDescriptions.length > 0 &&
           this.defaultValues.documentDescriptions.some(doc => doc.description && doc.description.trim() !== '');
  }

  // Check if document description is Arabic (for text alignment)
  isDescriptionArabic(doc: any): boolean {
    const text = doc.animatedAbstractText || doc.description || '';
    // Remove HTML tags for checking
    const textWithoutHtml = text.replace(/<[^>]*>/g, '').trim();
    return this.isFirstWordArabic(textWithoutHtml);
  }

  // Check if table of content is Arabic (for text alignment)
  isTableOfContentArabic(doc: any): boolean {
    const tocItems = doc.animatedTocItems || doc.aiTableOfContent || [];
    if (tocItems.length === 0) return false;
    const firstItem = tocItems[0] || '';
    return this.isFirstWordArabic(firstItem);
  }
}