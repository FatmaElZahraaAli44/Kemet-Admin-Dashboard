import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ButtonModule } from 'primeng/button';
import { RatingModule } from 'primeng/rating';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ReviewsService, Review } from '../../services/reviews.service';

@Component({
  selector: 'app-reviews',
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    TableModule, 
    SelectButtonModule,
    ButtonModule,
    RatingModule,
    ConfirmDialogModule,
    DialogModule,
    ToastModule
  ],
  providers: [ConfirmationService, MessageService]
})
export class ReviewsComponent implements OnInit {
  reviews: Review[] = [];
  categories: any[] = [];
  selectedCategory: string = 'all';
  isLoading = false;
  error: string | null = null;
  filteredReviews: Review[] = [];
  
  // Modal properties
  displayReviewModal: boolean = false;
  selectedReview: Review | null = null;
  
  // Sorting properties
  sortField: string = 'createdAt';
  sortOrder: number = -1; // -1 for descending, 1 for ascending

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private reviewsService: ReviewsService
  ) {}

  ngOnInit() {
    this.loadReviews();
    this.initializeCategories();
  }

  private loadReviews() {
    this.isLoading = true;
    this.error = null;
    
    this.reviewsService.getAllReviews().subscribe({
      next: (reviews) => {
        this.reviews = reviews || [];
        this.filterReviews();
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load reviews. Please try again later.';
        this.isLoading = false;
        this.reviews = [];
        this.filteredReviews = [];
      }
    });
  }

  private initializeCategories() {
    this.categories = [
      { name: 'All', value: 'all' },
      { name: 'Places', value: 'Place' },
      { name: 'Activities', value: 'Activity' },
      { name: 'Travel Agencies', value: 'TravelAgency' },
      { name: 'Packages', value: 'TravelAgencyPlan' }
    ];
  }

  filterReviews() {
    if (!Array.isArray(this.reviews)) {
      this.filteredReviews = [];
      return;
    }

    if (this.selectedCategory === 'all') {
      this.filteredReviews = [...this.reviews];
    } else {
      this.filteredReviews = this.reviews.filter(review => {
        return review.reviewType === this.selectedCategory;
      });
    }
  }

  onCategoryChange() {
    this.filterReviews();
  }
  
  onSort(event: any) {
    this.sortField = event.field;
    this.sortOrder = event.order;
  }

  viewReview(review: Review) {
    this.selectedReview = review;
    this.displayReviewModal = true;
  }

  formatDate(isoDateString: string): string {
    if (!isoDateString) return '';
    
    const date = new Date(isoDateString);
    
    // Format options
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString('en-US', options);
  }
  deleteReview(review: Review) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete this review?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // Use the review.id for deletion
        this.reviewsService.deleteReview(review.id).subscribe({
          next: () => {
            // Filter using the same id that was used for deletion
            this.reviews = this.reviews.filter(r => r.id !== review.id);
            this.filterReviews();
            this.messageService.add({
              severity: 'success',
              summary: 'Review Deleted',
              detail: 'The review has been deleted successfully',
              life: 3000
            });
          },
          error: (error) => {
            console.error('Error deleting review:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete the review. Please try again.',
              life: 3000
            });
          }
        });
      }
    });
  }
}
