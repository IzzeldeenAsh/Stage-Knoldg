import { Component, OnInit } from '@angular/core';
import { TranslationService } from '../../i18n/translation.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-navbar',
  templateUrl: './home-navbar.component.html',
  styleUrls: ['./home-navbar.component.scss']
})
export class HomeNavbarComponent  {
  isSidebarOpen = false;
 

  constructor(private translationService: TranslationService,private router:Router) {
   
  }
  

  toggleMobileSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toLogin(event:Event){
    // event.preventDefault();
    // event.stopPropagation();
    // console.log("Test")
    // this.router.navigate(['/auth/login'])
  }


}