import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  // Ensure this matches the backend port where the server runs (default 3000)
  private apiUrl = 'https://api.niviportals.cloud/api/reports/generate';
  private apiExcelUrl = 'https://api.niviportals.cloud/api/reports/excel';
  private agentSearchUrl = 'https://api.niviportals.cloud/api/agents/search';
  
  private getHeaders(isExcel: boolean = false) {
    const token = localStorage.getItem('token');
    const headers: any = {
      'Content-Type': isExcel ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  constructor(private http: HttpClient) {}

  generateReport(filters: any): Observable<any> {
    return this.http.post(this.apiUrl, filters, { headers: this.getHeaders() });
  }

  downloadExcel(filters: any): Observable<Blob> {
    return this.http.post(this.apiExcelUrl, filters, {
      headers: this.getHeaders(false), // Use JSON headers for request
      responseType: 'blob' // Expect blob response
    });
  }

  searchAgents(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.agentSearchUrl}?query=${query}`, { headers: this.getHeaders() }).pipe(
      map(response => response || [])
    );
  }
}