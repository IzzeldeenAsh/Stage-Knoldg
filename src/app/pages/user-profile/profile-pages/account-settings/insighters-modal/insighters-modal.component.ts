import { Component, Injector } from '@angular/core';
import { extend } from 'jquery';
import { TransferCorporateAccountService } from 'src/app/_fake/services/transfer-coporate-account/transfer-corporate-account.service';
import { BaseComponent } from 'src/app/modules/base.component';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-insighters-modal',
  templateUrl: './insighters-modal.component.html',
  styleUrls: ['./insighters-modal.component.scss']
})
export class InsightersModalComponent extends BaseComponent {
  step:number=1;
  constructor(
    injector :Injector,
    private transferCoporateAccountService:TransferCorporateAccountService){
    super(injector)
  }
  code:string='';
  searchTerm: string = '';
   userSelected=[{ name: 'Emma Smith', email: 'smithkpmg.com',initials: 'M', bg: 'bg-light-warning text-warning' , avatar: './assets/media/avatars/300-6.jpg' }]
  users = [
    { name: 'Emma Smith', email: 'smithkpmg.com', avatar: './assets/media/avatars/300-6.jpg' },
    { name: 'Melody Macy', email: 'melodyaltbox.com', initials: 'M', bg: 'bg-light-danger text-danger' },
    { name: 'Max Smith', email: 'maxkt.com', avatar: './assets/media/avatars/300-1.jpg' },
    { name: 'Sean Bean', email: 'seandellito.com', avatar: './assets/media/avatars/300-5.jpg' },
    { name: 'Brian Cox', email: 'brianexchange.com', avatar: './assets/media/avatars/300-25.jpg' },
    { name: 'Mikaela Collins', email: 'mikpex.com', initials: 'C', bg: 'bg-light-warning text-warning' },
    { name: 'Francis Mitcham', email: 'f.mitkpmg.com', avatar: './assets/media/avatars/300-9.jpg' },
    { name: 'Olivia Wild', email: 'oliviacorpmail.com', initials: 'O', bg: 'bg-light-danger text-danger' },
    { name: 'Neil Owen', email: 'owen.neilgmail.com', initials: 'N', bg: 'bg-light-primary text-primary' },
    { name: 'Dan Wilson', email: 'damconsilting.com', avatar: './assets/media/avatars/300-23.jpg' },
    { name: 'Emma Bold', email: 'emmaintenso.com', initials: 'E', bg: 'bg-light-danger text-danger' },
    { name: 'Ana Crown', email: 'ana.cflimtel.com', avatar: './assets/media/avatars/300-12.jpg' },
    { name: 'Robert Doe', email: 'robertbenko.com', initials: 'A', bg: 'bg-light-info text-info' },
    { name: 'John Miller', email: 'millermapple.com', avatar: './assets/media/avatars/300-13.jpg' },
    { name: 'Lucy Kunic', email: 'lucy.mfentech.com', initials: 'L', bg: 'bg-light-success text-success' },
    { name: 'Ethan Wilder', email: 'ethanloop.com.au', avatar: './assets/media/avatars/300-21.jpg' },
    { name: 'Max Smith', email: 'maxkt.com', avatar: './assets/media/avatars/300-1.jpg' }
  ];

  get filteredUsers() {
    if (!this.searchTerm) {
      return this.users;
    }
    const term = this.searchTerm.toLowerCase();
    return this.users.filter(user => 
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
  }
  inviteUser(email: string) {
    const fakeEmail= "ezraashour00@gmail.com"
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
        const inviteSub = this.transferCoporateAccountService.sendTransferInvitation(fakeEmail,this.lang ? this.lang : "en")
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
    console.log(this.code)
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
