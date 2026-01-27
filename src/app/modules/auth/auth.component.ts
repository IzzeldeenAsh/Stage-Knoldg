import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

// const BODY_CLASSES = ['bgi-size-cover', 'bgi-position-center', 'bgi-no-repeat'];

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent implements OnInit, OnDestroy {
  today: Date = new Date();

  constructor(
    private location: Location,
    private router: Router
  ) {}

  ngOnInit(): void {
    // BODY_CLASSES.forEach((c) => document.body.classList.add(c));
  }

  ngOnDestroy() {
    // BODY_CLASSES.forEach((c) => document.body.classList.remove(c));
  }

  goBack(): void {
    // If there is history, go back; otherwise fallback to root.
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigateByUrl('/');
  }
}
