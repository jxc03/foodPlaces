
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})

export class WebService {
  pageSize: number = 10;
  private baseUrl = 'http://localhost:2000/api';
  
  constructor(private http: HttpClient) {}

  getPlaces(cityId: string) {
    return this.http.get(`${this.baseUrl}/cities/${cityId}/places`);
  }

  getPlace(cityId: string, placeId: string) {
    return this.http.get(`${this.baseUrl}/cities/${cityId}/places/${placeId}`);
  }
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
