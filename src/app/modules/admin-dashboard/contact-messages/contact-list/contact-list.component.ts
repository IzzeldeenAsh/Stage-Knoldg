import { Component, Injector, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactMessage, ContactMessageService, ContactMessagesResponse } from '../contact-message.service';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-contact-list',
  templateUrl: './contact-list.component.html',
  styleUrls: ['./contact-list.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ContactListComponent extends BaseComponent implements OnInit {
  contactMessages: ContactMessage[] = [];
  loading = true;
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;

  constructor(injector: Injector, private contactMessageService: ContactMessageService) {
    super(injector);
  }

  ngOnInit(): void {
    this.loadContactMessages();
  }

  loadContactMessages(page: number = 1): void {
    this.loading = true;
    this.contactMessageService.getContactMessages(page).subscribe({
      next: (response: ContactMessagesResponse) => {
        this.contactMessages = response.data;
        this.currentPage = response.meta.current_page;
        this.totalPages = response.meta.last_page;
        this.totalItems = response.meta.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching contact messages:', error);
        this.loading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.loadContactMessages(page);
  }

  markAsRead(id: number): void {
    this.contactMessageService.updateStatus(id, 'read').subscribe({
      next: () => {
        // Update the status in the local array
        const message = this.contactMessages.find(m => m.id === id);
        if (message) {
          message.status = 'read';
        }
      },
      error: (error) => console.error('Error updating status:', error)
    });
  }
}
