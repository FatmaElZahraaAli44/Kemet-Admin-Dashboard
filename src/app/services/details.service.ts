import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Place } from '../models/place.model';
import { Customer } from '../models/customer.model';
import { Activity } from '../models/activity.model';
import { MessageService } from 'primeng/api';
import { Agency } from '../models/agency.model';
import { HttpClient } from '@angular/common/http';
import { tap, map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { throwError } from 'rxjs';
import { ActivitiesService } from './activities.service';

@Injectable({
  providedIn: 'root'
})
export class DetailsService {
  // Place details
  private placeSubject = new BehaviorSubject<Place | null>(null);
  private activitySubject = new BehaviorSubject<Activity | null>(null);
  place$: Observable<Place | null> = this.placeSubject.asObservable();
  activity$: Observable<Activity | null> = this.activitySubject.asObservable();

  // Customer details
  private customerSubject = new BehaviorSubject<Customer | null>(null);
  customer$ = this.customerSubject.asObservable();

  // Shared state
  private isOpenSubject = new BehaviorSubject<boolean>(false);
  isOpen$: Observable<boolean> = this.isOpenSubject.asObservable();

  private isEditingSubject = new BehaviorSubject<boolean>(false);
  isEditing$: Observable<boolean> = this.isEditingSubject.asObservable();

  private agencyDetailsSubject = new BehaviorSubject<Agency | null>(null);
  agencyDetails$ = this.agencyDetailsSubject.asObservable();

  private selectedActivitySubject = new BehaviorSubject<Activity | null>(null);
  selectedActivity$ = this.selectedActivitySubject.asObservable();

  constructor(
    private messageService: MessageService,
    private http: HttpClient,
    private activitiesService: ActivitiesService
  ) {}

  // Place methods
  openPlaceDetails(place: Place) {
    this.placeSubject.next(place);
    this.customerSubject.next(null); // Clear customer when showing place
    this.isOpenSubject.next(true);
    this.isEditingSubject.next(false);
  }

  openActivityDetails(activity: Activity) {
    this.activitySubject.next(activity);
    this.selectedActivitySubject.next(activity);
    this.isOpenSubject.next(true);
    this.isEditingSubject.next(false);
  }

  savePlace(place: Place): Observable<void> {
    return new Observable<void>(observer => {
      setTimeout(() => {
        this.placeSubject.next(place);
        this.isEditingSubject.next(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Place saved successfully'
        });
        observer.next();
        observer.complete();
      }, 500);
    });
  }

  deletePlace(placeId: string): Observable<void> {
    return new Observable<void>(observer => {
      setTimeout(() => {
        this.placeSubject.next(null);
        this.isOpenSubject.next(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Place deleted successfully'
        });
        observer.next();
        observer.complete();
      }, 500);
    });
  }

  // Customer methods
  checkApiAccessibility(): Observable<any> {
    const url = `${environment.apiUrl}/api/health`;
    return this.http.get(url).pipe(
      catchError(error => {
        return throwError(() => new Error('API is not accessible'));
      })
    );
  }

  testApiEndpoint(): Observable<any> {
    const url = `${environment.apiUrl}/api/test`;
    return this.http.get(url).pipe(
      catchError(error => {
        return throwError(() => new Error('API test failed'));
      })
    );
  }

  getAllCustomers(): Observable<Customer[]> {
    const url = `${environment.apiUrl}/api/Admin/GetAllCustomers`;
    return this.http.get<any>(url).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        } else if (response && response.$values) {
          return response.$values;
        }
        return [];
      }),
      catchError(error => {
        return throwError(() => new Error('Failed to fetch customers'));
      })
    );
  }

  openCustomerDetails(customer: Customer) {
    this.customerSubject.next(customer);
    this.placeSubject.next(null); // Clear place when showing customer
    this.isOpenSubject.next(true);
    this.isEditingSubject.next(false);
  }

  saveCustomer(customer: Customer): Observable<void> {
    return new Observable<void>(observer => {
      setTimeout(() => {
        this.customerSubject.next(customer);
        this.isEditingSubject.next(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Customer saved successfully'
        });
        observer.next();
        observer.complete();
      }, 500);
    });
  }

  deleteCustomer(): Observable<void> {
    return new Observable<void>(observer => {
      setTimeout(() => {
        this.customerSubject.next(null);
        this.isOpenSubject.next(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Customer deleted successfully'
        });
        observer.next();
        observer.complete();
      }, 500);
    });
  }

  // Shared methods
  startEditing() {
    this.isEditingSubject.next(true);
  }

  cancelEditing() {
    this.isEditingSubject.next(false);
  }

  closeDetails() {
    this.placeSubject.next(null);
    this.activitySubject.next(null);
    this.customerSubject.next(null);
    this.isOpenSubject.next(false);
    this.isEditingSubject.next(false);
  }

  saveActivity(activity: Activity): Observable<void> {
    return new Observable<void>(observer => {
      setTimeout(() => {
        this.activitySubject.next(activity);
        this.isEditingSubject.next(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Activity saved successfully'
        });
        observer.next();
        observer.complete();
      }, 500);
    });
  }

  deleteActivity(id: string): Observable<void> {
    return this.activitiesService.deleteActivity(id);
  }

  openAgencyDetails(agency: Agency) {
    this.agencyDetailsSubject.next(agency);
    this.placeSubject.next(null); // Clear place when showing agency
    this.isOpenSubject.next(true);
    this.isEditingSubject.next(false);
  }

  closeAgencyDetails() {
    this.agencyDetailsSubject.next(null);
    this.isOpenSubject.next(false);
  }

  saveAgency(agency: Agency): Observable<void> {
    return new Observable<void>(observer => {
      setTimeout(() => {
        this.agencyDetailsSubject.next(agency);
        this.isEditingSubject.next(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Agency saved successfully'
        });
        observer.next();
        observer.complete();
      }, 500);
    });
  }

  deleteAgency(): Observable<void> {
    return new Observable<void>(observer => {
      setTimeout(() => {
        this.agencyDetailsSubject.next(null);
        this.isOpenSubject.next(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Agency deleted successfully'
        });
        observer.next();
        observer.complete();
      }, 500);
    });
  }

  // Activity methods
  getAllActivities(): Observable<Activity[]> {
    return this.http.get<any>(`${environment.apiUrl}/api/Admin/GetAllActivities`).pipe(
      map(activities => {
        if (Array.isArray(activities)) {
          return activities;
        } else if (activities && activities.$values) {
          return activities.$values;
        }
        return [];
      }),
      catchError(error => {
        return throwError(() => new Error('Failed to fetch activities'));
      })
    );
  }

  createActivity(formData: FormData): Observable<Activity> {
    return this.activitiesService.addActivity(formData);
  }

  updateActivity(id: string, activity: Activity): Observable<Activity> {
    return this.http.put<Activity>(`${environment.apiUrl}/activities/${id}`, activity);
  }

  getActivityById(id: string): Observable<Activity> {
    return this.activitiesService.getActivityById(id).pipe(
      tap(activity => {
        // Update the activity subject with the fetched data
        this.activitySubject.next(activity);
      })
    );
  }

  private handleError(error: any) {
    console.error('Error handling:', error);
    return throwError(() => new Error('Error handling'));
  }
} 