import { Component, Injector, OnInit } from '@angular/core';
import { AuthService } from 'src/app/modules/auth';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-settings-action',
  templateUrl: './settings-action.component.html',
  styleUrl: './settings-action.component.scss'
})
export class SettingsActionComponent extends BaseComponent implements OnInit {
  roles:any[] = [];
  constructor(injector:Injector,private _profile:AuthService){
    super(injector);
  }
  ngOnInit(): void {
    const profile = this._profile.getProfile()
    .subscribe(
      {
        next:(profile)=>{
          this.roles = profile.roles;
        },
        error:(err)=>{
          console.log(err);
        }
      }
    )
  }

  hasRole(requiredRoles: string[]): boolean {
    return requiredRoles.some((role) => this.roles.includes(role));
  }
}
