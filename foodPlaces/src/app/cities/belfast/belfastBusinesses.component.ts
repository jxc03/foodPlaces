import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { DataService } from '../../data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebService } from '../../web.service';

@Component({
  selector: 'belfastBusinesses',
  imports: [RouterOutlet, RouterModule, CommonModule, FormsModule],
  providers: [DataService, WebService],
  templateUrl: './belfastBusinesses.component.html',
  styleUrls: ['./belfastBusinesses.component.css']
})


export class BelfastBusinessesComponent {
  business_list: any = null;
  page: number = 1;
  //cityId: string = 'c_bel';
  cityId: string = '67267637aeb441ea7afa21da';
  filteredPlaces: any[] = [];
  loading: boolean = false;
  error: string | null = null;

  // Filters
  selectedType: string = 'all';
  selectedMeal: string = 'all';
  minRating: number = 0;
  sortBy: string = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(public dataService: DataService, private webService: WebService) { }

  /*
  ngOnInit() {
    if (sessionStorage['page']) {
      this.page = Number(sessionStorage['page']); 
      
    }

    // this.business_list = this.dataService.getBusinesses(this.page, this.cityId);
    this.loading = true;

    this.webService.getBusinesses(this.page, this.cityId).subscribe({
      next: (data) => {
        // Make sure data has the expected structure
        this.business_list = [data]; // No need to wrap in array as API already returns array
        this.applyFiltersAndSort();
        console.log('Raw data:', this.business_list);
        console.log('Places array:', this.business_list?.[0]?.places);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching businesses:', error);
        this.loading = false;
      }
    });
  }

    //this.applyFiltersAndSort();
    //console.log('Raw data:', this.business_list);
    //console.log('Places array:', this.business_list?.places);
  //}

  applyFiltersAndSort() {
    console.log('Starting applyFiltersAndSort');
    console.log('Current business_list:', this.business_list);

    if (!this.business_list?.[0]?.places) {
      console.log('No business_list or places found');
      this.filteredPlaces = [];
      return;
    }

    // Since business_list is an array and places is inside the first object
    //let places = [...this.business_list[0].places];
    //console.log('Initial places:', places);
    
  let places = [...(this.business_list[0].places || [])];
  
  places = places.filter((place: any) => {
    const typeMatch = this.selectedType === 'all' || 
                   (place?.info?.type || []).includes(this.selectedType);
    const ratingMatch = (place?.ratings?.average_rating || 0) >= this.minRating;
    const mealMatch = this.selectedMeal === 'all' || 
                   place?.service_options?.meals?.[this.selectedMeal] === true;
    
    return typeMatch && ratingMatch && mealMatch;
  });

  console.log('Filtered places:', places);

    // Apply sorting
  places.sort((a: any, b: any) => {
    let compareValue = 0;
    if (this.sortBy === 'name') {
      compareValue = (a?.info?.name || '').localeCompare(b?.info?.name || '');
    } else if (this.sortBy === 'rating') {
      const ratingA = a?.ratings?.average_rating || 0;
      const ratingB = b?.ratings?.average_rating || 0;
      compareValue = ratingB - ratingA;
    }
    return this.sortDirection === 'asc' ? compareValue : -compareValue;
  });
  console.log('Sorted places:', places);
  this.filteredPlaces = places;
  }

  updateFilter() {
    this.applyFiltersAndSort();
  }

  updateSort(sortBy: string) {
    if (this.sortBy === sortBy) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndSort();
  }

  previousPage() { 
    if (this.page > 1) {
      this.page = this.page - 1;
      sessionStorage['page'] = this.page;
      
      this.loading = true;
      this.webService.getBusinesses(this.page, this.cityId).subscribe({
        next: (data) => {
          this.business_list = data;
          this.applyFiltersAndSort();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching businesses:', error);
          this.loading = false;
        }
      });
    }
  } 
    /*
    if (this.page > 1){
      this.page = this.page - 1 
      sessionStorage['page'] = this.page;
      this.business_list = this.dataService.getBusinesses(this.page, this.cityId);
      this.applyFiltersAndSort();
    }
    */

    /*
  nextPage() { 
    if (this.page < this.dataService.getLastPageNumber()) {
      this.page = this.page + 1;
      sessionStorage['page'] = this.page;
      
      this.loading = true;
      this.webService.getBusinesses(this.page, this.cityId).subscribe({
        next: (data) => {
          this.business_list = data;
          this.applyFiltersAndSort();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching businesses:', error);
          this.loading = false;
        }
      });
    }
  }
  /*
    if (this.page < this.dataService.getLastPageNumber()){
      this.page = this.page + 1 
      sessionStorage['page'] = this.page;
      this.business_list = this.dataService.getBusinesses(this.page, this.cityId);
      this.applyFiltersAndSort();
    }
    */
}

/*
styleUrl to styleUrls ['...'] to fix error after putting each city in their own folder
*/