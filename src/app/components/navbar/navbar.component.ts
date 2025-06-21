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
    // Get the current route snapshot
    const currentRoute = this.router.routerState.snapshot.root;
    
    // Find the activated component
    let component: any = currentRoute.component;
    let child = currentRoute.firstChild;
    
    while (child) {
      if (child.component) {
        component = child.component;
      }
      child = child.firstChild;
    }
    
    if (component) {
      // Extract the component name
      const componentName = component.name.replace('Component', '');
      this.pageTitle = this.formatTitle(componentName);
    } else {
      this.pageTitle = 'Dashboard'; // Default fallback
    }
  }

  private formatTitle(name: string): string {
    // Convert PascalCase to Space Separated
    return name
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/^./, str => str.toUpperCase());
  }
}