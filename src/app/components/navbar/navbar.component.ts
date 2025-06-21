import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  pageTitle: string = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.setComponentName();
    
    // Subscribe to route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.setComponentName();
    });
  }

  private setComponentName(): void {
    // Get the current URL path
    const url = this.router.url;
    
    // Map routes to proper titles
    const routeTitleMap: { [key: string]: string } = {
      '/activities': 'Activities',
      '/activity-details': 'Activity Details',
      '/add-activity': 'Add Activity',
      '/places': 'Places',
      '/place-details': 'Place Details',
      '/add-place': 'Add Place',
      '/customers': 'Customers',
      '/customer-details': 'Customer Details',
      '/travel-agencies': 'Travel Agencies',
      '/agency-details': 'Agency Details',
      '/agency-register': 'Agency Register',
      '/reviews': 'Reviews',
      '/dashboard': 'Dashboard',
      '/': 'Dashboard'
    };
    
    // Check for exact match or partial match
    let title = routeTitleMap[url];
    
    if (!title) {
      // Try to find a partial match
      for (const route in routeTitleMap) {
        if (url.startsWith(route) && route !== '/') {
          title = routeTitleMap[route];
          break;
        }
      }
    }
    
    // Fallback to extracting from URL
    if (!title) {
      const pathSegments = url.split('/').filter(segment => segment);
      if (pathSegments.length > 0) {
        const lastSegment = pathSegments[pathSegments.length - 1];
        title = this.formatTitle(lastSegment);
      } else {
        title = 'Dashboard';
      }
    }
    
    this.pageTitle = title;
  }

  private formatTitle(name: string): string {
    // Convert PascalCase to Space Separated with proper handling
    if (!name) return 'Dashboard';
    
    return name
      // Insert space before capital letters (but not at the beginning)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Handle consecutive capital letters
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      // Trim any extra whitespace
      .trim()
      // Capitalize first letter and ensure proper case
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}