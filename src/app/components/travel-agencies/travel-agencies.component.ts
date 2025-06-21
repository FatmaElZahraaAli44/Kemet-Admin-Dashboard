import { Component, OnInit, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { AgencyDetailsComponent } from '../agency-details/agency-details.component';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { Table } from 'primeng/table';
import { SortEvent } from 'primeng/api';
import { RatingModule } from 'primeng/rating';
import { DetailsService } from '../../services/details.service';
import { Agency } from '../../models/agency.model';
import { AgencyRegisterComponent } from '../agency-register/agency-register.component';
import { TravelAgenciesService } from '../../services/travel-agencies.service';

@Component({
  selector: 'app-travel-agencies',
  templateUrl: './travel-agencies.component.html',
  styleUrls: ['./travel-agencies.component.scss'],
  standalone: true,
  imports: [
    TableModule,
    CommonModule,
    InputTextModule,
    ButtonModule,
    FormsModule,
    AgencyDetailsComponent,
    ConfirmDialogModule,
    ToastModule,
    RatingModule,
    AgencyRegisterComponent
  ],
  providers: [ConfirmationService, MessageService]
})
export class TravelAgenciesComponent implements OnInit {
  @ViewChild('dt1') dt1!: Table;
  @ViewChild(AgencyRegisterComponent) agencyRegisterComponent!: AgencyRegisterComponent;
  
  agencies: Agency[] = [];
  loading: boolean = false;
  totalAgencies = 0;
  selectedAgency: Agency | null = null;
  showSidebar = false;
  searchValue: string | undefined;
  sortField: string = '';
  sortOrder: number = 1;
  defaultImage: string = 'assets/images/default-agency.png';

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private detailsService: DetailsService,
    private travelAgenciesService: TravelAgenciesService
  ) {}

  ngOnInit(): void {
    this.loadAgencies();
  }
  handleImageError(event: any) {
    event.target.src = this.defaultImage;
  }
  openRegisterForm() {
    if (this.agencyRegisterComponent) {
      this.agencyRegisterComponent.showDialog();
    }
  }

  loadAgencies() {
    this.loading = true;
    this.travelAgenciesService.getAllAgencies().subscribe({
      next: (response) => {
        this.agencies = response.$values.map(agency => 
          this.travelAgenciesService.mapApiResponseToAgency(agency)
        );
        this.totalAgencies = this.agencies.length;
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load agencies. Please try again later.'
        });
        this.loading = false;
      }
    });
  }

  clear(table: Table) {
    table.clear();
    this.searchValue = '';
  }

  onViewDetails(agency: Agency) {
    this.selectedAgency = agency;
    this.detailsService.openAgencyDetails(agency);
    this.showSidebar = true;
  }

  deleteAgency(agency: Agency) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this agency?',
      accept: () => {
        // Implement delete functionality
        const index = this.agencies.findIndex(a => a.id === agency.id);
        if (index !== -1) {
          this.agencies.splice(index, 1);
          this.totalAgencies = this.agencies.length;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Agency deleted successfully'
          });
        }
      }
    });
  }

  onCloseSidebar() {
    this.showSidebar = false;
    this.selectedAgency = null;
    this.detailsService.closeAgencyDetails();
  }

  onSort(event: SortEvent) {
    this.sortField = event.field || '';
    this.sortOrder = event.order || 1;
    
    // Sort the agencies array
    this.agencies.sort((a, b) => {
      const field = event.field || '';
      let valueA = (a as any)[field];
      let valueB = (b as any)[field];
      
      // Handle string comparison
      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }
      
      if (valueA < valueB) return (event.order || 1) * -1;
      if (valueA > valueB) return event.order || 1;
      return 0;
    });
  }
}
