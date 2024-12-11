/*
// ==================== Cities Component ====================
// CitiesComponent TypeScript (cities.component.ts)
import { Component, OnInit } from '@angular/core';
import { WebService } from './web.service';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DataService } from './data.service';

@Component({
  selector: 'app-cities',
  imports: [RouterOutlet, CommonModule],
  providers: [DataService, WebService],
  templateUrl: './cities.component.html',
})

export class CitiesComponent implements OnInit {
  cities: any[] = [];
  pagination: any;
  searchName: string = '';
  currentPage: number = 1;
  sortBy: string = 'city_name';
  sortOrder: string = 'asc';

  constructor(private webService: WebService) {}

  ngOnInit() {
    this.loadCities();
  }

  loadCities() {
    this.webService
      .getCities(this.currentPage, this.searchName, this.sortBy, this.sortOrder)
      .subscribe(
        (data) => {
          this.cities = data.cities;
          this.pagination = data.pagination;
        },
        (error) => {
          console.error('Error fetching cities:', error);
        }
      );
  }

  sort(field: string) {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'asc';
    }
    this.loadCities();
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadCities();
    }
  }

  nextPage() {
    if (this.pagination && this.currentPage < this.pagination.total_pages) {
      this.currentPage++;
      this.loadCities();
    }
  }
}
*/