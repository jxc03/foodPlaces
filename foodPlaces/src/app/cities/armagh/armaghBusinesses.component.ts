import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { DataService } from '../../data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebService } from '../../web.service';

@Component({
  selector: 'armaghBusinesses',
  imports: [RouterOutlet, CommonModule, RouterModule, FormsModule],
  providers: [DataService, WebService],
  templateUrl: './armaghBusinesses.component.html',
  styleUrls: ['./armaghBusinesses.component.css']
})


export class ArmaghBusinessesComponent {
  business_list: any = [];
  filteredPlaces: any[] = [];
  /*cityId: string = 'c_armagh';*/
  /*cityId: string = 'armagh';*/
  page: number = 1;


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
    
    const cityData = this.dataService.getBusinesses(this.page);
    console.log('City Data from service:', cityData);

    if (cityData && cityData.length > 0) {
      // Access the $oid value from the _id field
      const cityId = cityData[0]._id.$oid;
      console.log('Found city ID:', cityId);
      
      if (cityId) {
        this.loadPlaces(cityId);
      } else {
        console.error('City ID is undefined or null');
      }
    } else {
      console.error('Invalid city data structure:', cityData);
    }
  }

  loadPlaces(cityId: string) {
    console.log('Loading places for city ID:', cityId);
    
    this.webService.getPlaces(cityId)
      .subscribe({
        next: (response: any) => {
          console.log('API Response:', response);
          // Check if response is an object with a places property
          if (response && response.places && Array.isArray(response.places)) {
            this.business_list = response.places;
          } else if (Array.isArray(response)) {
            this.business_list = response;
          } else {
            console.error('Unexpected response format:', response);
            this.business_list = [];
          }
          this.applyFiltersAndSort();
        },
        error: (error) => {
          console.error('Error loading places:', error);
          this.business_list = [];
          this.filteredPlaces = [];
        }
      });
  }

  applyFiltersAndSort() {
    console.log('Current business_list:', this.business_list);
    
    if (!Array.isArray(this.business_list)) {
      this.filteredPlaces = [];
      return;
    }

    // Create a copy of the array
    let places = [...this.business_list];
    
    // Apply filters
    this.filteredPlaces = places.filter(place => {
      const typeMatch = this.selectedType === 'all' || 
                     place?.info?.type?.includes(this.selectedType);
      const ratingMatch = (place?.ratings?.average_rating || 0) >= this.minRating;
      const mealMatch = this.selectedMeal === 'all' || 
                     place?.service_options?.meals?.[this.selectedMeal];
      
      return typeMatch && ratingMatch && mealMatch;
    });

    // Apply sorting
    if (this.sortBy === 'name') {
      this.filteredPlaces.sort((a, b) => {
        const nameA = a?.info?.name || '';
        const nameB = b?.info?.name || '';
        return this.sortDirection === 'asc' ? 
          nameA.localeCompare(nameB) : 
          nameB.localeCompare(nameA);
      });
    } else if (this.sortBy === 'rating') {
      this.filteredPlaces.sort((a, b) => {
        const ratingA = a?.ratings?.average_rating || 0;
        const ratingB = b?.ratings?.average_rating || 0;
        return this.sortDirection === 'asc' ? 
          ratingA - ratingB : 
          ratingB - ratingA;
      });
    }

    console.log('Filtered places:', this.filteredPlaces);
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
      const cityData = this.dataService.getBusinesses(this.page);
      if (cityData && cityData.length > 0) {
        const cityId = cityData[0]._id.$oid; 
        this.loadPlaces(cityId);
      }
    }
  }

  nextPage() { 
    if (this.page < this.dataService.getLastPageNumber()) {
      this.page = this.page + 1;
      sessionStorage['page'] = this.page;
      const cityData = this.dataService.getBusinesses(this.page);
      if (cityData && cityData.length > 0) {
        const cityId = cityData[0]._id.$oid; 
        this.loadPlaces(cityId);
      }
    }
  }
} 
  /* dataservice
  ngOnInit() {
    if (sessionStorage['page']) {
      this.page = Number(sessionStorage['page']); 
    }

    this.business_list = this.dataService.getBusinesses(this.page);
    this.applyFiltersAndSort();
    console.log('Raw data:', this.business_list);
    console.log('Places array:', this.business_list?.places);
  }

  applyFiltersAndSort() {
    console.log('Starting applyFiltersAndSort');
    console.log('Current business_list:', this.business_list);

    if (!this.business_list || !this.business_list[0]?.places) {
        console.log('No business_list or places found');
        this.filteredPlaces = [];
        return;
    }

    // Since business_list is an array and places is inside the first object
    let places = [...this.business_list[0].places];
    console.log('Initial places:', places);
    
    // Apply filters
    places = places.filter(place => {
        const typeMatch = this.selectedType === 'all' || 
                       place?.info?.type?.includes(this.selectedType);
        const ratingMatch = (place?.ratings?.average_rating || 0) >= this.minRating;
        const mealMatch = this.selectedMeal === 'all' || 
                       place?.service_options?.meals?.[this.selectedMeal];
        
        return typeMatch && ratingMatch && mealMatch;
    });

    console.log('Filtered places:', places);

    // Apply sorting
    places.sort((a, b) => {
        let compareValue = 0;
        if (this.sortBy === 'name') {
            compareValue = (a?.info?.name || '').localeCompare(b?.info?.name || '');
        } else if (this.sortBy === 'rating') {
            compareValue = (b?.ratings?.average_rating || 0) - (a?.ratings?.average_rating || 0);
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
    if (this.page > 1){
      this.page = this.page - 1 
      sessionStorage['page'] = this.page;
      this.business_list = this.dataService.getBusinesses(this.page);
      this.applyFiltersAndSort();
    }
  } 

  nextPage() { 
    if (this.page < this.dataService.getLastPageNumber()){
      this.page = this.page + 1 
      sessionStorage['page'] = this.page;
      this.business_list = this.dataService.getBusinesses(this.page);
      this.applyFiltersAndSort();
    }
  }
  */
}

