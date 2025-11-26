import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private apiUrl = `${environment.apiUrl}/api/suppliers`;

  constructor(private http: HttpClient) { }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  getAllSuppliers(): Observable<any> {
    return this.http.get(this.apiUrl, this.getHeaders());
  }

  getSupplierById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`, this.getHeaders());
  }

  createSupplier(supplier: any): Observable<any> {
    return this.http.post(this.apiUrl, supplier, this.getHeaders());
  }

  updateSupplier(id: number, supplier: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, supplier, this.getHeaders());
  }

  deleteSupplier(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, this.getHeaders());
  }

  reassignAndDelete(oldSupplierId: number, newSupplierId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/reassign-delete`, { oldSupplierId, newSupplierId }, this.getHeaders());
  }

  searchSuppliers(query: string): Observable<any> {
    const params = new HttpParams().set('query', query);
    return this.http.get(`${this.apiUrl}/search`, { ...this.getHeaders(), params });
  }
}