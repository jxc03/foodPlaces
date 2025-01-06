import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
//import { DataService } from '../../data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebService } from '../../web.service';

@Component({
  selector: 'armaghBusinesses',
  imports: [RouterOutlet, CommonModule, RouterModule, FormsModule],
  providers: [/*DataService,*/ WebService],
  templateUrl: './armaghBusinesses.component.html',
  styleUrls: ['./armaghBusinesses.component.css']
})


export class ArmaghBusinessesComponent {
  pageSize = 10;
  business_list: any = [];
  filteredPlaces: any[] = [];
  /*cityId: string = 'c_armagh';*/
  cityId: string = '67267637aeb441ea7afa163a';
  page: number = 1;
  totalPages: number = 1;

  // Filters
  selectedType: string = 'all';
  selectedMeal: string = 'all';
  minRating: number = 0;
  sortBy: string = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(/*public dataService: DataService,*/ private webService: WebService) { }
  
  ngOnInit() {
    if (sessionStorage['page']) {
      this.page = Number(sessionStorage['page']); 
    }
    this.fetchPlaces();
  }
  
  fetchPlaces() {
    const filters = {
      type: this.selectedType,
      selectedMeal: this.selectedMeal,
      min_rating: this.minRating,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };
  
    console.log('Loading places with filters:', filters);
  
    this.webService.getPlaces(this.cityId, this.page, filters).subscribe({
      next: (response: any) => {
        console.log('Raw API Response:', response);
  
        if (response && response.places) {
          // Remove duplicates by info.name
          const uniquePlaces = this.removeDuplicatePlacesByName(response.places);
          
          this.filteredPlaces = uniquePlaces;

          /*
          // Process the unique list
          this.business_list = uniquePlaces;
          this.applyFiltersAndSort(uniquePlaces);
          */

          // Pagination
          if (response.pagination) {
            this.page = response.pagination?.current_page;
            this.totalPages = response.pagination?.total_pages;
          } else {
            this.totalPages = 1;
          }
  
          console.log(`Page ${this.page} of ${this.totalPages}`);
        } else {
          console.error('Unexpected response format:', response);
          this.filteredPlaces = [];
          this.totalPages = 1;
        }
      },
      error: (error: any) => {
        console.error('Error loading places:', error);
        this.filteredPlaces = [];
        this.totalPages = 1;
      }
    });
  }

  removeDuplicatePlacesByName(places: any[]): any[] {
    const uniquePlaces: any[] = [];
    const seenNames = new Set<string>();
  
    places.forEach(place => {
      const placeName = place?.info?.name?.trim().toLowerCase(); // Tweak the name
      if (placeName && !seenNames.has(placeName)) {
        seenNames.add(placeName); // Add the name to the Set
        uniquePlaces.push(place); // Add this place to the final list
      }
    });
  
    return uniquePlaces; // Return the list without duplicates
  }

  applyFiltersAndSort(places: any[]) {
    console.log('Starting filtering with places:', places.length);

    // Apply filters
    this.filteredPlaces = places.filter((place: any) => {
      const typeMatch = this.selectedType === 'all' || 
                     place?.info?.type?.includes(this.selectedType);
      const ratingMatch = (place?.ratings?.average_rating || 0) >= this.minRating;
      const mealMatch = this.selectedMeal === 'all' || 
                     place?.service_options?.meals?.[this.selectedMeal];
      
      return typeMatch && ratingMatch && mealMatch;
    });

    // Apply sorting
    if (this.sortBy === 'name') {
      this.filteredPlaces.sort((a: any, b: any) => {
        const nameA = a?.info?.name || '';
        const nameB = b?.info?.name || '';
        return this.sortDirection === 'asc' ? 
          nameA.localeCompare(nameB) : 
          nameB.localeCompare(nameA);
      });
    } else if (this.sortBy === 'rating') {
      this.filteredPlaces.sort((a: any, b: any) => {
        const ratingA = a?.ratings?.average_rating || 0;
        const ratingB = b?.ratings?.average_rating || 0;
        const comparison = ratingA - ratingB;
        return this.sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    console.log('After filtering and sorting:', this.filteredPlaces.length);
  }

  updateFilter() {
    this.page = 1;
    sessionStorage['page'] = this.page;
    this.fetchPlaces();
  }

  updateSort(sortBy: string) {
    if (this.sortBy === sortBy) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortDirection = 'asc';
    }
    this.fetchPlaces();
  }

  // Previous button functionality
  /**
   * Navigates to previous page if available
   */
  previousPage() { 
    if (this.page > 1) { // If not on first page
      this.page--; // Decrements page number
      sessionStorage['page'] = this.page; // Save new page
      this.fetchPlaces();
    }
  }

  // Next button functionality
  /**
   * Navigates to next page if available
   */
  nextPage() { 
    if (this.page < this.totalPages) { // If not on last page
      this.page++; // Increment page number
      sessionStorage['page'] = this.page; // Save new page to session storage
      this.fetchPlaces();
    }
  }

  /**
   * Get the current day
   * @returns {string} e.g. monday etc
   * For example if function is called then it will return the current day 
   */
  getCurrentDay(): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  }

  isCurrentlyOpen(hours: any): boolean {
    if (!hours) return false; // Early return for invalid hours
  
    const now = new Date();
    const currentDay = this.getCurrentDay();
    const dayHours = hours[currentDay];
  
    if (!dayHours) return false; // Early return if no hours are set for the current day
  
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes(); // Convert current time to minutes
    const openTimeInMinutes = this.convertToMinutes(dayHours.open);
    const closeTimeInMinutes = this.convertToMinutes(dayHours.close);
  
    return currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes <= closeTimeInMinutes;
  }
  
  private convertToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes; // Convert HH:mm to total minutes
  }

  /**
   * Check if a business is open based on business_hours information
   * 
   * @param {Object} hours contains the opening and closing hours
   * @returns {boolean} true if current time is iwthin open hours othewise false
   */
  isCurrentlyOpenOri(hours: any): boolean {
    const now = new Date();
    const currentTime = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0');
    const dayHours = hours?.[this.getCurrentDay()];
    return currentTime >= dayHours?.open && currentTime <= dayHours?.close;
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

