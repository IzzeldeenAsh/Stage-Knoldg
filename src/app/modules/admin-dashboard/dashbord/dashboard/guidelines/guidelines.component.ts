import { Component, OnInit, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { GuidelineType, GuidelinesService } from 'src/app/_fake/services/guidelines/guidelines.service';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-guideline',
  templateUrl: './guidelines.component.html',
  styleUrls: ['./guidelines.component.scss'],
})
export class GuidelineComponent extends BaseComponent implements OnInit {
  guidelineTypes: GuidelineType[] = [];
  isLoading$: Observable<boolean>;

  constructor(
    private guidelinesService: GuidelinesService,
    private router: Router,
    injector: Injector
  ) {
    super(injector);
    this.isLoading$ = this.guidelinesService.isLoading$;
  }

  ngOnInit(): void {
    this.loadGuidelineTypes();
  }

  loadGuidelineTypes() {
    this.guidelinesService.getGuidelineTypes().subscribe({
      next: (data) => {
        this.guidelineTypes = data;
      },
      error: (err) => {
        console.error(err);
        this.showError(
          this.lang === 'ar' ? 'حدث خطأ' : 'Error',
          this.lang === 'ar' ? 'فشل في تحميل أنواع التوجيهات' : 'Failed to load guideline types'
        );
      },
    });
  }

  navigateToGuideline(value: string) {
    this.router.navigate(['/admin-dashboard/admin/dashboard/main-dashboard/guidelines', value]);
  }
}
