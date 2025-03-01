import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KnowledgeUpdateService {
  private knowledgeUpdated = new Subject<void>();

  knowledgeUpdated$ = this.knowledgeUpdated.asObservable();

  notifyKnowledgeUpdate() {
    this.knowledgeUpdated.next();
  }
}
