import { Component, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, Event, NavigationEnd } from '@angular/router';
import { NavBarComponent } from "./shared/nav-bar/nav-bar.component";
import { NgIf } from '@angular/common';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterOutlet, NavBarComponent, NgIf],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy {
  title = 'Visa_Management';
  showNavBar = true;
  private routerSubscription: Subscription;

  constructor(private router: Router) {
    this.routerSubscription = this.router.events.pipe(
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.showNavBar = event.urlAfterRedirects !== '/' && !event.urlAfterRedirects.includes('/home') && !event.urlAfterRedirects.includes('/login') && !event.urlAfterRedirects.includes('/reset-password');
    });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
