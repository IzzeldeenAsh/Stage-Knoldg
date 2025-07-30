import { Component, OnInit, ViewChild, Output, EventEmitter } from '@angular/core';
import { CompanyAccountService } from 'src/app/_fake/services/company-account/company-account.service';
import { TranslationService } from 'src/app/modules/i18n';
import {
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexPlotOptions,
  ApexLegend,
  ApexTooltip,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexYAxis,
  ApexStroke,
  ApexFill,
  ApexGrid
} from "ng-apexcharts";

export type BarChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  fill: ApexFill;
  tooltip: ApexTooltip;
  grid: ApexGrid;
  colors: string[];
  legend: ApexLegend;
  states?: any;
};

interface EmployeeKnowledgeStatistic {
  id: number;
  name: string;
  profile_photo_url: string | null;
  statistics: {
    report: number;
    data: number;
    insight: number;
    manual: number;
    course: number;
  };
  totalKnowledge: number;
}

@Component({
  selector: 'app-employee-knowledge-statistics',
  templateUrl: './employee-knowledge-statistics.component.html',
  styleUrls: ['./employee-knowledge-statistics.component.scss']
})
export class EmployeeKnowledgeStatisticsComponent implements OnInit {
  @ViewChild("chart") chart: ChartComponent;
  @Output() hasMultipleEmployees = new EventEmitter<boolean>();
  
  public barChartOptions: Partial<BarChartOptions> = {
    series: [],
    chart: {
      type: "bar",
      height: 300,
      fontFamily: "Poppins, sans-serif",
      stacked: true,
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
      sparkline: {
        enabled: false
      }
    },
    colors: ["#0095E8", "#1E90FF", "#0070C0", "#4682B4", "#104E8B", "#000080", "#0047AB"],
    plotOptions: {
      bar: {
        horizontal: true,
        columnWidth: "50%",
        barHeight: "40%",
        borderRadius: 6,
        distributed: false,
        dataLabels: {
          position: 'top'
        }
      },
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: 2,
      colors: ["transparent"],
      curve: 'smooth'
    },
    xaxis: {
      categories: [],
      labels: {
        style: {
          fontSize: '12px',
          fontWeight: 500,
          colors: "#555555"
        }
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
        text: ""
      },
      labels: {
        style: {
          fontSize: '12px',
          fontWeight: 500,
          colors: "#555555"
        }
      }
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return val + " items";
        }
      },
      shared: true,
      intersect: false,
      style: {
        fontSize: '12px',
        fontFamily: 'Poppins, sans-serif'
      },
      theme: 'light',
      marker: {
        show: true
      },
      fixed: {
        enabled: true,
        position: 'topRight',
        offsetX: 0,
        offsetY: 0
      }
    },
    fill: {
      opacity: 0.9,
      type: 'solid'
    },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      fontSize: '11px',
      fontWeight: 500,
      markers: {
      },
      itemMargin: {
        horizontal: 8,
        vertical: 5
      }
    },
    grid: {
      show: true,
      borderColor: '#f1f1f1',
      strokeDashArray: 3,
      position: 'back',
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: false
        }
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 10
      }
    },
    states: {
      normal: {
        filter: {
          type: 'none'
        }
      },
      hover: {
        filter: {
          type: 'lighten',
          value: 0.05
        }
      },
      active: {
        allowMultipleDataPointsSelection: false,
        filter: {
          type: 'darken',
          value: 0.1
        }
      }
    }
  };
  
  employees: EmployeeKnowledgeStatistic[] = [];
  loading = false;
  error = false;

  constructor(
    private companyAccountService: CompanyAccountService,
    private translationService: TranslationService
  ) {}

  ngOnInit() {
    this.loadStatistics();
    this.updateChartTranslations();
    
    // Listen for language changes to update the chart
    this.translationService.onLanguageChange().subscribe(() => {
      this.updateChartTranslations();
      if (this.employees.length > 0) {
        this.initChart();
      }
    });
  }

  updateChartTranslations() {
    // Update any translations in chart options
    this.barChartOptions = {
      ...this.barChartOptions,
      yaxis: {
        ...this.barChartOptions.yaxis,
        title: {
          text: this.translationService.getTranslation('EMPLOYEE_KNOWLEDGE.EMPLOYEES')
        }
      },
      tooltip: {
        ...this.barChartOptions.tooltip,
        y: {
          ...this.barChartOptions.tooltip?.y,
          formatter: (val) => {
            return val + " " + this.translationService.getTranslation('EMPLOYEE_KNOWLEDGE.ITEMS');
          }
        }
      }
    };
  }

  loadStatistics() {
    this.loading = true;
    this.error = false;
    
    this.companyAccountService.getEmployeeKnowledgeStatistics().subscribe(
      (response) => {
        this.employees = response.data;
        this.loading = false;
        this.error = false;
        
        
        // Only emit true if there are multiple employees (more than just the manager)
        // This ensures we don't show the component when there's only data for the manager
        const hasEnoughData = this.employees.length > 1;
        this.hasMultipleEmployees.emit(hasEnoughData);
        
        // Only initialize chart if we have enough data to display
        if (hasEnoughData) {
          this.initChart();
        }
      },
      (error) => {
        console.error('Error loading employee knowledge statistics', error);
        this.error = true;
        this.loading = false;
      }
    );
  }

  getTotalCount(): number {
    if (!this.employees || this.employees.length === 0) {
      return 0;
    }
    return this.employees.reduce((total, emp) => total + emp.totalKnowledge, 0);
  }

  initChart() {
    if (!this.employees || this.employees.length === 0) return;

    // Prepare chart data
    const reportData = this.employees.map(emp => emp.statistics.report);
    const dataData = this.employees.map(emp => emp.statistics.data);
    const insightData = this.employees.map(emp => emp.statistics.insight);
    const manualData = this.employees.map(emp => emp.statistics.manual);
    const courseData = this.employees.map(emp => emp.statistics.course);
    
    // Prepare categories (employee names)
    const categories = this.employees.map(emp => emp.name);
    
    // Update chart options
    this.barChartOptions = {
      ...this.barChartOptions,
      series: [
        {
          name: this.translationService.getTranslation('KNOWLEDGE_TYPES.REPORT'),
          data: reportData
        },
        {
          name: this.translationService.getTranslation('KNOWLEDGE_TYPES.DATA'),
          data: dataData
        },
        {
          name: this.translationService.getTranslation('KNOWLEDGE_TYPES.INSIGHT'),
          data: insightData
        },
        {
          name: this.translationService.getTranslation('KNOWLEDGE_TYPES.MANUAL'),
          data: manualData
        },
        {
          name: this.translationService.getTranslation('KNOWLEDGE_TYPES.COURSE'),
          data: courseData
        }
      ],
      xaxis: {
        ...this.barChartOptions.xaxis,
        categories: categories
      }
    };
  }

  refresh() {
    this.loadStatistics();
  }
} 