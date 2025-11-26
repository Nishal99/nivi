import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import { DashboardService } from '../../services/dashboard.service';

// Register Chart.js components
Chart.register(...registerables);

// Interfaces for type safety
interface ExpiringVisaData {
  date: string;
  count: number;
}

interface DashboardData {
  totalClients: number;
  totalAgents: number;
  expiringVisas: number;
  expiringVisasData: ExpiringVisaData[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  totalClients: number = 0;
  totalAgents: number = 0;
  expiringVisas: number = 0;
  expiringVisasData: ExpiringVisaData[] = [];
  chart: Chart | null = null;
  isLoading: boolean = true;
  error: string | null = null;

  private canvasId = 'visaExpiryChart';

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  ngAfterViewInit() {
    // Chart will be created after data loads, but ensure canvas exists
    this.createChartIfReady();
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  loadDashboardData(retry?: boolean) {
    if (retry) {
      this.error = null; // Clear previous error
    }
    this.isLoading = true;

    this.dashboardService.getDashboardStats().subscribe({
      next: (data: DashboardData) => {
        this.totalClients = data.totalClients;
        this.totalAgents = data.totalAgents;
        this.expiringVisas = data.expiringVisas;
        this.expiringVisasData = data.expiringVisasData || [];
        this.createChart(this.expiringVisasData);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.error = 'Failed to load dashboard data. Please try again.';
        this.isLoading = false;
      }
    });
  }

  private createChartIfReady() {
    if (this.expiringVisasData.length > 0 && !this.chart) {
      this.createChart(this.expiringVisasData);
    }
  }

  createChart(expiringVisasData: ExpiringVisaData[]) {
    if (this.chart) {
      this.chart.destroy();
    }

    if (expiringVisasData.length === 0) {
      // Handle empty data gracefully
      console.warn('No data available for chart');
      return;
    }

    const ctx = document.getElementById(this.canvasId) as HTMLCanvasElement;
    if (!ctx) {
      console.error('Canvas element not found');
      return;
    }

    const config: ChartConfiguration<'bar'> = {
      type: 'bar' as const,
      data: {
        labels: expiringVisasData.map((d) => d.date),
        datasets: [{
          label: 'Visas Expiring',
          data: expiringVisasData.map((d) => d.count),
          backgroundColor: (context) => {
            // Gradient for beauty
            const chart = context.chart;
            const { ctx: chartCtx, chartArea } = chart;
            if (!chartArea) return 'rgba(54, 162, 235, 0.5)';
            const gradient = chartCtx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            gradient.addColorStop(0, 'rgba(54, 162, 235, 0.8)');
            gradient.addColorStop(1, 'rgba(99, 102, 241, 0.4)');
            return gradient;
          },
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          borderRadius: 4, // Rounded bars for modern look
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // Allows full height usage from HTML
        animation: {
          duration: 1500,
          easing: 'easeOutQuart' // Smooth animation
        },
        scales: {
          x: {
            grid: {
              display: false // Cleaner look
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              callback: (value) => value.toString() // Ensure integer display
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)' // Subtle grid lines
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Visas Expiring in Next 30 Days',
            font: {
              size: 16,
              weight: 'bold'
            },
            color: '#1F2937' // Gray-800
          },
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true, // Circle markers for legend
              padding: 20
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            cornerRadius: 8,
            displayColors: true
          }
        },
        interaction: {
          intersect: false,
          mode: 'index' // Better mobile interaction
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  // Public method for retry (call from template button)
  onRetry() {
    this.loadDashboardData(true);
  }
}