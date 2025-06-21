import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AddActivityModalModule } from '../add-activity-modal/add-activity-modal.module';
import { AddActivityModalComponent } from '../add-activity-modal/add-activity-modal.component';
import { ActivityDetailsComponent } from '../activity-details/activity-details.component';
import { DetailsService } from '../../services/details.service';
import { Activity } from '../../models/activity.model';
import { MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SidebarModule } from 'primeng/sidebar';
import { RatingModule } from 'primeng/rating';
import { DialogModule } from 'primeng/dialog';
import { forkJoin } from 'rxjs';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-activities',
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    SidebarModule,
    RatingModule,
    DialogModule,
    ActivityDetailsComponent,
    AddActivityModalModule
  ],
  providers: [MessageService]
})
export class ActivitiesComponent implements OnInit, OnDestroy {
  @ViewChild('addActivityModal') addActivityModal!: AddActivityModalComponent;
  @ViewChild('dt1') dt1!: Table;

  activities: Activity[] = [];
  selectedActivities: Activity[] = [];
  selectedActivity: Activity | null = null;
  showSidebar: boolean = false;
  loading: boolean = true;
  totalRecords: number = 0;
  currentPage: number = 0;
  pageSize: number = 10;
  searchQuery: string = '';
  defaultActivityImage = 'assets/images/defaultactivity.png';

  private subscriptions: Subscription[] = [];

  constructor(
    private detailsService: DetailsService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadActivities();
    this.subscriptions.push(
      this.detailsService.activity$.subscribe(activity => {
        this.selectedActivity = activity;
      }),
      this.detailsService.isOpen$.subscribe(isOpen => {
        this.showSidebar = isOpen;
      })
    );
  }
  handleImageError(event: ErrorEvent) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.defaultActivityImage;
    imgElement.onerror = null; // Prevent infinite loop if default image fails
  }
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadActivities() {
    this.loading = true;
    this.detailsService.getAllActivities().subscribe({
      next: (activities: Activity[]) => {
        this.activities = activities;
        this.totalRecords = activities.length;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading activities:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load activities'
        });
        this.loading = false;
      }
    });
  }

  editActivity(activity: Activity) {
    this.detailsService.getActivityById(activity.activityId.toString()).subscribe({
      next: (completeActivity) => {
        this.detailsService.openActivityDetails(completeActivity);
      },
      error: (error) => {
        console.error('Error fetching complete activity data:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load activity details'
        });
      }
    });
  }

  closeSidebar() {
    this.detailsService.closeDetails();
  }

  onSidebarChange(isOpen: boolean) {
    if (!isOpen) {
      this.detailsService.closeDetails();
    }
  }

  onActivityUpdated() {
    this.loadActivities();
  }

  deleteActivity(activity: Activity) {
    if (confirm('Are you sure you want to delete this activity?')) {
      this.detailsService.deleteActivity(activity.activityId).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Activity deleted successfully'
          });
          this.loadActivities();
        },
        error: (error: any) => {
          console.error('Error deleting activity:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete activity'
          });
        }
      });
    }
  }

  deleteSelectedActivities() {
    if (confirm('Are you sure you want to delete the selected activities?')) {
      const deleteObservables = this.selectedActivities.map(activity =>
        this.detailsService.deleteActivity(activity.activityId)
      );

      forkJoin(deleteObservables).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Selected activities deleted successfully'
          });
          this.selectedActivities = [];
          this.loadActivities();
        },
        error: (error: any) => {
          console.error('Error deleting selected activities:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete selected activities'
          });
        }
      });
    }
  }

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  openAddActivityModal() {
    if (this.addActivityModal) {
      this.addActivityModal.show();
    }
  }

  getStars(rating: number): string[] {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(i < rating ? '★' : '☆');
    }
    return stars;
  }
  
  refreshActivities() {
    this.loadActivities();
  }
} 