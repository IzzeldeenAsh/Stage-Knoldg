import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy, Output, EventEmitter } from '@angular/core';
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
export class KnowledgeTypesStatisticsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("chart") chart: ChartComponent;
  @Output() hasStatistics = new EventEmitter<boolean>();
  public pieChartOptions: Partial<PieChartOptions> = {
    series: [],
    chart: {
      type: "donut",
      height: 300,
      fontFamily: "Poppins, sans-serif",
      toolbar: {
        show: false
      },
      redrawOnParentResize: true,
      redrawOnWindowResize: true
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
  private resizeListener: any;
  private chartInitialized = false;

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
    
    // Add window resize listener to redraw chart
    this.resizeListener = () => {
      if (this.chartInitialized && this.statistics.length > 0) {
        setTimeout(() => this.initChart(), 100);
      }
    };
    window.addEventListener('resize', this.resizeListener);
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
        if(!this.statistics.length){
          this.hasStatistics.emit(false);
        }else{
          this.hasStatistics.emit(true);
        }
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
    
    // Ensure the chart container is ready before initialization
    if (!document.getElementById('pieChart')) {
      setTimeout(() => this.initChart(), 50);
      return;
    }

    const typeColors = {
      report: "#0095E8", // Light blue
      statistic: "#0070C0", // Medium blue
      manual: "#104E8B", // Dark blue
      data: "#1E90FF", // Dodger blue
      insight: "#0056B3", // Royal blue
      course: "#4682B4", // Steel blue
      media: "#000080", // Navy blue
      other: "#0047AB"  // Cobalt blue
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
    
    this.chartInitialized = true;
    
    // Force chart redraw if it's already initialized
    if (this.chart) {
      setTimeout(() => {
        this.chart.render();
      }, 0);
    }
  }

  refresh() {
    this.loadStatistics();
  }
  
  ngAfterViewInit() {
    // Initialize chart after view is fully initialized
    if (this.statistics.length > 0 && !this.chartInitialized) {
      setTimeout(() => this.initChart(), 100);
    }
  }
  
  ngOnDestroy() {
    // Clean up event listener
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }
}
