import { Component, EventEmitter, Output } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ActivitiesService } from '../../services/activities.service';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-add-activity-modal',
  templateUrl: './add-activity-modal.component.html',
  styleUrls: ['./add-activity-modal.component.scss']
})
export class AddActivityModalComponent {
  @Output() activityAdded = new EventEmitter<any>();

  visible: boolean = false;
  loading: boolean = false;
  culturalTipsList: {id: number, value: string}[] = [];
  selectedFiles: File[] = [];
  photoCount: number = 0;
  photoUrl: string = 'assets/images/defaultactivity.png';
  isSubmitting: boolean = false;

  hours = Array.from({ length: 24 }, (_, i) => 
    `${String(i).padStart(2, '0')}:00`
  );

  activity = {
    name: '',
    categoryName: '',
    description: '',
    openTime: '',
    closeTime: '',
    egyptianAdult: 0,
    egyptianStudent: 0,
    touristAdult: 0,
    touristStudent: 0,
    duration: '',
    culturalTips: [] as string[],
    imageURLs: [] as string[],
    address: '',
    locationLink: '',
    latitude: 0,
    longitude: 0
  };
  categories: { value: string, label: string }[] = [
    { value: 'Diving Snorkeling', label: 'Diving Snorkeling' },
    { value: 'Hiking', label: 'Hiking' },
    { value: 'Water Sports and Nile Activities', label: 'Water Sports and Nile Activities' },
    { value: 'Cultural Experience', label: 'Cultural Experience' },
    { value: 'Adventure Activity', label: 'Adventure Activity' },
    { value: 'Relaxation and Wellness', label: 'Relaxation and Wellness' },
    { value: 'Entertainment', label: 'Entertainment' },
    { value: 'Safari', label: 'Safari' },
    { value: 'Fancy Restaurant', label: 'Fancy Restaurant' },
    { value: 'Hidden Gems', label: 'Hidden Gems' }
  ];
  

  constructor(
    private messageService: MessageService,
    private activitiesService: ActivitiesService
  ) {
    this.addTip();
  }

  show() {
    this.visible = true;
  }

  onOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  onCancel() {
    this.visible = false;
    this.resetForm();
  }

  addTip() {
    this.culturalTipsList.push({id: Date.now(), value: ''});
  }

  removeTip(index: number) {
    this.culturalTipsList.splice(index, 1);
  }

  trackByTipId(index: number, tip: any): number {
    return tip.id;
  }

  onCategoryChange(event: any) {
    console.log('Selected CategoryName:', this.activity.categoryName);
  }

  private async compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with reduced quality
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          }, 'image/jpeg', 0.7); // Adjust quality here (0.7 = 70% quality)
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const maxFiles = 9 - this.photoCount;
      const filesToAdd = Array.from(input.files).slice(0, maxFiles);
      
      try {
        for (const file of filesToAdd) {
          const compressedBlob = await this.compressImage(file);
          const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
          
          this.selectedFiles.push(compressedFile);
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              this.activity.imageURLs.push(reader.result);
              this.photoCount++;
              
              if (this.photoCount === 1) {
                this.photoUrl = reader.result;
              }
            }
          };
          reader.readAsDataURL(compressedFile);
        }
      } catch (error) {
        console.error('Error compressing images:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to process images. Please try again.'
        });
      }
    }
  }

  setMainPhoto(index: number) {
    if (this.activity.imageURLs[index]) {
      this.photoUrl = this.activity.imageURLs[index];
    }
  }

  save() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    
    this.messageService.clear();
    
    if (!this.validateForm()) {
      this.isSubmitting = false;
      return;
    }
  
    this.loading = true;
    const formData = this.prepareFormData();
  
    this.activitiesService.addActivity(formData)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.isSubmitting = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          console.log('API Response:', response);
          
          // Show success message
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Activity added successfully'
          });

          // Emit the new activity data to trigger parent refresh
          this.activityAdded.emit(response);
          
          // Close the modal and reset
          this.visible = false;
          this.resetForm();
          
          // Force a page reload after a short delay
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        },
        error: (error) => {
          console.error('Error details:', error);
          
          let errorMessage = 'Failed to add activity. Please try again.';
          
          if (error.status === 0) {
            errorMessage = 'Cannot connect to server. Please check your internet connection and try again.';
          } else if (error.error?.errors?.$values?.[0]) {
            errorMessage = error.error.errors.$values[0];
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.status === 413) {
            errorMessage = 'The uploaded files are too large. Please reduce their size and try again.';
          } else if (error.status === 415) {
            errorMessage = 'Unsupported file type in the uploaded files.';
          } else if (error.status >= 500) {
            errorMessage = 'Server error occurred. Please try again later.';
          }
          
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage,
            life: 5000
          });
        }
      });
  }

  private prepareFormData(): FormData {
    const formData = new FormData();
    
    // Basic details with proper casing to match API
    formData.append('Name', this.activity.name);
    formData.append('Description', this.activity.description);
    formData.append('Duration', this.activity.duration);
    formData.append('CategoryName', this.activity.categoryName);
    
    // Costs - use uppercase with 'Cost' suffix for API
    formData.append('EgyptianAdultCost', this.activity.egyptianAdult.toString());
    formData.append('EgyptianStudentCost', this.activity.egyptianStudent.toString());
    formData.append('TouristAdultCost', this.activity.touristAdult.toString());
    formData.append('TouristStudentCost', this.activity.touristStudent.toString());
    
    // Time
    formData.append('OpenTime', this.activity.openTime);
    formData.append('CloseTime', this.activity.closeTime);
  
    // Cultural tips as comma-separated string
    const culturalTips = this.culturalTipsList
      .filter(tip => tip.value.trim() !== '')
      .map(tip => tip.value.trim());
    formData.append('CulturalTips', culturalTips.join(','));
  
    // Location fields
    formData.append('Address', this.activity.address);
    if (this.activity.locationLink) {
      formData.append('LocationLink', this.activity.locationLink);
    }
    formData.append('Latitude', this.activity.latitude.toString());
    formData.append('Longitude', this.activity.longitude.toString());
  
    // Images - make sure to append with the correct field name
    if (this.selectedFiles.length > 0) {
      this.selectedFiles.forEach(file => {
        formData.append('imageURLs', file);
      });
    }

    // Log the form data for debugging
    console.log('Form data being sent:');
    formData.forEach((value, key) => {
      if (value instanceof File) {
        console.log(`${key}: File - ${value.name}`);
      } else {
        console.log(`${key}: ${value}`);
      }
    });

    return formData;
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    
    let errorDetail = 'Failed to add activity';
    if (error.status === 503) {
      errorDetail = 'Service unavailable. Please try again later.';
    } else if (error.error?.errors) {
      errorDetail = Object.values(error.error.errors).flat().join('\n');
    } else if (error.error?.message) {
      errorDetail = error.error.message;
    }

    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: errorDetail,
      life: 10000
    });
  }

  private validateForm(): boolean {
    const requiredFields = ['name', 'description', 'categoryName', 'openTime', 'closeTime', 'duration'];
    const missingFields = requiredFields.filter(field => !this.activity[field as keyof typeof this.activity]);

    if (missingFields.length > 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Please fill in all required fields: ${missingFields.join(', ')}`
      });
      return false;
    }

    // Validate costs
    if (this.activity.egyptianAdult < 0 || 
        this.activity.egyptianStudent < 0 || 
        this.activity.touristAdult < 0 || 
        this.activity.touristStudent < 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Costs cannot be negative'
      });
      return false;
    }

    // Validate location
    if (!this.activity.address) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Address is required'
      });
      return false;
    }

    return true;
  }

  private resetForm() {
    this.activity = {
      name: '',
      categoryName: '',
      description: '',
      openTime: '',
      closeTime: '',
      egyptianAdult: 0,
      egyptianStudent: 0,
      touristAdult: 0,
      touristStudent: 0,
      duration: '',
      culturalTips: [],
      imageURLs: [],
      address: '',
      locationLink: '',
      latitude: 0,
      longitude: 0
    };
    this.culturalTipsList = [{id: Date.now(), value: ''}];
    this.selectedFiles = [];
    this.photoCount = 0;
    this.photoUrl = 'assets/images/defaultactivity.png';
  }
}
