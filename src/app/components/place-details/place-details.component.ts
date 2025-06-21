import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, OnInit } from '@angular/core';
import { Place } from '../../models/place.model';
import { DetailsService } from '../../services/details.service';
import { ConfirmationService } from 'primeng/api';
import { PlacesService } from '../../services/places.service';
import { MessageService } from 'primeng/api';
import { PascalCasePipe } from 'src/app/pascal-case.pipe';
import { environment } from 'src/environments/environment';
import { ImageProxyService } from '../../services/image-proxy.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-place-details',
  templateUrl: './place-details.component.html',
  styleUrls: ['./place-details.component.scss']
})
export class PlaceDetailsComponent implements OnInit {
  allowNoImages: any;
  @Input() set place(value: Place | null) {
    if (value) {
      // Ensure we have a placeID (handle both placeID and placeId)
      if (!value.placeID && (value as any).placeId) {
        value.placeID = (value as any).placeId;
      }
      
      // Ensure culturalTips is properly initialized
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
    this._place = value;
  }
  get place(): Place | null {
    return this._place;
  }
  private _place: Place | null = null;

  @Input() isOpen: boolean = false;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() placeDeleted = new EventEmitter<string>();
  @Output() placeUpdated = new EventEmitter<void>();
  @ViewChild('sidebarContent') sidebarContent!: ElementRef;
  isEdited = false;

  isEditing = false;
  editedPlace: Place | null = null;
  isLoading: boolean = false; 
  previewImages: string[] = [];
  selectedFiles: File[] = [];   
  removedImages: string[] = []; 
   brokenImageUrls: string[] = [];
   reportDebounceTimer: any = null;
  existingImageFiles: File[] = []; // To store converted existing images

  constructor(
    private detailsService: DetailsService, 
    private confirmationService: ConfirmationService,
    private placesService: PlacesService,
    private messageService: MessageService,
    private imageProxyService: ImageProxyService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    if (this._place?.placeID && (!this._place?.culturalTips || this._place?.culturalTips.length === 0)) {
      this.fetchPlaceDetails(this._place.placeID.toString());
    }
  }

  private fetchPlaceDetails(placeId: string) {
    this.placesService.getPlaceById(placeId).subscribe({
      next: (detailedPlace: any) => {
        if (detailedPlace) {
          this._place = { ...this._place, ...detailedPlace };
  
          if (this._place) {
            if (typeof this._place.culturalTips === 'string') {
              this._place.culturalTips = (this._place.culturalTips as string)
                .split(',')
                .map((tip: string) => tip.trim())
                .filter((tip: string) => tip.length > 0);
            } 
            else if (!Array.isArray(this._place.culturalTips)) {
              this._place.culturalTips = [];
            }
          }
        }
      },
      error: (error: Error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch place details'
        });
      }
    });
  }
  get document(): Document {
    return document;
  }


  editPlace() {
    if (this._place) {
      try {
        this.editedPlace = JSON.parse(JSON.stringify(this._place));
        
        if (this._place.placeID) {
          if (!this.editedPlace) {
            this.editedPlace = { placeID: this._place.placeID } as Place;
          } else {
            this.editedPlace.placeID = this._place.placeID;
          }
        }
        
        if (this.editedPlace) {
          if (!this.editedPlace.culturalTips) {
            this.editedPlace.culturalTips = [];
          } else if (typeof this.editedPlace.culturalTips === 'string') {
            this.editedPlace.culturalTips = (this.editedPlace.culturalTips as string)
              .split(',')
              .map((tip: string) => tip.trim())
              .filter((tip: string) => tip.length > 0);
          }
        }
      } catch (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to prepare place for editing'
        });
        return;
      }
      
      this.isEditing = true;
      setTimeout(() => {
        this.scrollToTop();
      }, 0);
    }
  }

  confirmDelete(event: Event) {
    if (!this._place) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No place data available'
      });
      return;
    }
    
    const placeId = this._place.placeID;
    
    if (!placeId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No place ID available'
      });
      return;
    }

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Are you sure you want to delete this place?',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        const id = placeId.toString();
        
        this.placesService.deletePlace(id).subscribe({
          next: (response) => {
            this.placeDeleted.emit(id);
            this.close();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete place'
            });
          }
        });
      }
    });
  }


    loadPlaces(): void {
    this.placesService.fetchPlaces().subscribe({
      next: (places) => {
        // Handle the loaded places
        // For example, you might emit an event to the parent component
        console.log('Places loaded:', places);
      },
      error: (error) => {
        console.error('Failed to load places:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load places'
        });
      }
    });
  }
  getImageUrl(file: File): string {
    // Check if it's a placeholder SVG
    if (file.type === 'image/svg+xml') {
      return URL.createObjectURL(file);
    }
    return file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
  }
  
  handleImageError(event: Event, source: File | string) {
    const imgElement = event.target as HTMLImageElement;
    
    if (typeof source === 'string') {
      // For URL strings, set to default place image
      imgElement.src = 'assets/images/defaultplace.png';
    } else {
      // For File objects, set to default place image
      imgElement.src = 'assets/images/defaultplace.png';
    }
  }
  async prepareExistingImages(): Promise<void> {
    // Since we're no longer converting images to files, this method just validates URLs
    this.existingImageFiles = [];
    this.brokenImageUrls = [];
    const currentImages = this.editedPlace?.imageURLs?.$values || [];
    
    // Validate existing image URLs
    for (const imgUrl of currentImages) {
      if (typeof imgUrl !== 'string') continue;
      
      // Validate URL format
      if (!this.validateImageUrl(imgUrl)) {
        console.warn(`Malformed image URL: ${imgUrl}`);
        this.brokenImageUrls.push(imgUrl);
      } else {
        console.log(`Valid image URL: ${imgUrl}`);
      }
    }
    
    // Report broken images if any
    this.reportBrokenImages();
  }
  
  private validateImageUrl(url: string): boolean {
    try {
      // Check for complete URL pattern with UUID and extension
      const urlPattern = /^https:\/\/kemet-server\.runasp\.net\/images\/places\/[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}\.(jpg|jpeg|png|webp)$/i;
      return urlPattern.test(url) && new URL(url).hostname === 'kemet-server.runasp.net';
    } catch {
      return false;
    }
  }
  
  private extractFilenameFromUrl(url: string): string {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    return pathParts[pathParts.length - 1] || `image-${Date.now()}.jpg`;
  }
  
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Unknown error occurred';
  }
  
  private reportBrokenImages(): void {
    if (!this.editedPlace?.placeID || this.brokenImageUrls.length === 0) {
      return;
    }
  
    // Debounce to avoid multiple rapid reports
    clearTimeout(this.reportDebounceTimer);
    this.reportDebounceTimer = setTimeout(() => {
      // Since reportBrokenImages is not available in PlacesService, we'll log it for now
      console.warn('Broken images detected:', this.brokenImageUrls);
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: `Found ${this.brokenImageUrls.length} broken images`,
        life: 3000
      });
    }, 1000); // 1 second debounce
  }

  private formatFee(fee: number | null | undefined): string {
    // For API calls - send numeric values
    if (fee === null || fee === undefined || fee === 0) {
      return '0';
    }
    return fee.toString();
  }

  formatFeeDisplay(fee: number | null | undefined): string {
    // For UI display - show 'Free' for zero values
    if (fee === null || fee === undefined || fee === 0) {
      return 'Free';
    }
    return fee.toString();
  }

  async saveChanges() {
    
    if (!this.editedPlace || !this.editedPlace.placeID) {
      console.error('Invalid place data');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Invalid place data'
      });
      return;
    }

    // Validate required fields
    if (!this.editedPlace.address?.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Address is required'
      });
      return;
    }

    // Validate coordinates
    if (this.editedPlace.latitude === undefined || this.editedPlace.longitude === undefined) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Latitude and Longitude are required'
      });
      return;
    }

    this.isLoading = true;
    this.messageService.add({
      severity: 'info',
      summary: 'Saving',
      detail: 'Updating place information...'
    });

    try {
      const formData = new FormData();
      
      // Add PlaceID first
      formData.append('PlaceID', this.editedPlace.placeID.toString());
      
      // Add basic place data with proper casing as shown in the screenshot
      formData.append('Name', this.editedPlace.name || '');
      formData.append('Description', this.editedPlace.description || '');
      formData.append('CategoryName', this.editedPlace.categoryName || '');
      
      // Handle cultural tips properly - send as comma-separated string
      if (this.editedPlace.culturalTips && Array.isArray(this.editedPlace.culturalTips)) {
        const tipsString = this.editedPlace.culturalTips
          .filter(tip => tip && tip.trim())
          .join(',');
        formData.append('CulturalTips', tipsString);
      } else if (typeof this.editedPlace.culturalTips === 'string') {
        formData.append('CulturalTips', this.editedPlace.culturalTips);
      } else {
        formData.append('CulturalTips', '');
      }
      
      formData.append('Duration', this.editedPlace.duration || '');
      formData.append('Address', this.editedPlace.address || '');
      formData.append('LocationLink', this.editedPlace.locationLink || '');
      formData.append('Latitude', this.editedPlace.latitude?.toString() || '0');
      formData.append('Longitude', this.editedPlace.longitude?.toString() || '0');
      formData.append('OpenTime', this.formatTime(this.editedPlace.openTime) || '');
      formData.append('CloseTime', this.formatTime(this.editedPlace.closeTime) || '');
      formData.append('EgyptianAdultCost', this.formatFee(this.editedPlace.egyptianAdult));
      formData.append('EgyptianStudentCost', this.formatFee(this.editedPlace.egyptianStudent));
      formData.append('TouristAdultCost', this.formatFee(this.editedPlace.touristAdult));
      formData.append('TouristStudentCost', this.formatFee(this.editedPlace.touristStudent));
      
      // Handle images - convert existing URLs to File objects and combine with new files
      const existingImages = this.editedPlace.imageURLs?.$values || [];
      const remainingExistingImages = existingImages.filter(url => !this.removedImages.includes(url));
      
              // Convert existing image URLs to File objects
        const existingImageFiles: File[] = [];
        for (const imageUrl of remainingExistingImages) {
          if (typeof imageUrl === 'string') {
            try {
              const file = await this.convertUrlToFile(imageUrl);
              existingImageFiles.push(file);
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

      // Submit to API
      this.placesService.updatePlace(this.editedPlace.placeID, formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.isEdited = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Place updated successfully'
          });
          
          // Reset state
          this.isEditing = false;
          this.editedPlace = null;
          this.selectedFiles = [];
          this.previewImages = [];
          this.removedImages = [];
          
          // Auto-refresh: Refresh place data and parent component
          this.refreshPlaceData();
          this.triggerParentRefresh();
        },
        error: (error) => {
          this.handleSaveError(error);
        }
      });

    } catch (error) {
      this.handleSaveError(error);
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
        ctx.fillText('Place Image', canvas.width/2, canvas.height/2);
        
        canvas.toBlob(blob => {
          if (!blob) throw new Error('Could not create blob');
          resolve(new File([blob], 'default-image.jpg', { type: 'image/jpeg' }));
        }, 'image/jpeg');
      });
    }

    private async convertUrlToFile(imageUrl: string): Promise<File> {
      try {
        const file = await this.imageProxyService.urlToFile(imageUrl);
        if (!file) {
          throw new Error('Failed to convert URL to File');
        }
        return file;
      } catch (error) {
        console.error('Error converting URL to File:', error);
        throw error;
      }
    }
    
    private handleSaveError(error: any): void {
      this.isLoading = false;
      console.error('Save error:', error);
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
      
      let errorDetail = 'Failed to update place';
      
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
    }
    
    private refreshPlaceData(): void {
      if (!this._place?.placeID) {
        console.error('Cannot refresh place data: No place ID available');
        return;
      }
      
      this.placesService.getPlaceById(this._place.placeID.toString()).subscribe({
        next: (detailedPlace: any) => {
          if (detailedPlace) {
            
            // Update the place data
            this._place = { ...this._place, ...detailedPlace };
            
            // Process cultural tips
            if (this._place && typeof this._place.culturalTips === 'string') {
              this._place.culturalTips = (this._place.culturalTips as string)
                .split(',')
                .map((tip: string) => tip.trim())
                .filter((tip: string) => tip.length > 0);
            } else if (this._place && !Array.isArray(this._place.culturalTips)) {
              this._place.culturalTips = [];
            }
            
            // Update the details service
            if (this._place) {
              this.detailsService.openPlaceDetails(this._place);
            }
          }
        },
        error: (error) => {
          console.error('Error refreshing place data:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to refresh place data'
          });
        }
      });
    }
    

  // Add this method to handle file selection
  onFileSelected(event: any): void {
    const files = event.target.files;
    if (!files || files.length === 0) return;
  
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
  // Helper method to refresh place data after update

  getCurrentImages(): string[] {
    // Combine existing images with any that haven't been removed
    const currentImages = this.isEditing 
      ? this.editedPlace?.imageURLs?.$values || []
      : this.place?.imageURLs?.$values || [];
    
    return currentImages.filter(img => !this.removedImages.includes(img));
  }
  
  removeMedia(photo: string): void {
    this.removedImages.push(photo);
    this.isEdited = true;
  }
  
  removePreview(preview: string): void {
    const index = this.previewImages.indexOf(preview);
    if (index > -1) {
      this.previewImages.splice(index, 1);
      this.selectedFiles.splice(index, 1);
    }
    this.isEdited = true;
  }
  
  addMedia(): void {
  }
  
  
  // Helper methods
  private formatCulturalTips(tips: any): string {
    if (!tips) return '';
  
    // Handle array of tips
    if (Array.isArray(tips)) {
      return tips
        .map(tip => {
          if (tip === null || tip === undefined) return '';
          if (typeof tip === 'string') return tip.trim();
          if (typeof tip === 'object') {
            return tip.Value || tip.text || tip.name || tip.description || '';
          }
          return tip.toString().trim();
        })
        .filter(tip => tip !== '')
        .join(', ');
    }
  
    // Handle single tip
    if (typeof tips === 'object') {
      return tips.Value || tips.text || tips.name || tips.description || '';
    }
  
    return tips.toString().trim();
  }
  
  private formatTime(time: any): string {
    if (!time) return '';
    if (typeof time === 'string') {
      // If it's already in HH:mm format, return as is
      if (/^\d{2}:\d{2}$/.test(time)) return time;
      // Try to parse the time string and format it
      try {
        const date = new Date(`1970-01-01T${time}`);
        return date.toTimeString().substring(0, 5);
      } catch {
        return time;
      }
    }
    if (time instanceof Date) return time.toTimeString().substring(0, 5);
    return '';
  }
  
  close() {
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.isEditing = false;
    this.editedPlace = null;
  }

  private triggerParentRefresh(): void {
    this.placeUpdated.emit();
  }

  scrollToTop() {
    if (this.sidebarContent) {
      this.sidebarContent.nativeElement.scrollTop = 0;
    }
  }

  getAllTips(): string[] {
    if (!this._place) return [];
    
    if (this._place.culturalTips) {
      if (typeof this._place.culturalTips === 'string') {
        return (this._place.culturalTips as string)
          .split(',')
          .map((tip: string) => tip.trim())
          .filter((tip: string) => tip.length > 0);
      } else if (Array.isArray(this._place.culturalTips)) {
        return this._place.culturalTips;
      }
    }
    
    return [];
  }

  addTip() {
    if (this.editedPlace) {
      if (!this.editedPlace.culturalTips) {
        this.editedPlace.culturalTips = [];
      }
      this.editedPlace.culturalTips.push('');
    }
  }

  removeTip(index: number) {
    if (this.editedPlace && this.editedPlace.culturalTips) {
      this.editedPlace.culturalTips.splice(index, 1);
    }
  }


}