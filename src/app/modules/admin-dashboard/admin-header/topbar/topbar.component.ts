import { Component, ElementRef, HostListener, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs';
import { AuthService, UserType } from 'src/app/modules/auth';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent implements OnInit {
  user:UserType;

constructor(private elRef: ElementRef, private renderer: Renderer2, private _auth:AuthService,private router:Router){
}
  ngOnInit(): void {
    this._auth.currentUser$.pipe(first()).subscribe((res)=>{
      this.user = res
      console.log("res",res);
    })
  }
  signOut(){
    this._auth.logout().pipe(first()).subscribe();
    this.router.navigateByUrl('/auth/login');
  }

  isMenuOpen = false;
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event): void {
    const clickedInside = this.elRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.closeMenu();
    }
  }
}
