import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ScrollAnimsService } from 'src/app/_fake/services/scroll-anims/scroll-anims.service';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrl: './callback.component.scss'
})
export class CallbackComponent  extends BaseComponent implements OnInit, OnDestroy {
  constructor(  scrollAnims: ScrollAnimsService, private router:Router){
    super(scrollAnims);
  }
  ngOnInit(): void {
  }
  toApp() {
    this.router.navigateByUrl("/app");
  }
}
