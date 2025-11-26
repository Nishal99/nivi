import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Check if user is logged in by looking for the token
    const token = localStorage.getItem('token');
    console.log(token);
    
    
    if (token) {
      return true;
    }

    // If not logged in, redirect to login page
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url }});
    return false;
  }
}