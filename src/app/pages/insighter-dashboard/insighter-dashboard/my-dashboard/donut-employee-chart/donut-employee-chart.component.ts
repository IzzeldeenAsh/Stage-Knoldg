import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { CompanyAccountService } from 'src/app/_fake/services/company-account/company-account.service';
import { ApexChart, ApexNonAxisChartSeries, ApexResponsive } from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  colors: string[];
  legend: any;
  plotOptions: any;
  dataLabels: any;
};

@Component({
  selector: 'app-donut-employee-chart',
  templateUrl: './donut-employee-chart.component.html',
  styleUrl: './donut-employee-chart.component.scss'
})
export class DonutEmployeeChartComponent implements OnInit {
  loading = false;
  error = false;
  employees: any[] = [];
  @Output() hasMultipleEmployeesDonut = new EventEmitter<boolean>();
  @ViewChild("chart") chart: any;
  public chartOptions: Partial<ChartOptions>;

  constructor(private companyAccountService: CompanyAccountService) {
    this.initializeChartOptions();
  }

  private initializeChartOptions(): void {
    this.chartOptions = {
      series: [],
      chart: {
        type: "donut",
        height: 350,
        events: {
          mounted: (chart) => {
            chart.toggleDataPointSelection(0);
          }
        }
      },
      labels: [],
      colors: ["#0095E8", "#1E90FF", "#0070C0", "#4682B4", "#104E8B"],
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: "bottom"
            }
          }
        }
      ],
      legend: {
        position: 'bottom',
        horizontalAlign: 'center'
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              name: {
                show: true
              },
              value: {
                show: true,
                formatter: function(val: any) {
                  return val;
                }
              },
              total: {
                show: true,
                label: 'Total',
                formatter: function(w: any) {
                  return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                }
              }
            }
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: any, opts: any) {
          const value = opts.w.globals.seriesTotals[opts.seriesIndex];
          return value;
        }
      }
    };
  }

  ngOnInit(): void {
    this.loadStatistics();
  }

  private extractKnowledgeStatistics(employees: any[]): { byType: { [key: string]: number }, total: number } {
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
        
        // Only emit true if there are multiple employees (more than just the manager)
        const hasEnoughData = this.employees.length > 1;
        this.hasMultipleEmployeesDonut.emit(hasEnoughData);
        
        // Only initialize chart if we have enough data to display
        if (hasEnoughData) {
          const stats = this.extractKnowledgeStatistics(this.employees);
          
          // Update chart data
          const series = [
            stats.byType.report || 0,
            stats.byType.data || 0,
            stats.byType.insight || 0,
            stats.byType.manual || 0,
            stats.byType.course || 0
          ];
          
          this.chartOptions = {
            ...this.chartOptions,
            series,
            labels: ['Reports', 'Data', 'Insights', 'Manual', 'Courses']
          };
        }
      },
      error: (error) => {
        console.error('Error loading employee knowledge statistics', error);
        this.error = true;
        this.loading = false;
      }
    });
  }
}
