import { Component} from '@angular/core';
import { DataService } from './data.service';
import { WebService } from './web.service';

@Component({
  selector: 'testWS',
  templateUrl: './testWS.component.html',
  styleUrls: ['./testWS.component.css']
})

export class TestWSComponent {
  testResults: string[] = [];
  cityId: string = '67267637aeb441ea7afa163a';
  
  constructor(private dataService: DataService, private webService: WebService) {}
  
  ngOnInit() {
    this.testGetPlaces();
    this.testGetSinglePlace();
    this.testGetReviews();
    this.testPostReview();
  }

  private testGetPlaces() {
    const filters = {
      type: 'all',
      selectedMeal: 'all',
      min_rating: 0,
      sortBy: 'name',
      sortDirection: 'asc'
    };
    
    this.testResults.push('Testing getPlaces...');
    
    this.webService.getPlaces(this.cityId, 1, filters).subscribe({
      next: (response) => {
        console.log('getPlaces response:', response);
        if (response && response.places) {
          this.testResults.push(`getPlaces: PASS (Retrieved ${response.places.length} places)`);
        } else {
          this.testResults.push('getPlaces: FAIL (Invalid response format)');
        }
      },
      error: (error) => {
        console.error('getPlaces error:', error);
        this.testResults.push(`getPlaces: FAIL (${error.message})`);
      }
    });
  }
  
  private testGetSinglePlace() {
    const testPlaceId = '67267637aeb441ea7afa163b'; 
    this.testResults.push(`Testing getPlace with ID ${testPlaceId}...`);
    
    this.webService.getPlace(this.cityId, testPlaceId).subscribe({
      next: (response) => {
        console.log('getPlace response:', response);
        if (response) {
          this.testResults.push('getPlace: PASS');
        } else {
          this.testResults.push('getPlace: FAIL (Place not found)');
        }
      },
      error: (error) => {
        console.error('getPlace error:', error);
        this.testResults.push(`getPlace: FAIL (${error.status}: ${error.message})`);
      }
    });
  }

  private testGetReviews() {
    const placeId = '67267637aeb441ea7afa163b';
    this.testResults.push(`Testing getPlaceReviews for place ${placeId}...`);

    this.webService.getPlaceReviews(this.cityId, placeId).subscribe({
      next: (response) => {
        console.log('getPlaceReviews response:', response);
        this.testResults.push(`getPlaceReviews: PASS (Retrieved reviews)`);
      },
      error: (error) => {
        console.error('getPlaceReviews error:', error);
        this.testResults.push(`getPlaceReviews: FAIL (${error.status}: ${error.message})`);
      }
    });
  }


  private testPostReview() {
    const placeId = '67267637aeb441ea7afa163b';
    const testReview = {
      author_name: 'Test User',
      content: 'Test Review Content',
      rating: 5,
      userEmail: 'test@example.com'
    };

    this.testResults.push('Testing postReview...');

    this.webService.postReview(placeId, testReview, this.cityId).subscribe({
      next: (response) => {
        console.log('postReview response:', response);
        this.testResults.push('postReview: PASS');
        // Clean up by deleting the test review if you have the ID
        if (response && response._id) {
          this.webService.deleteReview(this.cityId, placeId, response._id).subscribe();
        }
      },
      error: (error) => {
        console.error('postReview error:', error);
        this.testResults.push(`postReview: FAIL (${error.status}: ${error.message})`);
      }
    });
  }
}

