import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUserProfile(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/auth/profile/${userId}`, {
      headers: this.getHeaders()
    });
  }

  updateProfile(userData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/auth/profile`, userData, {
      headers: this.getHeaders()
    });
  }

  changePassword(passwordData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/auth/reset-password`, passwordData, {
      headers: this.getHeaders()
    });
  }

  createUser(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/register`, userData, {
      headers: this.getHeaders()
    });
  }

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/auth/users`, {
      headers: this.getHeaders()
    });
  }

  updateUserStatus(userId: string, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/api/auth/users/${userId}/status`, { status }, {
      headers: this.getHeaders()
    });
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/users/login`, credentials)
      .pipe(
        tap((response: any) => {
          if (response.token) {
            const role = (response.user?.role || '').toLowerCase();
            console.log('Auth Service: Setting user data', {
              token: 'present',
              role: role,
              userId: response.user?.id,
              userName: response.user?.username
            });

            localStorage.setItem('token', response.token);
            localStorage.setItem('role', role);
            localStorage.setItem('userId', response.user?.id || '');
            localStorage.setItem('userName', response.user?.username || '');
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/reset-password`, { token, password });
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }
}