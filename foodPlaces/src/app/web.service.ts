/**
 * For handling API requests related to cities, places, and reviews
 * Interacts with a backend API to perform CRUD operations
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})

export class WebService {
  // Number of items per page for pagination
  pageSize: number = 10; // Default page size

  // Backend API base URL
  private apiUrl = 'http://localhost:2000/api';
  
  constructor(private http: HttpClient) {}

  /**
   * Get a list of places with optional pagination and filtering
   * @param cityId ID of the city to fetch places from
   * @param page Page number for pagination
   * @param filters Filters for places (type, rating, meal preferences, sorting)
   * @returns the list of places
   */
  getPlaces(cityId: string, page: number = 1,  filters: any = {}): Observable<any> {
    let url = `${this.apiUrl}/cities/${cityId}/places`; // Backend url to get all places from a city

    // Query parameters
    const params = new URLSearchParams({
      pn: page.toString(), // Page number
      ps: this.pageSize.toString() // Page size
    });
 
    // Type filters
    if (filters.type && filters.type !== 'all') { // Default to all
      params.append('type', filters.type); // Filter by type
    }

    // Rating filters
    if (filters.min_rating !== undefined && filters.min_rating > 0) {
      params.append('min_rating', filters.min_rating.toString()); // Minimum rating filter
    }

    // Meal filters
    if (filters.selectedMeal && filters.selectedMeal !== 'all') {
      params.append(filters.selectedMeal, 'true'); // Meal preference filter
    }

    // Sort
    if (filters.sortBy) {
      params.append('sort_by', filters.sortBy); // Sorting field
      if (filters.sortDirection) {
        params.append('sort_order', filters.sortDirection); // Sorting direction
      }
    }

    // Append query parameters to URL
    url = `${url}?${params.toString()}`;
    console.log(`Making API call to: ${url}`); // To help debug API URL 
    return this.http.get<any>(url); // Perform HTTP GET request
  }

  /**
   * Get a list of places with optional pagination and filtering
   * @param cityId ID of the city containing the place
   * @param placeId ID of the place to get
   * @returns place details
   */
  getPlace(cityId: string, placeId: string): Observable<any> {
    console.log('Making API request to:', `${this.apiUrl}/cities/${cityId}/places/${placeId}`); // Endpoint for specific place
    return this.http.get<any>(`${this.apiUrl}/cities/${cityId}/places/${placeId}`); // Perform HTTP GET request
  }

  deletePlace(cityId: string, placeId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/cities/${cityId}/places/${placeId}`);
  }

  // Get the reviews of a place
  getPlaceReviews(cityId: string, placeId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/cities/${cityId}/places/${placeId}/reviews`);
  }


  // Delete a review
  deleteReview(cityId: string, businessId: string, reviewId: string): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/cities/${cityId}/places/${businessId}/reviews/${reviewId}`
      );
  }

  // Post a new review
  postReview(businessId: string, review: any, cityId: string): Observable<any> {
    const reviewData = {
      author_name: review.author_name,
      content: review.content,
      rating: Number(review.rating),
      userEmail: review.userEmail
    };
    
    return this.http.post<any>(
      `${this.apiUrl}/cities/${cityId}/places/${businessId}/reviews`,
      reviewData
    );
  }

  // Edit an existing review
  editReview(businessId: string, reviewId: string, reviewData: any, cityId: string): Observable<any> {
    const updateData = {
      author_name: reviewData.author_name,
      content: reviewData.content,
      rating: Number(reviewData.rating),
      userEmail: reviewData.userEmail
    };

    return this.http.put<any>(
      `${this.apiUrl}/cities/${cityId}/places/${businessId}/reviews/${reviewId}`,
      updateData
    );
  }
}


  /*
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
      `${this.apiUrl}/api/cities/${cityId}/places/${placeId}/reviews`, 
      formData
    );
  }
  */
