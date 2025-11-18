import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  username: string = '';
  password: string = '';
  returnUrl: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Clear any existing auth data on login page load
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    
    // Get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/client-details';
  }

  login() {
    if (!this.username || !this.password) {
      Swal.fire('Error', 'Please enter both username and password', 'error');
      return;
    }

    // Log the request payload for debugging
    console.log('Login attempt with:', { username: this.username, password: this.password ? '[MASKED]' : 'empty' });

    this.http.post(`${environment.apiUrl}/api/users/login`, {
      username: this.username,
      password: this.password
    }).subscribe({
      next: (response: any) => {
        console.log('Login successful:', { 
          token: response.token ? 'present' : 'missing', 
          user: response.user ? 'present' : 'missing',
          role: response.user?.role
        });
        
        // Store auth data
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('role', response.user.role); // Store role separately
        localStorage.setItem('userId', response.user.id);
        localStorage.setItem('userName', response.user.username);

        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Login Successful',
          showConfirmButton: false,
          timer: 1500
        }).then(() => {
          // Navigate to return url or default route
          this.router.navigate([this.returnUrl]);
        });
      },
      error: (error) => {
        console.error('Login error:', error);
        const errorMessage = error.error?.message || error.message || 'Login failed';
        Swal.fire('Error', errorMessage, 'error');
      }
    });
  }
}
