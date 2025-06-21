import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Review {
  $id?: string;
  id: number;
  reviewID: number;
  userId: string;
  userName: string;
  date: string;
  reviewTitle: string;
  visitorType: string;
  userImageURL: string;
  comment: string;
  rating: number;
  createdAt: string;
  reviewType: string;
  itemName: string;
  activityId?: number;
  placeId?: number;
  itemType?: string;
}

interface ReviewsResponse {
  $id: string;
  $values: Review[];
}

@Injectable({
  providedIn: 'root'
})
export class ReviewsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Fetch all reviews
  getAllReviews(): Observable<Review[]> {
    return this.http.get<ReviewsResponse>(`${this.apiUrl}/api/Admin/reviews`).pipe(
      map(response => response.$values || []),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  // Delete a review
  deleteReview(reviewId: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/Admin/DeleteReview/${reviewId}`).pipe(
      catchError(this.handleError)
    );
  }

  // Get reviews for a specific place
  getReviewsByPlaceId(placeId: string): Observable<Review[]> {
    return this.http.get<ReviewsResponse>(`${this.apiUrl}/api/Admin/reviews/place/${placeId}`).pipe(
      map(response => response.$values || []),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  // Get reviews by a specific user
  getReviewsByUserId(userId: string): Observable<Review[]> {
    return this.http.get<ReviewsResponse>(`${this.apiUrl}/api/Admin/reviews/user/${userId}`).pipe(
      map(response => response.$values || []),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  private handleError(error: any): Observable<never> {
    return throwError(() => error);
  }
} 