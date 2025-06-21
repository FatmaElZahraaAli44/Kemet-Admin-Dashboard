import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Place } from '../models/place.model';

@Injectable({
  providedIn: 'root'
})
export class PlacesService {
  private apiUrl = 'https://kemet-server.runasp.net';

  constructor(private _HttpClient: HttpClient) { }

  // Fetch all places
  fetchPlaces(): Observable<any> {
    return this._HttpClient.get(`${this.apiUrl}/api/Admin/GetAllPlaces`).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  // Fetch place by ID
  getPlaceById(id: string): Observable<any> {
    const url = `${this.apiUrl}/api/places/GetPlaceByID?PlaceID=${id}`;
    
    return this._HttpClient.get(url).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  // Fetch all places with complete details
  fetchPlacesWithDetails(): Observable<any> {
    return this._HttpClient.get(`${this.apiUrl}/api/places/GetAllPlacesWithDetails`).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  // Create a new place
  createPlace(place: Place): Observable<any> {
    return this._HttpClient.post(`${this.apiUrl}/api/Admin/AddPlace`, place).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  // Update a place
  updatePlace(placeID: string, formData: FormData): Observable<any> {
    const url = `${this.apiUrl}/api/Admin/editplace/${placeID}`;

    // Ensure PlaceID in form data matches the URL parameter
    formData.set('PlaceID', placeID);

    return this._HttpClient.put(url, formData, {
      reportProgress: true,
    }).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  // Delete a place by ID
  deletePlace(id: string): Observable<any> {
    const url = `${this.apiUrl}/api/Admin/DeletePlace/${id}`;
    return this._HttpClient.delete(url).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
}

export { Place };
