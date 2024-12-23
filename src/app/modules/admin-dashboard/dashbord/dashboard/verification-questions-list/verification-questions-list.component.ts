import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Table } from 'primeng/table';
import { Message } from 'primeng/api';
import { Observable } from 'rxjs';
import { QuestionsService, VerificationQuestion } from 'src/app/_fake/services/questions-CRUD/questions.service';

@Component({
  selector: 'app-verification-questions-list',
  templateUrl: './verification-questions-list.component.html',
  styleUrls: ['./verification-questions-list.component.scss']
})
export class VerificationQuestionsListComponent implements OnInit {
  questions: VerificationQuestion[] = [];
  isLoading$: Observable<boolean>;
  messages: Message[] = [];
  displayDialog: boolean = false;
  questionForm: FormGroup;
  isUpdate: boolean = false;
  selectedQuestion: VerificationQuestion | null = null;
  
  @ViewChild('dt') table!: Table;

  constructor(
    private questionsService: QuestionsService,
    private fb: FormBuilder
  ) {
    this.isLoading$ = this.questionsService.isLoading$;
    this.initForm();
  }

  ngOnInit(): void {
    this.loadQuestions();
  }

  initForm() {
    this.questionForm = this.fb.group({
      question: ['', Validators.required],
      type: ['', Validators.required],
      status: ['active', Validators.required]
    });
  }

  loadQuestions() {
    this.questionsService.getQuestions().subscribe({
      next: (questions) => {
        this.questions = questions;
      },
      error: (error) => {
        this.messages = [{
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load questions'
        }];
      }
    });
  }

  showDialog(question?: VerificationQuestion) {
    if (question) {
      this.isUpdate = true;
      this.selectedQuestion = question;
      this.questionForm.patchValue({
        question: question.question,
        type: question.type,
        status: question.status || 'active'
      });
    } else {
      this.isUpdate = false;
      this.selectedQuestion = null;
      this.questionForm.reset({ status: 'active' });
    }
    this.displayDialog = true;
  }

  submit() {
    if (this.questionForm.invalid) return;

    const formData = this.questionForm.value;
    
    if (this.isUpdate && this.selectedQuestion) {
      this.questionsService.updateQuestion(this.selectedQuestion.id, formData).subscribe({
        next: () => {
          this.messages = [{
            severity: 'success',
            summary: 'Success',
            detail: 'Question updated successfully'
          }];
          this.loadQuestions();
          this.displayDialog = false;
        },
        error: (error) => this.handleError(error)
      });
    } else {
      this.questionsService.createQuestion(formData).subscribe({
        next: () => {
          this.messages = [{
            severity: 'success',
            summary: 'Success',
            detail: 'Question created successfully'
          }];
          this.loadQuestions();
          this.displayDialog = false;
        },
        error: (error) => this.handleError(error)
      });
    }
  }

  deleteQuestion(question: VerificationQuestion) {
    this.questionsService.deleteQuestion(question.id).subscribe({
      next: () => {
        this.messages = [{
          severity: 'success',
          summary: 'Success',
          detail: 'Question deleted successfully'
        }];
        this.loadQuestions();
      },
      error: (error) => this.handleError(error)
    });
  }

  handleError(error: any) {
    this.messages = [{
      severity: 'error',
      summary: 'Error',
      detail: error.error?.message || 'An unexpected error occurred'
    }];
  }

  applyFilter(event: any) {
    const value = event.target.value;
    this.table.filterGlobal(value, 'contains');
  }

  onCancel() {
    this.displayDialog = false;
    this.questionForm.reset();
  }

  get hasErrorMessage(): boolean {
    return this.messages.some(msg => msg.severity === 'error');
  }

  get hasSuccessMessage(): boolean {
    return this.messages.some(msg => msg.severity === 'success');
  }
}
