import { Component, Injector, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-step-2',
  templateUrl: './step-2.component.html',
  styleUrls: ['./step-2.component.scss']
})
export class Step2Component extends BaseComponent  implements OnInit {
  form: FormGroup;

  constructor(injector: Injector,private fb: FormBuilder) {
    super(injector);
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      items: this.fb.array([this.createItem()])
    });
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  createItem(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      description: [''],
      tableOfContents: [''],
      price: [''],
      file: [null]
    });
  }

  addItem() {
    this.items.push(this.createItem());
  }

  removeItem(index: number) {
    this.items.removeAt(index);
  }

  onFileSelected(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.items.at(index).patchValue({ file });
    }
  }

  submit() {
    console.log(this.form.value);
  }
}
