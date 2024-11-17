import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ScrollAnimsService } from 'src/app/_fake/services/scroll-anims/scroll-anims.service';
import { BaseComponent } from 'src/app/modules/base.component';
import { AuthService } from '../../services/auth.service';
import { first } from 'rxjs/operators';
import { AuthModel } from '../../models/auth.model';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.scss']
})
export class CallbackComponent extends BaseComponent implements OnInit, OnDestroy {
  user: any;
  token: string | null = null;
  roles: string[] = [];
  errorMessage: string | null = null;

  constructor(
    scrollAnims: ScrollAnimsService,
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService
  ) {
    super(scrollAnims);
  }

  ngOnInit(): void {
    // Extract query parameters from the URL
  const routeSub =  this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token');
      const rolesParam = params.get('roles');

      if (this.token && rolesParam) {
        // Assuming roles are comma-separated if multiple
        this.roles = rolesParam.split(',').map(role => role.trim());
        const auth = new AuthModel();
        auth.authToken = this.token
        this.auth.setAuthFromLocalStorage(auth);
       
      } else {
        this.errorMessage = 'Invalid callback parameters.';
      }
    });
    this.unsubscribe.push(routeSub)
  }


  toApp(): void {
    this.auth.getProfile().pipe(first()).subscribe()
  }
}
