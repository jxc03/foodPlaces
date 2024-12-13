
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

  getPlace(cityName: string, placeId: string) {
    return this.http.get<any>(
        `${this.baseUrl}/cities/${cityName}/places/${placeId}`
    );
  } 


  getCity(cityName: string) {
      return this.http.get<any>(
          `${this.baseUrl}/cities/${cityName}`
      );
  }

}
