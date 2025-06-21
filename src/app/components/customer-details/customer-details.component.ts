import { Component, OnInit, OnDestroy } from '@angular/core';
import { Customer } from '../../models/customer.model';
import { DetailsService } from '../../services/details.service';
import { Subscription } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { SidebarModule } from 'primeng/sidebar';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';

@Component({
  selector: 'app-customer-details',
  templateUrl: './customer-details.component.html',
  styleUrls: ['./customer-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    ConfirmDialogModule,
    ToastModule,
    SidebarModule,
    DropdownModule,
    CalendarModule
  ]
})
export class CustomerDetailsComponent implements OnInit, OnDestroy {
  customer: Customer | null = null;
  isOpen = false;
  isEditing = false;
  editedCustomer: Customer | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private detailsService: DetailsService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.detailsService.customer$.subscribe(customer => {
        this.customer = customer;
        this.isOpen = !!customer;
        this.editedCustomer = customer ? { ...customer } : null;
      })
    );
  }
  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/default-profile.png';
    img.onerror = null; // Prevent infinite loop
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onCloseModal() {
    this.isOpen = false;
    this.isEditing = false;
    this.editedCustomer = null;
    this.detailsService.closeDetails();
  }

  editCustomer() {
    this.isEditing = true;
  }

  saveCustomer() {
    if (this.editedCustomer) {
      this.detailsService.saveCustomer(this.editedCustomer).subscribe({
        next: () => {
          this.customer = { ...this.editedCustomer! };
          this.isEditing = false;
        }
      });
    }
  }

  cancelEdit() {
    this.editedCustomer = this.customer ? { ...this.customer } : null;
    this.isEditing = false;
  }

  confirmDelete(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Are you sure you want to delete this customer?',
      accept: () => {
        this.detailsService.deleteCustomer().subscribe({
          next: () => {
            this.onCloseModal();
          }
        });
      }
    });
  }

  contactUser() {
    if (this.customer?.email) {
      window.location.href = `mailto:${this.customer.email}`;
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No email address available for this user'
      });
    }
  }
} 