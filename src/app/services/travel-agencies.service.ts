import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Agency } from '../models/agency.model';

interface AgencyApiResponse {
  id: string;
  userName: string;
  email: string;
  phoneNumber: string;
  address: string;
  description: string;
  facebookURL: string;
  instagramURL: string;
  bio: string;
  profileURl: string;
  backgroundURL: string;
  averageRating: number;
  taxNumber?: string;
}

interface ApiResponse {
  $id: string;
  $values: AgencyApiResponse[];
}

@Injectable({
  providedIn: 'root'
})
export class TravelAgenciesService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAllAgencies(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/api/Admin/GetAllTravelAgencies`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred while fetching travel agencies';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    console.error('Error details:', error);
    return throwError(() => new Error(errorMessage));
  }

  mapApiResponseToAgency(apiResponse: AgencyApiResponse): Agency {
    return {
      id: apiResponse.id,
      agencyName: apiResponse.userName,
      profileImage: apiResponse.profileURl || 'assets/images/default-avatar.svg',
      phoneNumber: apiResponse.phoneNumber,
      email: apiResponse.email,
      website: apiResponse.facebookURL || '',
      location: apiResponse.address || '',
      description: apiResponse.description || apiResponse.bio || '',
      numberOfPackages: 0,
      rate: apiResponse.averageRating || 0,
      joinedOn: new Date(),
      bio: apiResponse.bio || '',
      facebookURL: apiResponse.facebookURL || '',
      instagramURL: apiResponse.instagramURL || '',
      backgroundURL: apiResponse.backgroundURL || '',
      taxNumber: apiResponse.taxNumber || ''
    };
  }
} 