import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AgentService {
  private apiUrl = `${environment.apiUrl}/api/agents`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  searchAgents(query: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/search`, { params: { query: query }, headers: this.getHeaders() });
  }

  getAllAgents(): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-all`, { headers: this.getHeaders() });
  }

  addAgent(agentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/addAgent`, agentData, { headers: this.getHeaders() });
  }

  editAgent(agentData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update/${agentData.id}`, agentData, { headers: this.getHeaders() });
  }

  deleteAgent(agentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${agentId}`, { headers: this.getHeaders() });
  }

  reassignAndDelete(oldAgentId: number, newAgentId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/reassign-delete`, { oldAgentId, newAgentId }, { headers: this.getHeaders() });
  }

}
