
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})

export class WebService {

  pageSize: number = 10;
  private apiUrl = 'http://localhost:2000/api';
  
  constructor(private http: HttpClient) {}


  getBusinesses(page: number, cityId: string) {
    return this.http.get(`${this.apiUrl}/cities/${cityId}/places`, {
      params: {
        page: page.toString()
      }
    });
  }

  /*
  getPlaces(cityId: string) {
    return this.http.get(`${this.baseUrl}/cities/${cityId}/places`);
  }

  getPlace(cityId: string, placeId: string) {
    return this.http.get(`${this.baseUrl}/cities/${cityId}/places/${placeId}`);
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
