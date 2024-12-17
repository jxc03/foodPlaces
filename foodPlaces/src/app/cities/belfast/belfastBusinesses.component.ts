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
  // Lists
  /** List of all businesses before filtering */
  business_list: any = []; 
  /** List of businesses after applying filters and sorting */
  filteredPlaces: any[] = []; 

  //cityId: string = 'c_ban'; // Old code 
  /** MongoDB ID for Bangor city */
  cityId: string = '67267637aeb441ea7afa21da';

  // Pagination
  /** Current page number, starting from 1 */
  page: number = 1; // Current page starting from 1
  totalPages: number = 1; // Total numbebr of available pages

  // Filters and sort
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
  constructor(public dataService: DataService, private webService: WebService) {}

  /**
   * Runs on component
   * Restores page number from session storage if available
   * Fetches initial data
   */
  ngOnInit() {
    if (sessionStorage['page']) { // Checks 
      this.page = Number(sessionStorage['page']); // Saves the page if it refreshes
      console.log(`restored page ${this.page} from session storage`); // For debugging
    }
    this.fetchPlaces(); // Initial data fetch
  }
  
  // To get the business data
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
    console.log('loading places with filters:', filters); // For debugging
  
    // Api request 
    this.webService.getPlaces(this.cityId, this.page, filters).subscribe({ // With city id, current page number and filter settings
      next: (response: any) => { // Handles api response
        console.log('api response:', response); 
  
        if (response && response.places) { // If response contains businesses (places) data
          // Removes duplicates by info.name and update list with filter
          const uniquePlaces = this.removeDuplicatePlacesByName(response.places); // Assigns the list to a function to remove duplicated data
          this.filteredPlaces = uniquePlaces; // Updates the displayed business list

          // Pagination
          if (response.pagination) { // Checks if pagination value exists
            this.page = response.pagination?.current_page; // Updates current page number
            this.totalPages = response.pagination?.total_pages; // Updates total available pages
          } else {
            this.totalPages = 1; // If doesnt exists, takes 1 
          }
          console.log(`Page ${this.page} of ${this.totalPages}`);

        } else { // If error occurs
          console.error('inivalid response format:', response); 
          this.filteredPlaces = []; // 
          this.totalPages = 1; // 
        }

      },
      error: (error: any) => { // Handles api request error
        console.error('error loading places:', error);
        this.filteredPlaces = []; //
        this.totalPages = 1; //
      }
    });
  }

  // Removes duplicated places by name
  /**
   * Removes duplicate businesses based on name
   * @param places array of place to remove duplicated 
   * @returns array of none duplicated
   */
  removeDuplicatePlacesByName(places: any[]): any[] { // Takes array of places and returns new array without duplicated businesses
    const uniquePlaces: any[] = []; // To store businesses
    const seenNames = new Set<string>(); // To track names that are duplicated
  
    places.forEach(place => { // For each place in places 
      const placeName = place?.info?.name?.trim().toLowerCase(); // Remove whitespace and convert to lowercase
      if (placeName && !seenNames.has(placeName)) {
        seenNames.add(placeName); // Add duplicate name to seenNames (removes any duplication)
        uniquePlaces.push(place); // Adds business to list to be used
      }
    });
    
    console.log(`removed ${places.length - uniquePlaces.length} duplicates`);
    return uniquePlaces; // Return the list without duplicates
  }

  // Applies all current filters and sorting 
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

  // Update filters and refreshes data
  /**
   * Updates filters and refreshes the business list
   * Resets to first page when filters change
   */
  updateFilter() {
    this.page = 1; // Reset to first page when filters change 
    sessionStorage['page'] = this.page; // Save page number to session storage
    this.fetchPlaces(); // Fetch new data with updated filters
  }

  // Update sort criteria and refreshes data
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

  // Previous button functionality
  /**
   * Navigates to previous page if available
   */
  previousPage() { 
    if (this.page > 1) { // Check if not on first page
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
    if (this.page < this.totalPages) { // Check if not on last page
      this.page++; // Increment page number
      sessionStorage['page'] = this.page; // Save new page to session storage
      this.fetchPlaces();
    }
  }
}


  /* Old code for data service
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

/*
styleUrl to styleUrls ['...'] to fix error after putting each city in their own folder
*/