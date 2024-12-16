import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})

export class WebService {
  pageSize: number = 10;
  private apiUrl = 'http://localhost:2000/api';
  
  constructor(private http: HttpClient) {}

  // Get places for any city with filters
  getPlaces(cityId: string, page: number = 1, filters: any = {}): Observable<any> {
    let url = `${this.apiUrl}/cities/${cityId}/places`;
    
    // Build query parameters
    const params = new URLSearchParams({
      pn: page.toString(),
      ps: this.pageSize.toString()
    });

    // Add type filter
    if (filters.type && filters.type !== 'all') {
      params.append('type', filters.type);
    }

    // Add rating filter
    if (filters.min_rating !== undefined && filters.min_rating > 0) {
      params.append('min_rating', filters.min_rating.toString());
    }

    // Add meal filter
    if (filters.selectedMeal && filters.selectedMeal !== 'all') {
      params.append(filters.selectedMeal, 'true');
    }

    // Add sorting
    if (filters.sortBy) {
      params.append('sort_by', filters.sortBy);
      if (filters.sortDirection) {
        params.append('sort_order', filters.sortDirection);
      }
    }

    // Append query parameters to URL
    url = `${url}?${params.toString()}`;
    console.log(`Making API call to: ${url}`); // For debugging api url
    return this.http.get<any>(url);
  }

  // Get a specific place
  getPlace(cityId: string, placeId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/cities/${cityId}/places/${placeId}`);
  }

  // Get reviews for a place
  getReviews(cityId: string, placeId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/cities/${cityId}/places/${placeId}/reviews`);
  }

  // Post a new review
  postReview(cityId: string, placeId: string, review: any): Observable<any> {
    const formData = new FormData();
    formData.append("username", review.username);
    formData.append("comment", review.comment);
    formData.append("stars", review.stars);
    
    return this.http.post<any>(
      `${this.apiUrl}/cities/${cityId}/places/${placeId}/reviews`, 
      formData
    );
  }

  // Get all cities (if needed)
  getCities(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/cities`);
  }

  /*
  getBusinesses(page: number, cityId: string) {
    return this.http.get(`${this.apiUrl}/cities/${cityId}/places`, {
      params: {
        page: page.toString()
      }
    });
  }

  
  getPlaces(cityId: string) {
    return this.http.get(`${this.apiUrl}/cities/${cityId}/places`);
  }

  getPlace(cityId: string, placeId: string) {
    return this.http.get(`${this.apiUrl}/cities/${cityId}/places/${placeId}`);
  }
  */
}
  /*
  getPlaces(cityName: string, page: number) {
    return this.http.get<any>(
        `${this.baseUrl}/cities/${cityName}/places?pn=${page}&ps=${this.pageSize}`
    );
}

  getPlace(cityName: string, placeId: string) {
      return this.http.get<any>(
          `${this.baseUrl}/cities/${cityName}/places/${placeId}`
      );
  }
  */
