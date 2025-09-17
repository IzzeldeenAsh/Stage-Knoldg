import { Component, OnInit, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponent } from 'src/app/modules/base.component';
import { FundService, InsighterWallet, PaginatedResponse } from 'src/app/_fake/services/fund.service';

@Component({
  selector: 'app-insighter-wallets-list',
  templateUrl: './insighter-wallets-list.component.html',
  styleUrls: ['./insighter-wallets-list.component.scss']
})
export class InsighterWalletsListComponent extends BaseComponent implements OnInit {
  wallets: InsighterWallet[] = [];
  isLoading$!: any;
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  Math = Math;

  constructor(
    injector: Injector,
    private fundService: FundService,
    private router: Router
  ) {
    super(injector);
    this.isLoading$ = this.fundService.isLoading$;
  }

  ngOnInit(): void {
    this.loadWallets();
  }

  loadWallets(page: number = 1): void {
    this.currentPage = page;
    this.unsubscribe.push(
      this.fundService.getInsighterWallets(page).subscribe({
        next: (response: PaginatedResponse<InsighterWallet>) => {
          this.wallets = response.data;
          this.totalPages = response.meta.last_page;
          this.totalItems = response.meta.total;
        },
        error: (error) => {
          this.handleServerErrors(error);
        }
      })
    );
  }

  viewTransactions(insighterId: number): void {
    this.router.navigate(['/admin-dashboard/admin/fund/insighter-wallets/transactions', insighterId]);
  }

  onPageChange(page: number): void {
    this.loadWallets(page);
  }

  private handleServerErrors(error: any) {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          this.showError(
            this.lang === "ar" ? "حدث خطأ" : "An error occurred",
            messages.join(", ")
          );
        }
      }
    } else {
      this.showError(
        this.lang === "ar" ? "حدث خطأ" : "An error occurred",
        this.lang === "ar" ? "حدث خطأ" : "An unexpected error occurred."
      );
    }
  }
}