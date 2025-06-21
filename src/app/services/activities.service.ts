import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEventType, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, map, filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Activity } from '../models/activity.model';

interface ActivitiesResponse {
  $id: string;
  $values: Activity[];
}

@Injectable({
  providedIn: 'root'
})
export class ActivitiesService {
  private apiUrl = 'https://kemet-server.runasp.net/api';
  private uploadProgress = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient) {}

  // Add a getter for the upload progress
  getUploadProgress(): Observable<number> {
    return this.uploadProgress.asObservable();
  }

  // Fetch all activities
  fetchActivities(): Observable<Activity[]> {
    return this.http.get<any>(`${this.apiUrl}/Admin/GetAllActivities`).pipe(
      map(response => {
        let activities: Activity[];
        if (Array.isArray(response)) {
          activities = response;
        } else if (response && response.$values) {
          activities = response.$values;
        } else {
          activities = [];
        }
        
        // Map and preserve original fee values
        return activities.map(activity => ({
          ...activity,
          openTime: activity.openTime || '09:00:00',
          closeTime: activity.closeTime || '17:00:00',
          egyptianAdult: activity.egyptianAdult,
          egyptianStudent: activity.egyptianStudent,
          touristAdult: activity.touristAdult,
          touristStudent: activity.touristStudent,
          groupSize: activity.groupSize || 0,
          duration: activity.duration || 'Not specified'
        }));
      }),
      catchError(this.handleError)
    );
  }

  // Fetch activity by ID
  getActivityById(id: string): Observable<Activity> {
    const url = `${this.apiUrl}/Activities/GetActivityByID?ActivityID=${id}`;

    return this.http.get<any>(url).pipe(
      map(response => {
        if (!response) {
          throw new Error('Activity not found');
        }

        // Handle cultural tips - ensure it's an array
        let culturalTips: string[] = [];
        if (response.culturalTips) {
          if (Array.isArray(response.culturalTips)) {
            culturalTips = response.culturalTips;
          } else if (typeof response.culturalTips === 'string') {
            culturalTips = response.culturalTips.split(',').map((tip: string) => tip.trim()).filter((tip: string) => tip.length > 0);
          }
        }

        const activity = {
          ...response,
          // Ensure all numeric values are properly converted
          activityId: response.Id || response.activityId,
          Id: response.Id || response.activityId,
          groupSize: Number(response.groupSize) || 0,
          averageRating: Number(response.averageRating) || 0,
          ratingsCount: Number(response.ratingsCount) || 0,
          egyptianAdult: Number(response.egyptianAdult || response.EgyptianAdultCost) || 0,
          egyptianStudent: Number(response.egyptianStudent || response.EgyptianStudentCost) || 0,
          touristAdult: Number(response.touristAdult || response.TouristAdultCost) || 0,
          touristStudent: Number(response.touristStudent || response.TouristStudentCost) || 0,
          // Set the processed cultural tips
          culturalTips: culturalTips,
          // Handle the nested $values arrays
          imageURLs: {
            $values: response.imageURLs?.$values || []
          },
          reviews: {
            $values: response.reviews?.$values || []
          }
        };

        return activity;
      }),
      catchError(error => {
        let errorMessage = 'Failed to load activity details';
        
        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // Server-side error
          if (error.status === 404) {
            errorMessage = 'Activity not found';
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  // Update activity
  updateActivity(id: string, formData: FormData): Observable<any> {
    const headers = {
      'Accept': 'application/json'
    };

    return this.http.put(`${this.apiUrl}/Admin/editactivity/${id}`, formData, {
      headers,
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const progress = Math.round(100 * (event.loaded / event.total));
          this.uploadProgress.next(progress);
          return null;
        }
        if (event.type === HttpEventType.Response) {
          const response = event as HttpResponse<any>;
          console.log('Server response:', response.body);
          return response.body;
        }
        return null;
      }),
      filter((response): response is any => response !== null),
      catchError(error => {
        console.error('Error updating activity:', error);
        let errorMessage = 'Failed to update activity';
        
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 0) {
          errorMessage = 'Cannot connect to server. Please check your connection.';
        } else if (error.status === 408) {
          errorMessage = 'Request timed out. Please try again or reduce image sizes.';
        } else if (error.status === 400) {
          errorMessage = 'Invalid data submitted';
          if (error.error?.errors) {
            errorMessage += ': ' + Object.values(error.error.errors).join(', ');
          }
        } else if (error.status === 401) {
          errorMessage = 'Unauthorized - please log in again';
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  // Delete activity
  deleteActivity(activityId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Admin/DeleteActivity/${activityId}`).pipe(
      catchError(this.handleError)
    );
  }

  // Add activity with FormData
  addActivity(formData: FormData): Observable<Activity> {
    const headers = {
      'Accept': 'application/json'
    };

    interface ApiResponse {
      $id: string;
      message: string;
      data: Activity;
    }

    // Add progress tracking
    return this.http.post<ApiResponse>(
      `${this.apiUrl}/Admin/AddActivity`, 
      formData,
      {
        headers,
        reportProgress: true,
        observe: 'events'
      }
    ).pipe(
      map((event: HttpEvent<ApiResponse>) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const progress = Math.round(100 * (event.loaded / event.total));
          this.uploadProgress.next(progress);
          return null;
        }
        if (event.type === HttpEventType.Response) {
          const response = event as HttpResponse<ApiResponse>;
          console.log('Server response:', response.body);
          return response.body?.data;
        }
        return null;
      }),
      filter((response): response is Activity => response !== null),
      catchError(error => {
        console.error('Error adding activity:', error);
        let errorMessage = 'Failed to add activity';
        
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 0) {
          errorMessage = 'Cannot connect to server. Please check your connection.';
        } else if (error.status === 408) {
          errorMessage = 'Request timed out. Please try again or reduce image sizes.';
        } else if (error.status === 400) {
          errorMessage = 'Invalid data submitted';
        } else if (error.status === 401) {
          errorMessage = 'Unauthorized - please log in again';
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Upload images for an activity
   * @param activityId The ID of the activity
   * @param formData FormData containing the images
   * @returns Observable with the response
   */
  uploadImages(activityId: string, formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/activities/${activityId}/images`, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    // Default error message
    let errorMessage = 'An unexpected error occurred';
    let errorDetails = '';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.status === 0) {
        errorMessage = 'Server is not responding. Please check your connection.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 404) {
        errorMessage = 'Resource not found';
      } else if (error.status === 400) {
        errorMessage = 'Invalid request';
        if (error.error?.errors) {
          errorDetails = Object.values(error.error.errors).join(', ');
        }
      } else if (error.status === 401) {
        errorMessage = 'Unauthorized';
      } else if (error.status === 403) {
        errorMessage = 'Access denied';
      } else if (error.status >= 500) {
        errorMessage = 'Server error';
      }
    }

    return throwError(() => new Error(errorDetails || errorMessage));
  }
}
