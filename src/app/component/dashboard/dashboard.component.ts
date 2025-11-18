import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { DashboardService } from '../../services/dashboard.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  totalClients: number = 0;
  totalAgents: number = 0;
  expiringVisas: number = 0;
  chart: any;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.dashboardService.getDashboardStats().subscribe({
      next: (data) => {
        this.totalClients = data.totalClients;
        this.totalAgents = data.totalAgents;
        this.expiringVisas = data.expiringVisas;
        this.createChart(data.expiringVisasData);
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
      }
    });
  }

  createChart(expiringVisasData: any) {
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = document.getElementById('visaExpiryChart') as HTMLCanvasElement;
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: expiringVisasData.map((d: any) => d.date),
        datasets: [{
          label: 'Visas Expiring',
          data: expiringVisasData.map((d: any) => d.count),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Visas Expiring in Next 30 Days'
          }
        }
      }
    });
  }
}