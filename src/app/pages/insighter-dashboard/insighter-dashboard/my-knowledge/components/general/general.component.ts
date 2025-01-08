import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrl: './general.component.scss'
})
export class GeneralComponent implements OnInit {
  showPackageSidebar = false;

  constructor() {}

  ngOnInit(): void {}

  togglePackageSidebar() {
    this.showPackageSidebar = !this.showPackageSidebar;
  }
}