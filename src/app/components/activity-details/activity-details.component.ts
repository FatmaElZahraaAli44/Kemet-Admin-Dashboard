import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Activity } from '../../models/activity.model';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { RatingModule } from 'primeng/rating';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DetailsService } from '../../services/details.service';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ImageProxyService } from '../../services/image-proxy.service';
import { ActivitiesService } from '../../services/activities.service';

@Component({
  selector: 'app-activity-details',
  templateUrl: './activity-details.component.html',
  styleUrls: ['./activity-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarModule,
    ButtonModule,
    RatingModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService]
})
export class ActivityDetailsComponent implements OnInit, OnDestroy {
  private _activity: Activity | null = null;
  @Input() isOpen: boolean = false;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() closeModal = new EventEmitter<void>();
  @Output() activityUpdated = new EventEmitter<void>();

  isEditing = false;
  editedActivity: Activity | null = null;
  private subscriptions: Subscription[] = [];
  isLoading = false;
  uploadProgress = 0;
  selectedFiles: File[] = [];
  previewImages: string[] = [];
  removedImages: string[] = [];
  brokenImageUrls: string[] = [];
  reportDebounceTimer: any = null;
  existingImageFiles: File[] = [];
  activityId: string | null = null;

  constructor(
    private detailsService: DetailsService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private http: HttpClient,
    private imageProxyService: ImageProxyService,
    private activitiesService: ActivitiesService
  ) {}

  @Input() set activity(value: Activity | null) {
    if (value) {
      if (!value.activityId && (value as any).activityId) {
        value.activityId = (value as any).activityId;
      }
      
      if (value.culturalTips) {
        if (typeof value.culturalTips === 'string') {
          value.culturalTips = (value.culturalTips as string)
            .split(',')
            .map((tip: string) => tip.trim())
            .filter((tip: string) => tip.length > 0);
        } else if (!Array.isArray(value.culturalTips)) {
          value.culturalTips = [];
        }
      }
    }
    this._activity = value;
  }

  get activity(): Activity | null {
    return this._activity;
  }

  ngOnInit() {
    if (this._activity) {
      // Ensure culturalTips is an array
      if (!Array.isArray(this._activity.culturalTips)) {
        this._activity.culturalTips = [];
      }
      
      // Ensure fee values are numbers
      this._activity.touristAdult = Number(this._activity.touristAdult) || 0;
      this._activity.touristStudent = Number(this._activity.touristStudent) || 0;
      this._activity.egyptianAdult = Number(this._activity.egyptianAdult) || 0;
      this._activity.egyptianStudent = Number(this._activity.egyptianStudent) || 0;
      
      // Set the activityId
      this.activityId = this._activity.Id || this._activity.activityId;
      
    }

    if (this._activity?.activityId && (!this._activity?.culturalTips || this._activity?.culturalTips.length === 0)) {
      this.fetchActivityDetails(this._activity.activityId.toString());
    }

    this.subscriptions.push(
      this.detailsService.activity$.subscribe({
        next: (activity) => {
          if (activity) {
            // Ensure culturalTips is an array
            if (!Array.isArray(activity.culturalTips)) {
              activity.culturalTips = [];
            }

            this._activity = {
              ...activity,
              openTime: activity.openTime || '09:00:00',
              closeTime: activity.closeTime || '17:00:00',
              // Ensure fee values are numbers
              egyptianAdult: Number(activity.egyptianAdult) || 0,
              egyptianStudent: Number(activity.egyptianStudent) || 0,
              touristAdult: Number(activity.touristAdult) || 0,
              touristStudent: Number(activity.touristStudent) || 0,
              groupSize: Number(activity.groupSize) || 0,
              duration: activity.duration || 'Not specified',
              culturalTips: activity.culturalTips
            };
            
            // Set the activityId
            this.activityId = this._activity.Id || this._activity.activityId;
            
          } else {
            this._activity = null;
            this.activityId = null;
          }
        },
        error: (error) => {
          console.error('Error in activity subscription:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error instanceof Error ? error.message : 'Failed to load activity details'
          });
        }
      }),
      this.detailsService.isOpen$.subscribe(isOpen => {
        this.isOpen = isOpen;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onClose() {
    this.isOpen = false;
    this.isEditing = false;
    this.editedActivity = null;
    this.isOpenChange.emit(false);
    this.closeModal.emit();
    this.detailsService.closeDetails();
  }

  private triggerParentRefresh(): void {
    this.activityUpdated.emit();
  }

  onEdit() {
    if (this._activity) {
      this.editedActivity = {
        ...this._activity,
        // Ensure we have both ID fields
        Id: this._activity.Id || this._activity.activityId,
        activityId: this._activity.activityId || this._activity.Id,
        // Map properties to match API format
        name: this._activity.name || '',
        description: this._activity.description || '',
        categoryName: this._activity.categoryName || '',
        duration: this._activity.duration || '',
        // Handle cultural tips
        culturalTips: Array.isArray(this._activity.culturalTips) ? [...this._activity.culturalTips] : 
                     (typeof this._activity.culturalTips === 'string' ? (this._activity.culturalTips as string).split(',').map(tip => tip.trim()) : []),
        // Map fee properties
        egyptianAdult: Number(this._activity.egyptianAdult) || 0,
        egyptianStudent: Number(this._activity.egyptianStudent) || 0,
        touristAdult: Number(this._activity.touristAdult) || 0,
        touristStudent: Number(this._activity.touristStudent) || 0,
        // Ensure we have the image URLs array
        imageURLs: {
          $values: this._activity.imageURLs?.$values || []
        }
      };
      this.isEditing = true;
    }
  }

  private formatFee(fee: number | null | undefined): string {
    if (fee === null || fee === undefined || fee === 0) {
      return 'Free';
    }
    return fee.toString();
  }

  async saveChanges() {
    this.isLoading = true;
    this.uploadProgress = 0;

    
    if (!this.editedActivity) {
      console.error('No edited activity found');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No activity data to save'
      });
      this.isLoading = false;
      return;
    }

    // Ensure we have a valid ID
    const activityId = this.editedActivity.Id || this.editedActivity.activityId;
    if (!activityId) {
      console.error('No activity ID found');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Activity ID is missing'
      });
      this.isLoading = false;
      return;
    }


    try {
      const formData = new FormData();

      // Add fields exactly as shown in the API format
      formData.append('Name', this.editedActivity.name || '');
      formData.append('Description', this.editedActivity.description || '');
      formData.append('Duration', this.editedActivity.duration || '');
      formData.append('OpenTime', this.editedActivity.openTime || '');
      formData.append('CloseTime', this.editedActivity.closeTime || '');
      formData.append('Address', this.editedActivity.address || '');
      formData.append('LocationLink', this.editedActivity.locationLink || '');
      formData.append('Latitude', this.editedActivity.latitude?.toString() || '0');
      formData.append('Longitude', this.editedActivity.longitude?.toString() || '0');
      formData.append('CategoryName', this.editedActivity.categoryName || '');
      
      // Handle costs with proper naming and format zero as 'Free'
      formData.append('EgyptianAdultCost', this.formatFee(this.editedActivity.egyptianAdult));
      formData.append('EgyptianStudentCost', this.formatFee(this.editedActivity.egyptianStudent));
      formData.append('TouristAdultCost', this.formatFee(this.editedActivity.touristAdult));
      formData.append('TouristStudentCost', this.formatFee(this.editedActivity.touristStudent));

      // Handle cultural tips
      if (this.editedActivity.culturalTips) {
        if (Array.isArray(this.editedActivity.culturalTips)) {
          formData.append('CulturalTips', this.editedActivity.culturalTips.join(','));
        } else if (typeof this.editedActivity.culturalTips === 'string') {
          formData.append('CulturalTips', this.editedActivity.culturalTips);
        }
      } else {
        formData.append('CulturalTips', '');
      }

      // Handle images - convert existing URLs to File objects and combine with new files
      const existingImages = this.editedActivity.imageURLs?.$values || [];
      const remainingExistingImages = existingImages.filter(url => !this.removedImages.includes(url));
      
      // Convert existing image URLs to File objects
      const existingImageFiles: File[] = [];
      for (const imageUrl of remainingExistingImages) {
        if (typeof imageUrl === 'string') {
          try {
            const file = await this.convertUrlToFile(imageUrl);
            if (file) {
              existingImageFiles.push(file);
            }
          } catch (error) {
            console.warn('Failed to convert existing image, skipping:', imageUrl);
          }
        }
      }

      // Add all images as File objects to ImageURLs
      const allImageFiles = [...existingImageFiles, ...(this.selectedFiles || [])];
      for (const file of allImageFiles) {
        formData.append('ImageURLs', file);
      }

      // Ensure we have at least one image (API requirement)
      const totalImages = allImageFiles.length;
      
      if (totalImages === 0) {
        const defaultImage = await this.createDefaultImage();
        formData.append('ImageURLs', defaultImage);
      }
      
      const allImageData = formData.getAll('ImageURLs');
      
      // Critical check: Ensure ImageURLs field exists
      if (allImageData.length === 0) {
        console.error('Critical error: No ImageURLs found in form data');
        const emergencyDefaultImage = await this.createDefaultImage();
        formData.append('ImageURLs', emergencyDefaultImage);
      }




      
      // Subscribe to upload progress
      const progressSubscription = this.activitiesService.getUploadProgress().subscribe(
        progress => {
          console.log('Upload progress:', progress);
          this.uploadProgress = progress;
        }
      );

      // Save the changes
      this.activitiesService.updateActivity(activityId, formData).subscribe({
        next: (response) => {
          console.log('Update successful:', response);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Activity updated successfully'
          });
          
          // Auto-refresh: Refresh activity data and parent component
          this.refreshActivityData(activityId);
          this.triggerParentRefresh();
          
          this.isEditing = false;
          this.editedActivity = null;
          this.selectedFiles = [];
          this.previewImages = [];
          this.removedImages = [];
          this.isLoading = false;
          this.uploadProgress = 0;
          progressSubscription.unsubscribe();
        },
        error: (error) => {
          console.error('Activity save error:', error);
          console.error('Full error object:', JSON.stringify(error, null, 2));
          console.error('Error details:', {
            status: error?.status,
            statusText: error?.statusText,
            error: error?.error,
            message: error?.message
          });
          
          // Try to extract the actual error message from the response
          let actualErrorMessage = '';
          if (error?.error) {
            if (typeof error.error === 'string') {
              actualErrorMessage = error.error;
            } else if (error.error.message) {
              actualErrorMessage = error.error.message;
            } else if (error.error.title) {
              actualErrorMessage = error.error.title;
            } else {
              actualErrorMessage = JSON.stringify(error.error);
            }
          }
          
          console.error('Actual error message:', actualErrorMessage);
          
          let errorDetail = 'Failed to update activity';
          
          // Handle different types of API errors
          if (error?.status === 400) {
            errorDetail = 'Bad Request - Please check all required fields';
            if (actualErrorMessage) {
              errorDetail += `: ${actualErrorMessage}`;
            } else if (error?.error?.errors) {
              const errorMessages = Object.entries(error.error.errors)
                .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                .join('; ');
              errorDetail += `: ${errorMessages}`;
            } else if (error?.error?.message) {
              errorDetail += `: ${error.error.message}`;
            }
          } else if (error?.error?.errors) {
            errorDetail += ': ' + Object.values(error.error.errors).join(', ');
          } else if (error?.error?.message) {
            errorDetail += ': ' + error.error.message;
          } else if (error?.message) {
            errorDetail += ': ' + error.message;
          }
          
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: errorDetail
          });
          this.isLoading = false;
          this.uploadProgress = 0;
          progressSubscription.unsubscribe();
        }
      });
    } catch (error) {
      console.error('Error preparing activity data:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to prepare activity data for update'
      });
      this.isLoading = false;
      this.uploadProgress = 0;
    }
  }

  private async convertUrlToFile(imageUrl: string): Promise<File | null> {
    try {
      const file = await this.imageProxyService.urlToFile(imageUrl);
      if (!file) {
        throw new Error('Failed to convert URL to File');
      }
      return file;
    } catch (error) {
      console.error('Error converting URL to File:', error);
      return null;
    }
  }

  private async createDefaultImage(): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not create canvas context');
  
      // Draw default image
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#999';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Activity Image', canvas.width/2, canvas.height/2);
      
      canvas.toBlob(blob => {
        if (!blob) throw new Error('Could not create blob');
        resolve(new File([blob], 'default-image.jpg', { type: 'image/jpeg' }));
      }, 'image/jpeg');
    });
  }

  private handleSaveError(error: any): void {
    this.isLoading = false;
    console.error('Save error:', error);
    
    let errorDetail = 'Failed to update activity';
    if (error?.error?.errors) {
      errorDetail += ': ' + Object.values(error.error.errors).join(', ');
    } else if (error?.error?.message) {
      errorDetail += ': ' + error.error.message;
    } else if (error?.message) {
      errorDetail += ': ' + error.message;
    }
    
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: errorDetail
    });
  }

  private async refreshActivityData(id: string) {
    if (!id) return;
    
    try {
      const activity = await this.activitiesService.getActivityById(id).toPromise();
      if (activity) {
        this._activity = activity;
        this.activityId = activity.Id || activity.activityId;
        
        // Update the details service with the refreshed activity
        this.detailsService.openActivityDetails(activity);
        
        // Show success message
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Activity updated successfully'
        });
      } else {
        throw new Error('Activity not found');
      }
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'Failed to load activity details'
      });
    }
  }

  confirmDelete(event: Event) {
    if (!this._activity) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No activity data available'
      });
      return;
    }
    
    const activityId = this._activity.activityId;
    
    if (!activityId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No activity ID available'
      });
      return;
    }

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Are you sure you want to delete this activity?',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        const id = activityId.toString();
        
        this.activitiesService.deleteActivity(id).subscribe({
          next: (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Activity deleted successfully'
            });
  
            // Close the sidebar
            this.isOpen = false;
            this.isOpenChange.emit(false);
            
            // Emit event to parent to refresh the list
            this.closeModal.emit();
            this.detailsService.closeDetails();
            
            // Optionally: reload the page after a short delay
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          },
          error: (error) => {
            console.error('Error deleting activity:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error instanceof Error ? error.message : 'Failed to delete activity'
            });
          }
        });
      }
    });
  }
  
  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/defaultplace.png';
  }
  addMedia() {
    ('Adding media...');
    // TODO: Implement media upload functionality
  }

  removeMedia(photoUrl: string) {
    if (this.editedActivity && this.editedActivity.imageURLs?.$values) {
      this.removedImages.push(photoUrl);
      this.editedActivity.imageURLs.$values = this.editedActivity.imageURLs.$values.filter(url => url !== photoUrl);
    }
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined || value === null || value === 0) return 'Free';
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(value);
  }

  getTimeString(time: string | undefined): string {
    if (!time) return '';
    // Convert "HH:mm:ss" to "HH:mm" for display
    return time.split(':').slice(0, 2).join(':');
  }

  private formatTimeForApi(time: string): string {
    // If time is already in HH:mm:ss format, return it
    if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
      return time;
    }
    
    // If time is in HH:mm format, add seconds
    if (/^\d{2}:\d{2}$/.test(time)) {
      return `${time}:00`;
    }
    
    // If time is in HH format, add minutes and seconds
    if (/^\d{2}$/.test(time)) {
      return `${time}:00:00`;
    }
    
    // Default case - return as is
    return time;
  }

  // Add a new cultural tip
  addTip() {
    if (this.editedActivity) {
      if (!Array.isArray(this.editedActivity.culturalTips)) {
        this.editedActivity.culturalTips = [];
      }
      this.editedActivity.culturalTips.push('');
    }
  }

  // Remove a cultural tip
  removeTip(index: number) {
    if (this.editedActivity && Array.isArray(this.editedActivity.culturalTips)) {
      this.editedActivity.culturalTips.splice(index, 1);
    }
  }

  private async processImages(remainingImages: string[]): Promise<void> {
    if (!remainingImages || remainingImages.length === 0) return;

    const formData = new FormData();
    
    try {
      const existingImageFiles = await Promise.all(
        remainingImages.map(url => this.convertUrlToFile(url))
      );
      
      // Filter out null values and add valid files to formData
      const validFiles = existingImageFiles.filter((file): file is File => file !== null);
      validFiles.forEach(file => {
        formData.append('images', file);
      });

      if (this.activityId) {
        await this.activitiesService.uploadImages(this.activityId, formData).toPromise();
      }
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to process images'
      });
    }
  }

  /**
   * Handles the file input change event for image uploads
   * @param event The file input change event
   */
  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFiles = Array.from(files);
      this.previewImages = [];
      
      // Create previews for selected files
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewImages.push(e.target.result);
        };
        reader.readAsDataURL(files[i]);
      }
    }
  }

  /**
   * Removes a preview image from the list
   * @param preview The preview image URL to remove
   */
  removePreview(preview: string): void {
    const index = this.previewImages.indexOf(preview);
    if (index > -1) {
      this.previewImages.splice(index, 1);
      this.selectedFiles.splice(index, 1);
    }
  }

  /**
   * Gets the current images for display
   * @returns Array of image URLs
   */
  getCurrentImages(): string[] {
    // Combine existing images with any that haven't been removed
    const currentImages = this.isEditing 
      ? this.editedActivity?.imageURLs?.$values || []
      : this._activity?.imageURLs?.$values || [];
    
    return currentImages.filter(img => !this.removedImages.includes(img));
  }

  private fetchActivityDetails(activityId: string) {
    this.activitiesService.getActivityById(activityId).subscribe({
      next: (detailedActivity: any) => {
        if (detailedActivity) {
          this._activity = { ...this._activity, ...detailedActivity };
  
          if (this._activity) {
            if (typeof this._activity.culturalTips === 'string') {
              this._activity.culturalTips = (this._activity.culturalTips as string)
                .split(',')
                .map((tip: string) => tip.trim())
                .filter((tip: string) => tip.length > 0);
            } 
            else if (!Array.isArray(this._activity.culturalTips)) {
              this._activity.culturalTips = [];
            }
          }
        }
      },
      error: (error: Error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch activity details'
        });
      }
    });
  }

  editActivity() {
    if (this._activity) {
      try {
        this.editedActivity = JSON.parse(JSON.stringify(this._activity));
        
        if (this._activity.activityId) {
          if (!this.editedActivity) {
            this.editedActivity = { activityId: this._activity.activityId } as Activity;
          } else {
            this.editedActivity.activityId = this._activity.activityId;
          }
        }
        
        if (this.editedActivity) {
          if (!this.editedActivity.culturalTips) {
            this.editedActivity.culturalTips = [];
          } else if (typeof this.editedActivity.culturalTips === 'string') {
            this.editedActivity.culturalTips = (this.editedActivity.culturalTips as string)
              .split(',')
              .map((tip: string) => tip.trim())
              .filter((tip: string) => tip.length > 0);
          }
        }
      } catch (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to prepare activity for editing'
        });
        return;
      }
      
      this.isEditing = true;
      setTimeout(() => {
        this.scrollToTop();
      }, 0);
    }
  }

  loadActivities(): void {
    this.activitiesService.fetchActivities().subscribe({
      next: (activities) => {
        // Handle the loaded activities
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load activities'
        });
      }
    });
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
} 