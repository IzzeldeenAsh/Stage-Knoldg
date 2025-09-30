import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ChartComponent, ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexPlotOptions, ApexTooltip, ApexXAxis, ApexYAxis, ApexGrid, ApexFill, ApexStroke, ApexLegend } from 'ng-apexcharts';
import { Subject, takeUntil } from 'rxjs';
import {
  CompanyAccountService,
  CompanyInsighterStatistics,
  CompanyOrderKnowledgeStatisticsResponse
} from 'src/app/_fake/services/company-account/company-account.service';
import { TranslationService } from 'src/app/modules/i18n';

type CompanySalesStatistics = CompanyOrderKnowledgeStatisticsResponse['data'];

export type CompanySalesChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  tooltip: ApexTooltip;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  grid: ApexGrid;
  fill: ApexFill;
  stroke: ApexStroke;
  colors: string[];
  legend: ApexLegend;
};

@Component({
  selector: 'app-company-sales-statistics',
  templateUrl: './company-sales-statistics.component.html',
  styleUrls: ['./company-sales-statistics.component.scss']
})
export class CompanySalesStatisticsComponent implements OnInit, OnDestroy {
  @ViewChild('chart') chart: ChartComponent | undefined;

  private readonly chartColors = ['#0095E8', '#1E90FF', '#0070C0', '#4682B4', '#104E8B', '#5A8FBD', '#33A5EC'];

  chartOptions: Partial<CompanySalesChartOptions> = this.createInitialChartOptions();
  loading = false;
  error = false;
  hasData = false;

  totalOrders = 0;
  totalAmount = 0;
  totalCompanyProfit = 0;
  insighters: CompanyInsighterStatistics[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private readonly companyAccountService: CompanyAccountService,
    private readonly translationService: TranslationService
  ) {}

  ngOnInit(): void {
    this.loadStatistics();

    this.translationService
      .onLanguageChange()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateChartTranslations();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  reload(): void {
    if (!this.loading) {
      this.loadStatistics();
    }
  }

  private loadStatistics(): void {
    this.loading = true;
    this.error = false;

    this.companyAccountService
      .getCompanyOrderKnowledgeStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: CompanySalesStatistics) => {
          this.loading = false;
          this.error = false;

          this.totalOrders = data?.total_orders ?? 0;
          this.totalAmount = data?.total_amount ?? 0;
          this.totalCompanyProfit = data?.total_company_profit ?? 0;

          this.insighters = (data?.insighters ?? [])
            .filter(Boolean)
            .sort((a: CompanyInsighterStatistics, b: CompanyInsighterStatistics) => (b?.total_orders ?? 0) - (a?.total_orders ?? 0));

          this.updateChartData();
        },
        error: (err) => {
          console.error('Error loading company insighter sales statistics', err);
          this.loading = false;
          this.error = true;
          this.insighters = [];
          this.chartOptions = this.createInitialChartOptions();
          this.hasData = false;
        }
      });
  }

  private updateChartData(): void {
    const relevantInsighters = this.insighters.filter((insighter) => (insighter?.total_orders ?? 0) > 0);

    this.hasData = relevantInsighters.length > 0;

    if (!this.hasData) {
      this.chartOptions = this.createInitialChartOptions();
      return;
    }

    const limitedInsighters = relevantInsighters.slice(0, 10);
    const labels = limitedInsighters.map((insighter) => insighter.insighter_name || 'N/A');
    const data = limitedInsighters.map((insighter) => insighter.total_orders ?? 0);
    const colors = this.getDistributedColors(limitedInsighters.length);

    const maxValue = Math.max(...data);
    const yAxisMax = this.computeYAxisMax(maxValue);

    this.chartOptions = {
      ...this.chartOptions,
      series: [
        {
          name: this.translationService.getTranslation('COMPANY_SALES_STATISTICS.TOTAL_ORDERS_LABEL'),
          data
        }
      ],
      xaxis: {
        ...this.chartOptions.xaxis,
        categories: labels,
        labels: {
          ...(this.chartOptions.xaxis?.labels ?? {}),
          style: {
            ...(this.chartOptions.xaxis?.labels?.style ?? {}),
            colors: Array(labels.length).fill('#475569'),
            fontSize: '12px',
            fontWeight: 600
          },
          rotate: 0,
          trim: true
        }
      },
      yaxis: {
        ...(this.chartOptions.yaxis ?? {}),
        max: yAxisMax || undefined,
        tickAmount: 4,
        labels: {
          ...(this.chartOptions.yaxis?.labels ?? {}),
          style: {
            ...(this.chartOptions.yaxis?.labels?.style ?? {}),
            colors: '#64748B',
            fontSize: '11px',
            fontWeight: 500
          }
        }
      },
      colors
    };

    this.updateChartTranslations();
  }

  private updateChartTranslations(): void {
    if (!this.chartOptions) {
      return;
    }

    const label = this.translationService.getTranslation('COMPANY_SALES_STATISTICS.TOTAL_ORDERS_LABEL');

    this.chartOptions = {
      ...this.chartOptions,
      series: this.chartOptions.series
        ? this.chartOptions.series.map((seriesItem) => ({
            ...seriesItem,
            name: label
          }))
        : this.chartOptions.series,
      tooltip: {
        ...(this.chartOptions.tooltip ?? {}),
        y: {
          formatter: (value: number) => `${label}: ${Math.round(value ?? 0)}`
        }
      }
    };
  }

  private createInitialChartOptions(): Partial<CompanySalesChartOptions> {
    return {
      series: [],
      chart: {
        type: 'bar',
        height: 300,
        width: '100%',
        fontFamily: 'Poppins, sans-serif',
        stacked: false,
        toolbar: {
          show: false
        },
        animations: {
          enabled: true,
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        },
        background: 'transparent',
        offsetX: 0,
        offsetY: 0,
        parentHeightOffset: 0
      },
      colors: [...this.chartColors],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '30px',
          borderRadius: 8,
          distributed: false,
          dataLabels: {
            position: 'top'
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: 2,
        colors: ['transparent'],
        curve: 'smooth'
      },
      fill: {
        opacity: 0.9,
        type: 'solid'
      },
      xaxis: {
        categories: [],
        labels: {
          style: {
            fontSize: '12px',
            fontWeight: 500,
            colors: '#555555'
          },
          rotate: 0,
          hideOverlappingLabels: false,
          trim: false,
          maxHeight: 80
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        title: {
          text: ''
        },
        labels: {
          style: {
            fontSize: '12px',
            fontWeight: 500,
            colors: '#555555'
          }
        }
      },
      tooltip: {
        shared: true,
        intersect: false,
        style: {
          fontSize: '12px',
          fontFamily: 'Poppins, sans-serif'
        },
        theme: 'light',
        marker: {
          show: true
        }
      },
      legend: {
        show: false
      },
      grid: {
        show: true,
        borderColor: '#f1f1f1',
        strokeDashArray: 3,
        position: 'back',
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        },
        padding: {
          top: 0,
          right: 0,
          bottom: 10,
          left: 10
        }
      }
    };
  }

  private getDistributedColors(count: number): string[] {
    const colors: string[] = [];

    for (let i = 0; i < count; i++) {
      colors.push(this.chartColors[i % this.chartColors.length]);
    }

    return colors;
  }

  private computeYAxisMax(maxValue: number): number {
    if (!maxValue || maxValue <= 0) {
      return 0;
    }

    const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));
    const normalized = Math.ceil(maxValue / magnitude);
    let niceNormalized: number;

    if (normalized <= 2) {
      niceNormalized = 2;
    } else if (normalized <= 5) {
      niceNormalized = 5;
    } else {
      niceNormalized = 10;
    }

    return niceNormalized * magnitude;
  }
}
