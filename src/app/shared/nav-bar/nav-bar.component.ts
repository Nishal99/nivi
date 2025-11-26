
import { Component, HostListener, OnInit } from '@angular/core';
import { RouterLinkActive, RouterLink } from "@angular/router";
import { NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [RouterLinkActive, RouterLink, NgIf],
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss'] // note: styleUrls (plural)
})
export class NavBarComponent implements OnInit {
  // Property: true if mobile viewport
  isMobile = window.innerWidth < 768;

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }

  ngOnInit() {
    this.isMobile = window.innerWidth < 768;
  }

  currentUser: {
    id?: string;
    name?: string;
    username?: string;
    email?: string;
    role?: string;
  } | null = null;

 constructor(private authService: AuthService, private router: Router) {
  this.loadCurrentUser();
 }
  // desktop collapsed state
  collapsed = false;
  // mobile open state
  mobileOpen = false;

  toggleCollapse() {
    this.collapsed = !this.collapsed;
    
    
    
  }

  toggleMobile() {
    this.mobileOpen = !this.mobileOpen;
  }

  closeMobile() {
    this.mobileOpen = false;
  }


  loadCurrentUser() {
    const userId = localStorage.getItem('userId');
    console.log('NavBar Component - Loading Current User:', { userId });
    if (userId) {
      this.authService.getUserProfile(userId).subscribe({
        next: (user) => {
          this.currentUser = {
            id: user.id,
            name: user.name || user.username,
            username: user.username,
            email: user.email,
            role: user.role
          };
        }
      });
    }
    console.log(this.currentUser);
    
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  private checkAdminStatus() {
    const storedRole = localStorage.getItem('role');
    console.log('Profile Component - Role Check:', {
      storedRole,
      localStorageItems: {
        role: localStorage.getItem('role'),
        userId: localStorage.getItem('userId'),
        userName: localStorage.getItem('userName'),
        token: localStorage.getItem('token') ? 'present' : 'missing'
      },
      currentUser: this.currentUser
    });
  }
}