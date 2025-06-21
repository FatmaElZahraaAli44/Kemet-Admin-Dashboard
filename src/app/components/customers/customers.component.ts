import { Component, OnInit, ViewChild } from '@angular/core';
import { Customer } from '../../models/customer.model';
import { DetailsService } from '../../services/details.service';
import { Table } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { CustomerDetailsComponent } from '../customer-details/customer-details.component';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { SortEvent } from 'primeng/api';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss'],
  standalone: true,
  imports: [
    TableModule, 
    CommonModule, 
    InputTextModule, 
    TagModule,
    ButtonModule,
    FormsModule,
    CustomerDetailsComponent,
    ConfirmDialogModule,
    ToastModule
  ],
  providers: [ConfirmationService, MessageService]
})
export class CustomersComponent implements OnInit {
  @ViewChild('dt1') dt1!: Table;
  
  customers: Customer[] = [];
  loading: boolean = false;
  totalCustomers = 0;
  selectedCustomer: Customer | null = null;
  showSidebar = false;
  searchValue: string | undefined;
  sortField: string = '';
  sortOrder: number = 1;

  constructor(
    private detailsService: DetailsService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.checkAuthAndLoadCustomers();
  }
  defaultProfileImage: string = 'assets/images/default-profile.png';

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/default-profile.png'; // Hardcoded fallback
    img.onerror = null; // Prevents infinite loop
}
  
  
checkAuthAndLoadCustomers() {
  this.loadCustomers();
}


  loadCustomers() {
    this.loading = true;
    this.detailsService.getAllCustomers().subscribe({
      next: (data) => {
        this.customers = data;
        this.totalCustomers = this.customers.length;
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to load customers: ${error.status} - ${error.message}`
        });
        this.loading = false;
      }
    });
  }

  clear(table: Table) {
    table.clear();
    this.searchValue = '';
  }

  viewUser(customer: Customer) {
    this.selectedCustomer = customer;
    this.showSidebar = true;
    this.detailsService.openCustomerDetails(customer);
  }

  deleteUser(customer: Customer) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this customer?',
      accept: () => {
        // Implement delete functionality
        const index = this.customers.findIndex(c => c.id === customer.id);
        if (index !== -1) {
          this.customers.splice(index, 1);
          this.totalCustomers = this.customers.length;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Customer deleted successfully'
          });
        }
      }
    });
  }

  onCloseSidebar() {
    this.showSidebar = false;
    this.selectedCustomer = null;
    this.detailsService.closeDetails();
  }

  onSort(event: { field: string; order: number }) {
    this.sortField = event.field;
    this.sortOrder = event.order;
    
    // Sort the customers array
    this.customers.sort((a, b) => {
      let valueA = (a as any)[event.field];
      let valueB = (b as any)[event.field];
      
      // Handle string comparison
      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }
      
      if (valueA < valueB) return event.order * -1;
      if (valueA > valueB) return event.order;
      return 0;
    });
  }
}

