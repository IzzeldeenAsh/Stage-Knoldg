import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';

// Interface for components that can be guarded against navigation when they have pending changes
export interface ComponentCanDeactivate {
  canDeactivate: () => boolean | Observable<boolean>;
}

@Injectable({
  providedIn: 'root'
})
export class PendingChangesGuard implements CanDeactivate<ComponentCanDeactivate> {
  
  canDeactivate(component: ComponentCanDeactivate): boolean | Observable<boolean> {
    // Check if the component has a canDeactivate method
    return component.canDeactivate ? component.canDeactivate() : true;
  }
}
