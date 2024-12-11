/*
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebService {
  private apiUrl = 'http://localhost:5000/api/cities';
  pageSize: number = 10;

  constructor(private http: HttpClient) {}

  // Fetch cities with pagination, filtering, and sorting
  getCities(page: number, name: string = '', sortBy: string = 'city_name', sortOrder: string = 'asc'): Observable<any> {
    let params = new HttpParams()
      .set('pn', page.toString())
      .set('ps', this.pageSize.toString())
      .set('sort_by', sortBy)
      .set('sort_order', sortOrder);

    if (name) {
      params = params.set('name', name);
    }

    return this.http.get(this.apiUrl, { params });
  }
}
*/