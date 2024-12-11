import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CityService {
  private apiUrl = 'http://localhost:4200/api/cities'; // Adjust to your backend URL

  constructor(private http: HttpClient) { }

  getCities(): Observable<any> {
    return this.http.get(this.apiUrl);
  }
}
