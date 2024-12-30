import { Component, Inject, Injector, OnInit } from '@angular/core';
import { extend } from 'jquery';
import { TransferCorporateAccountService } from 'src/app/_fake/services/transfer-coporate-account/transfer-corporate-account.service';
import { BaseComponent } from 'src/app/modules/base.component';
import Swal from 'sweetalert2';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, of, switchMap, takeUntil } from 'rxjs';

interface User {
  name: string;
  email: string;
  profile_image?: string;
  first_name: string;
  last_name: string;
  bgClass?: string; // Add a property to hold the background class
  // Add other relevant fields if necessary
}


@Component({
  selector: 'app-insighters-modal',
  templateUrl: './insighters-modal.component.html',
  styleUrls: ['./insighters-modal.component.scss']
})
export class InsightersModalComponent extends BaseComponent implements OnInit {
  step:number=1;
  isLoading: boolean = false;
  fetchedUsers: any[] = [];
  selectedUser: User | null = null;
  constructor(
    injector: Injector,
    private transferCoporateAccountService: TransferCorporateAccountService,
    @Inject(NgbActiveModal) public activeModal: NgbActiveModal
  ){
    super(injector)
  }
  searchControl:FormControl = new FormControl('')

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term: string) => {
        if (term.trim() === '') {
          return of([]); // Return an Observable emitting an empty array
        }
        this.isLoading = true;
        return this.transferCoporateAccountService.searchInsighters(term, this.lang ? this.lang : "en");
      }),
      takeUntil(this.unsubscribe$)
    ).subscribe({
      next: (response: any) => { // Adjust based on actual response structure
        // Assuming the response has a 'data' property containing the users
        const users: User[] = Array.isArray(response) ? response : response.data || [];
        // Assign a random class to each user
        this.fetchedUsers = users.map(user => ({
          ...user,
          bgClass: this.getRandomClass()
        }));
        this.isLoading = false;
      },
      error: (err) => {
        this.handleServerErrors(err);
        this.isLoading = false;
      }
    });
  }

  code: string = '';
  searchTerm: string = '';


 
  inviteUser(user: User) {
    const email = user.email;
    this.selectedUser = user;
    Swal.fire({
      title: this.lang==='ar' ? 'هل انت متاكد' : "Are you sure?",
      text:  this.lang ==='ar' ? `هل أنت متاكد من إرسال الدعوة إلى ${email}؟` : `Are you sure you want to send an invitation to ${email}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: this.lang==='ar' ? "نعم" : "Yes",
      cancelButtonText: this.lang==='ar' ? "لا" : "No",
    }).then((result) => {
      if (result.isConfirmed) {
        const inviteSub = this.transferCoporateAccountService.sendTransferInvitation(email,this.lang ? this.lang : "en")
        .subscribe({
          next: (res) => {
            const title = this.lang==='ar' ? "تم إرسال الدعوة بنجاح" : "Invitation sent successfully"
            const message = this.lang==='ar' ? `تم إرسال الدعوة إلى ${email} بنجاح` : `Invitation sent to ${email} successfully`;
          this.showSuccess(title,message);
            this.step=2;
          },
          error: (err) => {
            this.handleServerErrors(err)
          }
        });
        this.unsubscribe.push(inviteSub)
      }
    })


   
  }
  transfer(){
    if(!this.selectedUser) return;
   const verifySub = this.transferCoporateAccountService.verifyTransferInvitation(this.selectedUser.email, this.code, this.lang ? this.lang : "en")
   .subscribe({
    next: (res) => {
      const message = this.lang === 'ar' ? "تم التحقق بنجاح" : "Verification successful";
      this.showSuccess('', message);
      this.activeModal.close();
      // Reload the page after successful transfer
      window.location.reload();
    },
    error: (err) => {
      this.handleServerErrors(err)
    }
   })
   this.unsubscribe.push(verifySub)
  }

  getInitials(name:string){
    return name.split(' ').map(word => word[0]).join('');
  }
  private getRandomClass(): string {
    const classes = [
      'bg-light-success',
      'bg-light-info',
      'bg-light-primary',
      'bg-light-warning',
      'bg-light-danger',
      'bg-light-secondary',
      'bg-light-dark'
    ];
    const randomIndex = Math.floor(Math.random() * classes.length);
    return classes[randomIndex];
  }
  private handleServerErrors(error: any) {
   
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
         
          this.showError(this.lang==='ar' ? "حدث خطأ" : "An error occurred",messages.join(", "))
        }
      }
    } else {

      this.showError(this.lang==='ar' ? "حدث خطأ" : "An error occurred",this.lang==='ar' ? "حدث خطأ" : "An unexpected error occurred.")
    }
  }
}
