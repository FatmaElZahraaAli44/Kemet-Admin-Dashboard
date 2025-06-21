import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface MenuItem {
  title: string;
  icon?: string;
  isActive?: boolean;
  route?: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  menuItems: MenuItem[] = [
    { title: 'Places', icon: 'place', route: 'places' },
    { title: 'Activities', icon: 'directions_run', route: 'activities' },
    { title: 'Customers', icon: 'people', route: 'customers' },
    { title: 'Travel Agencies', icon: 'business', route: 'travel-agencies' },
    { title: 'Reviews', icon: 'star_rate', route: 'reviews' }
  ];
  logoSrc: string = 'assets/images/K.png';
  isSidebarOpen: boolean = false; 
  
  constructor(private router: Router) {}

  ngOnInit(): void {
    // Set initial active state based on current route
    this.setActiveMenuItem();

    // Subscribe to route changes to update active state
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.setActiveMenuItem();
    });
  }

  private setActiveMenuItem(): void {
    const currentRoute = this.router.url.split('/')[1];
    this.menuItems.forEach(item => {
      item.isActive = item.route === currentRoute;
    });
  }

  navigateTo(menuItem: MenuItem): void {
    if (menuItem.route) {
      // Update active state
      this.menuItems.forEach(item => item.isActive = false);
      menuItem.isActive = true;
      
      // Navigate to the route
      this.router.navigate([menuItem.route]);
    }
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}