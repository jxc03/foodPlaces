/**
 * Code file to display all the businesses from JSON data or API for armagh
 */

import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
//import { DataService } from '../../data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebService } from '../../web.service';

/**
 * Component that handles the display and management of Bangor business listings
 * Provides filtering, sorting, and pagination functionality for business data
 */
@Component({
  selector: 'armaghBusinesses',
  imports: [RouterOutlet, CommonModule, RouterModule, FormsModule],
  providers: [/*DataService*/ WebService],
  templateUrl: './armaghBusinesses.component.html',
  styleUrls: ['./armaghBusinesses.component.css']
})

/**
 * Component that manages the display of businesses in Bangor
 * Provides functionality for:
 * - Displaying a paginated list of businesses
 * - Filtering businesses by type, meal options, and minimum rating
 * - Sorting businesses by name or rating
 * - Removing duplicate business entries
 * - Managing session storage for page persistence
 * - For previous and next button
 * - Checking if a business is open right now or not
 */
export class ArmaghBusinessesComponent {
  // Lists
  /** List of all businesses before filtering */
  business_list: any = []; 
  /** List of businesses after applying filters and sorting */
  filteredPlaces: any[] = []; 

  /*cityId: string = 'c_armagh';*/ // Old code
  /** MongoDB ID for Armagh city */
  cityId: string = '67267637aeb441ea7afa163a';

  
  /** Current page number, starting from 1 */
  page: number = 1; // Current page starting from 1
  totalPages: number = 1; // Total numbebr of available pages

  
  /** Selected business type filter, defaults to show all types */
  selectedType: string = 'all'; 
  /** Selected meal type filter */
  selectedMeal: string = 'all'; 
  /** Minimum rating filter, defaults to show all ratings */
  minRating: number = 0;
  /** Current sort field, defaults to business name */
  sortBy: string = 'name'; 
  /** Sort direction, ascending or descending, default to ascending */
  sortDirection: 'asc' | 'desc' = 'asc';

  /**
   * Creates BangorBusinessesComponent
   * @param dataService for handling imported JSON data
   * @param webService for making API calls (connecting to backend)
   */
  constructor(/*public dataService: DataService,*/ private webService: WebService) { }
  
  /**
   * Runs on component
   * Restores page number from session storage if available
   * Fetches initial data
   */
  ngOnInit() {
    if (sessionStorage['page']) { // Checks
      this.page = Number(sessionStorage['page']); // Save the page if it refreshes
      console.log(`restored page ${this.page} from session storage`); // For debugging
    }
    this.fetchPlaces(); // Initial data fetch
  }

  /**
   * Fetches businesses based on current filters and pagination
   * Updates filteredPlaces array with the results
   */
  fetchPlaces() {
    const filters = { // Assigning filters for api request
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
          if (response.pagination) { // Check if pagination value exists
            this.page = response.pagination?.current_page; // Update current page number
            this.totalPages = response.pagination?.total_pages; // Update total available pages
          } else {
            this.totalPages = 1; // If doesnt exists, takes 1
          }
          console.log(`Page ${this.page} of ${this.totalPages}`);

        } else { // If error occurs
          console.error('Unexpected response format:', response);
          this.filteredPlaces = [];
          this.totalPages = 1;
        }
      },
      error: (error: any) => { // Handle api request error
        console.error('Error loading places:', error);
        this.filteredPlaces = [];
        this.totalPages = 1;
      }
    });
  }

   /**
   * Removes duplicate businesses based on name
   * Checks the name of each place after triming and converting to lowercase
   * @param places array of place to remove duplicated 
   * @returns array of none duplicated
   */
   removeDuplicatePlacesByName(places: any[]): any[] { // Take array of places and returns new array without duplicated businesses
    const uniquePlaces: any[] = []; // To store businesses
    const seenNames = new Set<string>(); // To track names that are duplicated
  
    places.forEach(place => { // For each place in places 
      const placeName = place?.info?.name?.trim().toLowerCase(); // Remove whitespace and convert to lowercase
      if (placeName && !seenNames.has(placeName)) {
        seenNames.add(placeName); // Add duplicate name to seenNames (removes any duplication)
        uniquePlaces.push(place); // Add business to list to be used
      }
    });
    
    console.log(`removed ${places.length - uniquePlaces.length} duplicates`);
    return uniquePlaces; // Return the list without duplicates
  }

  /**
   * Applies all current filters and sorting criteria to the places array
   * Filters by business type, minimum rating, and meal options
   * Sorts results by either name or rating in ascending/descending order
   * @param places array of places to filter and sort
   */
  applyFiltersAndSort(places: any[]) {
    console.log('starting filtering with places:', places.length);

    // Apply filters
    this.filteredPlaces = places.filter((place: any) => {
      const typeMatch = this.selectedType === 'all' ||
                        place?.info?.type?.includes(this.selectedType); // Check if type matches selected type
      const ratingMatch = (place?.ratings?.average_rating || 0) >= this.minRating; // Check if ratting meets minimum rating
      const mealMatch = this.selectedMeal === 'all' || 
                        place?.service_options?.meals?.[this.selectedMeal];
      
      return typeMatch && ratingMatch && mealMatch;
    });
 
    // Apply sorting
    if (this.sortBy === 'name') { // Sort by name if selected
      this.filteredPlaces.sort((a: any, b: any) => { // By alphabetical
        const nameA = a?.info?.name || ''; // Get one business name, if there is none then default to empty string
        const nameB = b?.info?.name || ''; // Get another business name, if there is none then default to empty string
        return this.sortDirection === 'asc' ? // Applies selected sort direction
          nameA.localeCompare(nameB) : 
          nameB.localeCompare(nameA);
      });

    } else if (this.sortBy === 'rating') { // Sort by rating if selected
      this.filteredPlaces.sort((a: any, b: any) => {
        const ratingA = a?.ratings?.average_rating || 0; // Get one business rating, if there is none then default to 0
        const ratingB = b?.ratings?.average_rating || 0; // Get another business rating, if there is none then default to 0
        const comparison = ratingA - ratingB; // Calculate rating difference 
        return this.sortDirection === 'asc' ? comparison : -comparison; // Apply selected sort direction
      });
    }

    console.log('after filtering and sorting:', this.filteredPlaces.length);
  }

  /**
   * Updates filters and refreshes the business list
   * Resets to first page when filters change
   */
  updateFilter() {
    this.page = 1; // Reset to first page when filters change 
    sessionStorage['page'] = this.page; // Save page number to session storage
    this.fetchPlaces(); // Fetch new data with updated filters
  }

  /**
   * Updates sort cirteria and refreshes the business list
   * @param sortBy sortBy Field to sort by name or rating
   */
  updateSort(sortBy: string) {
    if (this.sortBy === sortBy) { // If sort button is clicked again
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'; // Toggle sort
    } else {
      this.sortBy = sortBy; // Update sort field
      this.sortDirection = 'asc'; // Default is ascending
    }
    this.fetchPlaces(); // Fetch new data with sorting
  }

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
   * Uses the Date object to determine the current day
   * @returns {string} e.g. monday etc
   * For example if function is called then it will return the current day 
   */
  getCurrentDay(): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']; // Array of days
    const currentDayIndex = new Date().getDay(); // Get the current day index (0 = Sunday, 1 = Monday... etc) 
    return days[currentDayIndex]; // Use the index to fetch the corresponding day name from the array
  }

  /**
   * Check if a business is open based on business_hours information
   * @param {Object} hours contains the opening and closing hours
   * @returns {boolean} true if current time is wthin open hours otherwise false
   */
  isCurrentlyOpen(hours: any): boolean {
    // Return false for invalid hours
    if (!hours) return false; // If no hours then return false

    // Get the current date and time
    const now = new Date(); // Assigning current date and time to now 

    // Get the current day as a lowercase string
    const currentDay = this.getCurrentDay(); // Uses the getCurrentDay function and assigns it to currentDay

    // Fetch the hours for the current day
    const dayHours = hours[currentDay]; 

    // Return false if no hours are set for the current day
    if (!dayHours) return false; 
    
     // Convert current time to minutes
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
    
    // Convert opening and closing times to total minutes
    const openTimeInMinutes = this.convertToMinutes(dayHours.open);
    const closeTimeInMinutes = this.convertToMinutes(dayHours.close);
    
    // Check if the current time falls within the open and close times
    return currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes <= closeTimeInMinutes;
  }
  
  /**
   * Converrts the time
   * @param time A string representing time in hmm:mm format (e.g. 14:30)
   * @returns {number} the total number of minutes since midnight
   */
  private convertToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number); // Split the time string into hours and minutes and convert them to numbers
    return hours * 60 + minutes; // Convert hh:mm to total minutes
  }

  /**
   * Check if a business is open based on business_hours information
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

