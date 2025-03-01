import { Component, Injector } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './app-footer.component.html',
  styleUrl: './app-footer.component.scss'
})
export class AppFooterComponent  extends BaseComponent {
constructor(injector: Injector) {
  super(injector)
}

}
