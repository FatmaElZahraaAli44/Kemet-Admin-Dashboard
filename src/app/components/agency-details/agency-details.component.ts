import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService } from 'primeng/api';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { Agency } from '../../models/agency.model';
import { DetailsService } from '../../services/details.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-agency-details',
  templateUrl: './agency-details.component.html',
  styleUrls: ['./agency-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ToastModule,
    ConfirmDialogModule,
    SidebarModule,
    ButtonModule
  ],
  providers: [ConfirmationService, MessageService]
})
export class AgencyDetailsComponent implements OnInit, OnDestroy {
  defaultAgencyImage = this.getAbsolutePath('assets/images/default-agency.png');
  @Input() agency: Agency | null = null;
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() edit = new EventEmitter<Agency>();
  @Output() delete = new EventEmitter<Agency>();
  
  private agencySubscription: Subscription | null = null;
  private visibilitySubscription: Subscription | null = null;

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private detailsService: DetailsService
  ) {}
  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith(this.defaultAgencyImage)) {
      img.src = this.defaultAgencyImage;
    }
    img.onerror = null; 
  }

  private getAbsolutePath(relativePath: string): string {
    return relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  }
  ngOnInit(): void {
    this.agencySubscription = this.detailsService.agencyDetails$.subscribe(agency => {
      if (agency) {
        this.agency = agency;
      }
    });
    
    this.visibilitySubscription = this.detailsService.isOpen$.subscribe(isOpen => {
      this.visible = isOpen;
    });
  }
  
  ngOnDestroy(): void {
    if (this.agencySubscription) {
      this.agencySubscription.unsubscribe();
    }
    if (this.visibilitySubscription) {
      this.visibilitySubscription.unsubscribe();
    }
  }

  onEdit(): void {
    if (this.agency) {
      this.edit.emit(this.agency);
    }
  }

  onContact(): void {
    if (this.agency && this.agency.email) {
      const subject = `Inquiry about ${this.agency.agencyName}`;
      
      const mailtoLink = `mailto:${this.agency.email}?subject=${encodeURIComponent(subject)}`;
      window.open(mailtoLink, '_blank');
      
      this.messageService.add({
        severity: 'info',
        summary: 'Contact',
        detail: `Opening email client for: ${this.agency.agencyName}`
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Email address not available'
      });
    }
  }

  onDelete(): void {
    if (this.agency) {
      this.confirmationService.confirm({
        message: `Are you sure you want to delete ${this.agency.agencyName}?`,
        accept: () => {
          if (this.agency) {
            this.delete.emit(this.agency);
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Agency deleted successfully'
            });
          }
        }
      });
    }
  }
} 