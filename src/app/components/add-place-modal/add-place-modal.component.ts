import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { PlacesService } from '../../services/places.service';

@Component({
  selector: 'app-add-place-modal',
  templateUrl: './add-place-modal.component.html',
  styleUrls: ['./add-place-modal.component.scss'],
  providers: [MessageService]
})
export class AddPlaceModalComponent implements OnInit {
  isOpen: boolean = false;
  loading: boolean = false;

  @Output() placeAdded = new EventEmitter<any>();

  // Array of valid categories - exact values from API
  categories: { value: string, label: string }[] = [
    { value: 'Museums', label: 'Museums' },
    { value: 'Religious', label: 'Religious' },
    { value: 'Nature Spots', label: 'Nature Spots' },
    { value: 'Nile River Destinations', label: 'Nile River Destinations' },
    { value: 'historical', label: 'Historical' },
    { value: 'Entertainment', label: 'Entertainment' },
    { value: 'Desert Landscape', label: 'Desert Landscape' },
    { value: 'Hidden Gems', label: 'Hidden Gems' },
    { value: 'National Park', label: 'National Park' },
    { value: 'Resorts and Beaches', label: 'Resorts and Beaches' }
  ];

  // Array of hours for the time select
  hours: string[] = [];

  place = {
    id: '',
    name: '',
    CategoryName: '',
    photo: '/assets/images/defaultplace.png',
    photos: [] as string[],
    openTime: '',
    closeTime: '',
    duration: '',
    touristAdult: 0,
    touristStudent: 0,
    egyptianAdult: 0,
    egyptianStudent: 0,
    description: '',
    culturalTips: [] as string[],
    Address: '',
    LocationLink: '',
    Latitude: 0,
    Longitude: 0
  };

  // Replace the checkbox-based cultural tips with an array of strings
  culturalTipsList: string[] = [];
  cdRef: any;

  // Track number of uploaded photos
  get photoCount(): number {
    return this.place.photos.length;
  }

  constructor(
    private placesService: PlacesService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.initializeHours();
  }

  /**
   * Initialize the hours array for the time select
   */
  private initializeHours() {
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0');
      this.hours.push(`${hour}:00`);
    }
  }

  /**
   * Handles file input change and sets previews for the images
   */
  onFileChange(event: any) {
    const files = event.target.files;
    if (files) {
      // Check if adding these files would exceed the 9 photo limit
      if (this.photoCount + files.length > 9) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Maximum 9 photos allowed'
        });
        return;
      }

      Array.from(files).forEach((file: any) => {
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            this.place.photos.push(reader.result as string);
            // Set the first photo as the main photo
            if (this.place.photos.length === 1) {
              this.place.photo = this.place.photos[0];
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  /**
   * Format time to 24-hour format (HH:mm)
   */
  formatTime(time: string): string {
    if (!time) return '';
    return time;
  }

  /**
   * Saves the place data to the API
   */
  save() {
    if (this.loading) return;

    // Validate required fields
    if (!this.place.name || !this.place.CategoryName) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill in all required fields'
      });
      return;
    }

    // Validate required location fields
    if (!this.place.Address || this.place.Latitude === 0 || this.place.Longitude === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill in all required location fields (Address, Latitude, and Longitude)'
      });
      return;
    }

    // Validate category
    if (!this.categories.some(cat => cat.value === this.place.CategoryName)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please select a valid category'
      });
      return;
    }

    this.loading = true;

    // Format data according to API requirements
    const formData = new FormData();
    formData.append('Name', this.place.name);
    formData.append('Description', this.place.description);
    formData.append('CategoryName', this.place.CategoryName);

    formData.append('OpenTime', this.place.openTime);
    formData.append('CloseTime', this.place.closeTime);
    // Format cultural tips as a comma-separated string
    const formattedCulturalTips = this.culturalTipsList
      .filter(tip => tip.trim() !== '')
      .join(',');
    formData.append('CulturalTips', formattedCulturalTips);
    
    formData.append('Duration', this.place.duration);
    formData.append('EgyptianAdultCost', this.place.egyptianAdult.toString());
    formData.append('EgyptianStudentCost', this.place.egyptianStudent.toString());
    formData.append('TouristAdultCost', this.place.touristAdult.toString());
    formData.append('TouristStudentCost', this.place.touristStudent.toString());

    // Add location fields
    formData.append('Address', this.place.Address);
    if (this.place.LocationLink) {
      formData.append('LocationLink', this.place.LocationLink);
    }
    formData.append('Latitude', this.place.Latitude.toString());
    formData.append('Longitude', this.place.Longitude.toString());

    // Handle images
    if (this.place.photos && this.place.photos.length > 0) {
      this.place.photos.forEach((photo, index) => {
        try {
          const base64Data = photo.split(',')[1];
          if (!base64Data) {
            console.error('Invalid image data format');
            return;
          }
          const byteString = atob(base64Data);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: 'image/jpeg' });
          const file = new File([blob], `image${index + 1}.jpg`, { type: 'image/jpeg' });
          formData.append('ImageURLs', file);
        } catch (error) {
          console.error('Error processing image:', error);
        }
      });
    }

    // Use the PlacesService to create the place
    this.placesService.createPlace(formData as any).subscribe({
      next: (response: any) => {
        console.log('API Response:', response);
        
        // Show success message
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Place added successfully'
        });

        // Emit the new place data to trigger parent refresh
        this.placeAdded.emit(response);
        
        // Close the modal
        this.close();
        
        // Force a page reload after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      },
      error: (error) => {
        console.error('Error details:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.error);
        
        const errorMessage = error.error?.errors?.$values?.[0] || 
                           error.error?.message || 
                           'Failed to add place. Please try again.';
        
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage
        });
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  /**
   * Opens the modal
   */
  open() {
    this.isOpen = true;
    this.resetForm();
  }

  /**
   * Closes the modal
   */
  close() {
    this.isOpen = false;
    this.resetForm();
  }

  /**
   * Resets the form to its initial state
   */
  resetForm() {
    this.place = {
      id: '',
      name: '',
      CategoryName: '',
      photo: '/assets/images/defaultplace.png',
      photos: [],
      openTime: '',
      closeTime: '',
      duration: '',
      touristAdult: 0,
      touristStudent: 0,
      egyptianAdult: 0,
      egyptianStudent: 0,
      description: '',
      culturalTips: [],
      Address: '',
      LocationLink: '',
      Latitude: 0,
      Longitude: 0
    };
    
    this.culturalTipsList = [];
    this.loading = false;
  }


  // Track selected category
  onCategoryChange(event: any) {
    console.log('Selected CategoryName:', this.place.CategoryName);
  }
 

  // Method to handle input change manually and log changes
  onTipInputChange(event: string, index: number): void {
    console.log(`Input changed for index ${index}:`, event);
    // Update the specific tip in the array manually
    this.culturalTipsList[index] = event;
    console.log('Updated culturalTipsList:', this.culturalTipsList);
  }

  // Method to add a new cultural tip
  addTip(): void {
    this.culturalTipsList.push('');
    console.log('Added new tip:', this.culturalTipsList);
  }

  // Method to remove a cultural tip
  removeTip(index: number): void {
    this.culturalTipsList.splice(index, 1);
    console.log('Removed tip:', this.culturalTipsList);
  }
  // In your component
trackByFn(index: number, item: any): number {
  return index;
}
}