import { Component } from '@angular/core';
import { TranslationService } from '../i18n';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent {
constructor(
  private translation:TranslationService
) {
}

ngOnInit(): void {
 this.translation.setLanguage('en')
}

ngAfterViewInit(): void {
 
}

}
