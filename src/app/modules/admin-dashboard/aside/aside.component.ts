import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { NavigationCancel, NavigationEnd, Router } from '@angular/router';
import { Subscription, take } from 'rxjs';
import {
  MenuComponent,
  DrawerComponent,
  ToggleComponent,
  ScrollComponent,
} from '../../../_metronic/kt/components';
import { environment } from 'src/environments/environment';
import { LayoutService } from '../admin-services/layout.service';

@Component({
  selector: 'app-aside',
  templateUrl: './aside.component.html',
  styleUrls: ['./aside.component.scss'],
})
export class AsideComponent implements OnInit, OnDestroy {
  asideTheme: string = '';
  asideMinimize: boolean = false;
  asideMenuCSSClasses: string = '';
  // userDetails!:IUser;
  appPreviewDocsUrl: string = environment.appPreviewDocsUrl;
  @ViewChild('ktAsideScroll', { static: true }) ktAsideScroll!: ElementRef;
  private unsubscribe: Subscription[] = [];

  constructor(
    private layout: LayoutService, 
    private router: Router,
    
    ) {}

  ngOnInit(): void {
    this.getUserDetails()
    this.asideTheme = this.layout.getProp('aside.theme') as string;
    this.asideMinimize = this.layout.getProp('aside.minimize') as boolean;
    this.asideMenuCSSClasses = this.layout.getStringCSSClasses('asideMenu');
    this.routingChanges();
  }

  getUserDetails(){
    // this.userInfo.currentUserProfile$
    // .pipe(take(1))
    // .subscribe((userDetails:IUser)=> this.userDetails = userDetails )
  }

  routingChanges() {
    const routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd || event instanceof NavigationCancel) {
        this.menuReinitialization();
      }
    });
    this.unsubscribe.push(routerSubscription);
  }

  menuReinitialization() {
    setTimeout(() => {
      MenuComponent.reinitialization();
      DrawerComponent.reinitialization();
      ToggleComponent.reinitialization();
      ScrollComponent.reinitialization();
      if (this.ktAsideScroll && this.ktAsideScroll.nativeElement) {
        this.ktAsideScroll.nativeElement.scrollTop = 0;
      }
    }, 50);
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
