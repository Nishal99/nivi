import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  constructor(private http: HttpClient) { }

  private baseURL = `${environment.apiUrl}/api/clients`;
  
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders()
      .set('Authorization', `Bearer ${token}`);
  }

  addClient(formData: FormData): Observable<any> {
    // For multipart/form-data, we should not set Content-Type header
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.post(`${this.baseURL}/addClient`, formData, {
      headers
    });
  }

  getClients(sortBy?: string, filterExpiry: boolean = false): Observable<any[]> {
    const headers = this.getHeaders();
    let params = new HttpParams();
    
    // Only add parameters if they have values
    if (sortBy) {
      params = params.set('sortBy', sortBy);
    }
    if (filterExpiry) {
      params = params.set('filterExpiry', 'true');
    }
    
    console.log('Getting clients with params:', {
      sortBy,
      filterExpiry,
      params: params.toString(),
      token: headers.get('Authorization'),
      role: localStorage.getItem('role')
    });
    
    return this.http.get<any[]>(`${this.baseURL}/get-clients`, {
      headers,
      params
    });
  }

  // Fetch archived clients (history)
  getClientHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseURL}/get-history`, {
      headers: this.getHeaders()
    });
  }

  deleteClient(clientId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseURL}/delete-client/${clientId}`, {
      headers: this.getHeaders()
    });
  }

  //filter by agents
  getClientsByAgent(agentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseURL}/get-clients-by-agent/${agentId}`, {
      headers: this.getHeaders()
    });
  }

  // Trigger archiving of expired clients (admin and user action)
  archiveExpired(): Observable<any> {
    return this.http.post<any>(`${this.baseURL}/archive-expired`, {}, {
      headers: this.getHeaders()
    });
  }

  // Update history client status
  updateHistoryStatus(historyId: number, status: string): Observable<any> {
    return this.http.patch<any>(`${this.baseURL}/update-history-status/${historyId}`, 
      { status }, 
      { headers: this.getHeaders() }
    );
  }

  // Delete a history record (archived client)
  deleteClientHistory(historyId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseURL}/delete-history/${historyId}`, {
      headers: this.getHeaders()
    });
  }

}
