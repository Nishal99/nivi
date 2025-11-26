import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = localStorage.getItem('token');
    
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // If backend provided a code for token expiration, show a helpful message
          const code = error.error?.code;
          if (code === 'TOKEN_EXPIRED') {
            // Inform user and redirect to login
            Swal.fire({
              icon: 'info',
              title: 'Session expired',
              text: 'Your session has expired. Please log in again.',
              confirmButtonText: 'OK'
            }).then(() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              this.router.navigate(['/login']);
            });
          } else {
            // Generic unauthorized handling
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            this.router.navigate(['/login']);
          }
        }
        return throwError(() => error);
      })
    );
  }
}