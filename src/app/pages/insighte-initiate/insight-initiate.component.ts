import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';
import { MenuItem } from 'primeng/api';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-insight-initiate',
  templateUrl: './insight-initiate.component.html',
  styleUrl: './insight-initiate.component.scss',
  animations: [
    trigger('stepAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(70px)' }),
        animate('500ms ease-out', 
          style({ opacity: 1, transform: 'translateY(0)' })
        )
      ]),
      transition(':leave', [
        animate('500ms ease-out', 
          style({ opacity: 0, transform: 'translateY(-70px)' })
        )
      ])
    ])
  ]
})  
export class InsightInitiateComponent extends BaseComponent implements OnInit {
  constructor(injector: Injector){
    super(injector);
  }
  ngOnInit(): void {
  
  }
  activeStep = 1;
  items: MenuItem[] = [
    {
      label: 'Initial Insight',
      icon: 'pi pi-user' // Example icon
    },
    {
      label: 'Library Documents',
      icon: 'pi pi-upload' // Example icon
    },
    {
      label: 'Insight Documents',
      icon: 'pi pi-check' // Example icon
    },
    {
      label: 'Package   ',
      icon: 'pi pi-eye' // Example icon
    },
    {
      label: 'Tags & Keywords',
      icon: 'pi pi-flag' // Example icon
    }
  ];
  

  onActiveIndexChange(event: number) {
    this.activeStep = event + 1;
  }

  goToStep(step: number) {
    if (step >= 1 && step <= this.items.length) {
      // Add a small delay to allow for the animation
      setTimeout(() => {
        this.activeStep = step;
      }, 50);
    }
  }
}
