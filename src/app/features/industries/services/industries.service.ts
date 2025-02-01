import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Industry } from '../../../shared/interfaces/industry.interface';

@Injectable({
  providedIn: 'root'
})
export class IndustriesService {
  // Dummy data for now
  private industries: Industry[] = [
    {
      id: '1',
      name: 'Technology',
      description: 'Technology industry including software, hardware, and IT services',
      imageUrl: 'assets/images/industries/technology.jpg',
      subIndustries: [
        { id: '1-1', name: 'Software Development', description: 'Custom software solutions and applications' },
        { id: '1-2', name: 'Cloud Computing', description: 'Cloud infrastructure and services' },
        { id: '1-3', name: 'Cybersecurity', description: 'Information security and data protection' }
      ]
    },
    {
      id: '2',
      name: 'Healthcare',
      description: 'Healthcare and medical services industry',
      imageUrl: 'assets/images/industries/healthcare.jpg',
      subIndustries: [
        { id: '2-1', name: 'Medical Devices', description: 'Medical equipment and devices manufacturing' },
        { id: '2-2', name: 'Pharmaceuticals', description: 'Drug development and manufacturing' },
        { id: '2-3', name: 'Healthcare Services', description: 'Medical facilities and patient care' }
      ]
    }
  ];

  getIndustries(): Observable<Industry[]> {
    return of(this.industries);
  }

  getIndustryById(id: string): Observable<Industry | undefined> {
    return of(this.industries.find(industry => industry.id === id));
  }
}
