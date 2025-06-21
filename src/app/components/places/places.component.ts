import { Component, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddPlaceModalComponent } from '../add-place-modal/add-place-modal.component';
import { DetailsService } from '../../services/details.service';
import { PlacesService } from '../../services/places.service';
import { Place } from '../../models/place.model';
import { PageEvent } from '@angular/material/paginator';
import { MessageService } from 'primeng/api';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Table } from 'primeng/table';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-places',
  templateUrl: './places.component.html',
  styleUrls: ['./places.component.scss']
})
export class PlacesComponent implements OnInit {
  @ViewChild('addPlaceModal') addPlaceModal!: AddPlaceModalComponent;
  @ViewChild('dt1') dt1!: Table;

  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<boolean>();

  Math = Math; 

  totalPlaces: number = 0;
  pageSize: number = 5;
  showSidebar: boolean = false;
  selectedPlace: Place | null = null;
  pagedPlaces: Place[] = [];
  currentPage: number = 0;
  places: Place[] = [];
  isLoading: boolean = true;
  
  // Search functionality
  searchValue: string = '';
  filteredPlaces: Place[] = [];

  constructor(
    public dialog: MatDialog,
    private detailsService: DetailsService,
    private placesService: PlacesService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadPlaces();
  }
  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/images/defaultplace.png';
  }

  loadPlaces() {
    this.isLoading = true;
    this.placesService.fetchPlaces().subscribe({
      next: (response: any) => {
        const places: Place[] = response?.$values ?? [];
        
        // Process places data
        this.places = places.map(place => ({
          ...place,
          imageURLs: {
            $id: '0',
            $values: [place.imageURLs?.$values?.[0] || '/assets/images/defaultplace.png']
          },
          averageRating: place.averageRating || 0
        }));
        
        // Initialize filtered places with all places
        this.filteredPlaces = [...this.places];
        this.totalPlaces = places.length;
        this.updatePagedPlaces();
        
        // Fetch detailed information for each place
        const detailRequests = places.map(place => {
          if (place.placeID) {
            return this.placesService.getPlaceById(place.placeID.toString()).pipe(
              catchError(error => {
                console.error(`Error loading details for place ${place.placeID}:`, error);
                return of(null);
              })
            );
          }
          return of(null);
        });
  
        forkJoin(detailRequests).subscribe(detailedPlaces => {
          detailedPlaces.forEach((detailedPlace, index) => {
            if (detailedPlace && index < this.places.length) {
              this.places[index] = { 
                ...this.places[index], 
                ...detailedPlace,
                imageURLs: {
                  $id: '0',
                  $values: [detailedPlace.imageURLs?.$values?.[0] || this.places[index].imageURLs?.$values?.[0] || '/assets/images/defaultplace.png']
                }
              };
            }
          });
          
          // Update filtered places with detailed information
          this.filteredPlaces = [...this.places];
          this.updatePagedPlaces();
          this.isLoading = false;
        });
      },
      error: (error: Error) => {
        console.error('Error loading places:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load places. Please try again later.'
        });
        this.isLoading = false;
      }
    });
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagedPlaces();
  }

  updatePagedPlaces() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedPlaces = this.filteredPlaces.slice(startIndex, endIndex);
    this.totalPlaces = this.filteredPlaces.length;
  }
  
  onSearch() {
    this.filterPlaces();
  }
  
  clearSearch() {
    this.searchValue = '';
    if (this.dt1) {
      this.dt1.filterGlobal('', 'contains');
    }
  }

  openAddPlaceModal() {
    if (this.addPlaceModal) {
      this.addPlaceModal.open();
    }
  }

  onPlaceAdded(place: Place) {
    this.placesService.createPlace(place).subscribe({
      next: (response: any) => {
        // Refresh the places list to get the updated data
        this.loadPlaces();
        
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Place added successfully'
        });
      },
      error: (error: Error) => {
        console.error('Error adding place:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to add place. Please try again.'
        });
      }
    });
  }

  getStars(rating: number): string[] {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(i < rating ? '★' : '☆');
    }
    return stars;
  }

  onViewPlace(place: Place) {
    this.isLoading = true;
    
    if (!place.placeID) {
      console.error('Cannot view place: placeID is undefined');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Cannot view place: Missing place ID'
      });
      this.isLoading = false;
      return;
    }
    
    // Set the selected place immediately to ensure the placeID is available
    this.selectedPlace = place;
    this.showSidebar = true;
    
    // Then fetch the detailed place data
    const placeId = place.placeID.toString();
    this.placesService.getPlaceById(placeId).subscribe({
      next: (response: any) => {
        const detailedPlace = response;
        this.selectedPlace = detailedPlace;
        this.detailsService.openPlaceDetails(detailedPlace);
        this.isLoading = false;
      },
      error: (error: Error) => {
        console.error('Error fetching place details:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load place details. Please try again.'
        });
        this.isLoading = false;
      }
    });
  }

  onPlaceDeleted(placeId: string) {
    // Remove the deleted place from the local arrays
    this.places = this.places.filter(place => place.placeID?.toString() !== placeId);
    this.filteredPlaces = this.filteredPlaces.filter(place => place.placeID?.toString() !== placeId);
    
    // Update the paged places
    this.updatePagedPlaces();
    
    // Show success message
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Place deleted successfully'
    });
    
    // Close the sidebar
    this.closeSidebar();
  }

  onPlaceUpdated() {
    this.loadPlaces();
  }

  closeSidebar() {
    this.showSidebar = false;
    this.selectedPlace = null;
    this.detailsService.closeDetails();
    this.isOpenChange.emit(false); // Notify parent that sidebar is closed
  }

  filterPlaces() {
    if (!this.searchValue) {
      this.filteredPlaces = this.places;
      return;
    }

    const searchTermLower = this.searchValue.toLowerCase();
    this.filteredPlaces = this.places.filter(place =>
      place.name.toLowerCase().includes(searchTermLower) ||
      place.description.toLowerCase().includes(searchTermLower) ||
      place.categoryName.toLowerCase().includes(searchTermLower)
    );
  }

  onCategoryChange() {
    this.filterPlaces();
  }

  deletePlace(place: Place) {
    if (!place.placeID) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Cannot delete place: Missing place ID'
      });
      return;
    }

    const placeId = place.placeID.toString();
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${place.name}?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.placesService.deletePlace(placeId).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Place deleted successfully'
            });
            this.loadPlaces();
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
}
