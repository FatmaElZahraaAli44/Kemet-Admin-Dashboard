import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  isSidebarOpen = true;

  constructor() {}
  
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
