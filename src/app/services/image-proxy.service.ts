import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImageProxyService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Fetches an image as a blob
   * @param imageUrl The image URL
   * @returns Observable with the image blob
   */
  getImageAsBlob(imageUrl: string): Observable<Blob> {
    // If the URL is already a relative path, use it directly
    if (imageUrl.startsWith('/')) {
      return this.http.get(imageUrl, {
        responseType: 'blob',
        headers: {
          'Accept': 'image/jpeg,image/png,image/gif,image/webp'
        }
      }).pipe(
        catchError(error => {
          console.error('Error fetching image:', error);
          return of(this.createPlaceholderBlob());
        })
      );
    }
    
    // If the URL is from our API domain, extract the path and use it directly
    if (imageUrl.startsWith(this.apiUrl)) {
      const path = imageUrl.substring(this.apiUrl.length);
      return this.http.get(path, {
        responseType: 'blob',
        headers: {
          'Accept': 'image/jpeg,image/png,image/gif,image/webp'
        }
      }).pipe(
        catchError(error => {
          console.error('Error fetching image:', error);
          return of(this.createPlaceholderBlob());
        })
      );
    }

    // For external URLs, use a data URL approach
    console.log('Using data URL approach for external image:', imageUrl);
    return of(this.createPlaceholderBlob('External image not available'));
  }

  /**
   * Converts an image URL to a File object
   * @param imageUrl The image URL to convert
   * @returns Promise that resolves to a File object
   */
  async urlToFile(imageUrl: string): Promise<File | null> {
    try {
      // Extract filename from URL or generate a default one
      const filename = imageUrl.split('/').pop() || `image-${Date.now()}.jpg`;
      
      // Get the image as a blob
      const blob = await this.getImageAsBlob(imageUrl).toPromise();
      
      if (blob) {
        // Create a File object from the blob
        return new File([blob], filename, { 
          type: blob.type || 'image/jpeg',
          lastModified: Date.now()
        });
      }
      
      return this.createPlaceholderFile(filename);
    } catch (error) {
      console.error('Error converting URL to file:', error);
      const filename = imageUrl.split('/').pop() || `image-${Date.now()}.jpg`;
      return this.createPlaceholderFile(filename);
    }
  }

  /**
   * Creates a placeholder image when the original image cannot be loaded
   * @param filename The filename for the placeholder
   * @param message The message to display in the placeholder
   * @returns A File object containing the placeholder image
   */
  createPlaceholderFile(filename: string, message: string = 'Image not available'): File {
    const blob = this.createPlaceholderBlob(message);
    return new File([blob], filename, { 
      type: 'image/svg+xml',
      lastModified: Date.now()
    });
  }

  /**
   * Creates a placeholder image blob
   * @param message The message to display in the placeholder
   * @returns A Blob containing the placeholder SVG
   */
  private createPlaceholderBlob(message: string = 'Image not available'): Blob {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="100%" height="100%" fill="#f5f5f5"/>
      <text x="50%" y="50%" font-family="Arial" font-size="12" fill="#666" text-anchor="middle" dominant-baseline="middle">${message}</text>
    </svg>`;
    
    return new Blob([svg], { type: 'image/svg+xml' });
  }
} 