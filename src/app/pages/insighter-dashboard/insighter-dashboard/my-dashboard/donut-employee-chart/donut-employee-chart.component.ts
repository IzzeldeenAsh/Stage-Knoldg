import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CompanyAccountService } from 'src/app/_fake/services/company-account/company-account.service';
import {
  ArcElement,
  Chart as ChartJS,
  ChartData,
  ChartOptions,
  Legend,
  Plugin,
  Tooltip
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const doughnutCenterTextPlugin: Plugin<'doughnut'> = {
  id: 'doughnutCenterText',
  afterDatasetsDraw: (chart) => {
    const { ctx } = chart;
    const dataset = chart.data.datasets[0];

    if (!dataset || !dataset.data.length) {
      return;
    }

    const meta = chart.getDatasetMeta(0);
    if (!meta || !meta.data.length) {
      return;
    }

    const total = dataset.data.reduce((sum, value) => sum + Number(value ?? 0), 0);
    const centerPoint = meta.data[0];

    if (!centerPoint) {
      return;
    }

    const { x, y } = centerPoint;

    ctx.save();

    ctx.font = '600 20px "Inter", "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = '#111827';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total.toLocaleString(), x, y - 6);

    ctx.font = '500 12px "Inter", "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = '#6B7280';
    ctx.fillText('Total', x, y + 14);

    ctx.restore();
  }
};

ChartJS.register(doughnutCenterTextPlugin);

@Component({
  selector: 'app-donut-employee-chart',
  templateUrl: './donut-employee-chart.component.html',
  styleUrl: './donut-employee-chart.component.scss'
})
export class DonutEmployeeChartComponent implements OnInit {
  loading = false;
  error = false;
  hasEnoughData = false;
  employees: any[] = [];
  @Output() hasMultipleEmployeesDonut = new EventEmitter<boolean>();
  chartData: ChartData<'doughnut'> = this.createEmptyChartData();
  chartOptions: ChartOptions<'doughnut'> = this.createChartOptions();

  private readonly chartColors = [
    '#0095E8',
    '#1E90FF',
    '#0070C0',
    '#4682B4',
    '#104E8B'
  ];

  private readonly hoverColors = [
    '#33A5EC',
    '#3AA4FF',
    '#2380CD',
    '#5A8FBD',
    '#1C5F9A'
  ];

  constructor(private companyAccountService: CompanyAccountService) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  private extractKnowledgeStatistics(employees: any[]): { byType: { [key: string]: number }; total: number } {
    const statisticsByType: { [key: string]: number } = {
      report: 0,
      data: 0,
      insight: 0,
      manual: 0,
      course: 0
    };
    let totalAll = 0;

    employees.forEach(employee => {
      const stats = employee.statistics;
      if (stats && typeof stats === 'object') {
        Object.keys(statisticsByType).forEach(type => {
          const count = stats[type] || 0;
          statisticsByType[type] += count;
          totalAll += count;
        });
      }
    });

    return {
      byType: statisticsByType,
      total: totalAll
    };
  }

  private loadStatistics(): void {
    this.loading = true;
    this.error = false;

    this.companyAccountService.getEmployeeKnowledgeStatistics().subscribe({
      next: (response) => {
        this.employees = response.data;
        this.loading = false;
        this.error = false;

        this.hasEnoughData = this.employees.length > 0 &&
          this.employees.some(employee => {
            const stats = employee.statistics;
            return stats && (stats.report > 0 || stats.data > 0 || stats.insight > 0 || stats.manual > 0 || stats.course > 0);
          });
        this.hasMultipleEmployeesDonut.emit(this.hasEnoughData);

        if (this.hasEnoughData) {
          const stats = this.extractKnowledgeStatistics(this.employees);

          const series = [
            stats.byType.report || 0,
            stats.byType.data || 0,
            stats.byType.insight || 0,
            stats.byType.manual || 0,
            stats.byType.course || 0
          ];

          if (series.some(value => value > 0)) {
            this.updateChart(series, ['Reports', 'Data', 'Insights', 'Manual', 'Courses']);
          } else {
            this.hasMultipleEmployeesDonut.emit(false);
            this.chartData = this.createEmptyChartData();
          }
        } else {
          this.chartData = this.createEmptyChartData();
        }
      },
      error: (error) => {
        console.error('Error loading employee knowledge statistics', error);
        this.error = true;
        this.loading = false;
        this.chartData = this.createEmptyChartData();
        this.hasMultipleEmployeesDonut.emit(false);
      }
    });
  }

  private updateChart(series: number[], labels: string[]): void {
    this.chartData = {
      labels,
      datasets: [
        {
          data: series,
          backgroundColor: this.chartColors,
          hoverBackgroundColor: this.hoverColors,
          borderWidth: 2,
          borderColor: '#FFFFFF',
          hoverOffset: 6
        }
      ]
    };
  }

  private createEmptyChartData(): ChartData<'doughnut'> {
    return {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [],
          hoverBackgroundColor: [],
          borderWidth: 0
        }
      ]
    };
  }

  private createChartOptions(): ChartOptions<'doughnut'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      animation: {
        animateRotate: true,
        animateScale: true
      },
      plugins: {
        legend: {
          position: 'right',
          align: 'center',
          labels: {
            usePointStyle: true,
            padding: 18,
            color: '#4B5563',
            font: {
              size: 12,
              family: 'Inter, "Helvetica Neue", Arial, sans-serif',
              weight: 500
            }
          }
        },
        tooltip: {
          backgroundColor: '#111827',
          titleColor: '#F9FAFB',
          bodyColor: '#D1D5DB',
          borderColor: '#1F2937',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.formattedValue || '0';
              return `${label}: ${value}`;
            }
          }
        }
      }
    };
  }

  get hasChartData(): boolean {
    const dataset = this.chartData.datasets?.[0];
    return Array.isArray(dataset?.data) && dataset.data.some(value => Number(value ?? 0) > 0);
  }
}
