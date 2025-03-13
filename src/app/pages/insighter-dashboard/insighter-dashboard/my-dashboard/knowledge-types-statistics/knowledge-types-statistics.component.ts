import { Component, OnInit, ViewChild } from '@angular/core';
import { KnowledgeService, KnowledgeTypeStatistic } from 'src/app/_fake/services/knowledge/knowledge.service';
import { TranslationService } from 'src/app/modules/i18n';
import {
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexPlotOptions,
  ApexLegend,
  ApexTooltip,
  ApexNonAxisChartSeries
} from "ng-apexcharts";

export type PieChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  fill: any;
  stroke: any;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  colors: string[];
  labels: string[];
};

@Component({
  selector: 'app-knowledge-types-statistics',
  templateUrl: './knowledge-types-statistics.component.html',
  styleUrl: './knowledge-types-statistics.component.scss'
})
export class KnowledgeTypesStatisticsComponent implements OnInit {
  @ViewChild("chart") chart: ChartComponent;
  
  public pieChartOptions: Partial<PieChartOptions> = {
    series: [],
    chart: {
      type: "donut",
      height: 300,
      fontFamily: "Poppins, sans-serif",
      toolbar: {
        show: false
      }
    },
    labels: [],
    colors: [],
    dataLabels: {
      enabled: true,
      formatter: function(val: number) {
        return val.toFixed(1) + "%";
      },
      style: {
        fontSize: '12px',
        fontFamily: 'Poppins, sans-serif',
        fontWeight: 'bold'
      }
    },
    stroke: {
      width: 0
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontFamily: 'Poppins, sans-serif',
              offsetY: -10
            },
            value: {
              show: true,
              fontSize: '18px',
              fontFamily: 'Poppins, sans-serif',
              formatter: function(val) {
                return val;
              }
            },
            total: {
              show: true,
              label: 'Total',
              fontSize: '14px',
              fontFamily: 'Poppins, sans-serif',
              formatter: function(w) {
                return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
              }
            }
          }
        }
      }
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: function(val) {
          return val + " items";
        }
      }
    },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      fontSize: "12px",
      itemMargin: {
        horizontal: 10,
        vertical: 5
      }
    }
  };
  
  statistics: KnowledgeTypeStatistic[] = [];
  loading = false;
  error = false;

  constructor(
    private knowledgeService: KnowledgeService,
    private translationService: TranslationService
  ) {}

  ngOnInit() {
    this.loadStatistics();
    this.updateChartTranslations();
    
    // Listen for language changes to update the chart
    this.translationService.onLanguageChange().subscribe(() => {
      this.updateChartTranslations();
      if (this.statistics.length > 0) {
        this.initChart();
      }
    });
  }

  updateChartTranslations() {
    // Update any translations in chart options
    this.pieChartOptions = {
      ...this.pieChartOptions,
      plotOptions: {
        ...this.pieChartOptions.plotOptions,
        pie: {
          ...this.pieChartOptions.plotOptions?.pie,
          donut: {
            ...this.pieChartOptions.plotOptions?.pie?.donut,
            labels: {
              ...this.pieChartOptions.plotOptions?.pie?.donut?.labels,
              total: {
                ...this.pieChartOptions.plotOptions?.pie?.donut?.labels?.total,
                label: this.translationService.getTranslation('KNOWLEDGE_TYPES.TOTAL')
              }
            }
          }
        }
      },
      tooltip: {
        ...this.pieChartOptions.tooltip,
        y: {
          ...this.pieChartOptions.tooltip?.y,
          formatter: (val) => {
            return val + " " + this.translationService.getTranslation('KNOWLEDGE_TYPES.ITEMS');
          }
        }
      }
    };
  }

  loadStatistics() {
    this.loading = true;
    this.error = false;
    
    this.knowledgeService.getKnowledgeTypeStatistics().subscribe(
      (response) => {
        this.statistics = response.data;
        this.initChart();
        this.loading = false;
      },
      (error) => {
        console.error('Error loading knowledge type statistics', error);
        this.error = true;
        this.loading = false;
      }
    );
  }

  getTotalCount(): number {
    if (!this.statistics || this.statistics.length === 0) {
      return 0;
    }
    return this.statistics.reduce((total, stat) => total + stat.count, 0);
  }

  initChart() {
    if (!this.statistics || this.statistics.length === 0) return;

    const typeColors = {
      report: "#009EF7", // Primary blue
      insight: "#50CD89", // Success green
      manual: "#F1416C", // Danger red
      data: "#7239EA", // Purple
      course: "#FFC700", // Warning yellow
      media: "#181C32"  // Dark
    };

    const seriesData = this.statistics.map(stat => stat.count);
    const labels = this.statistics.map(stat => {
      // Translate the knowledge type labels
      const translationKey = 'KNOWLEDGE_TYPES.' + stat.type.toUpperCase();
      return this.translationService.getTranslation(translationKey);
    });
    const colors = this.statistics.map(stat => typeColors[stat.type] || "#A1A5B7");

    // Pie Chart
    this.pieChartOptions = {
      ...this.pieChartOptions,
      series: seriesData,
      labels: labels,
      colors: colors
    };
  }

  refresh() {
    this.loadStatistics();
  }
}
