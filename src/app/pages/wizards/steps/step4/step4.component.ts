import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ICreateAccount } from '../../create-account.helper';

@Component({
  selector: 'app-step4',
  templateUrl: './step4.component.html',
})
export class Step4Component {}