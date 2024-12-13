import { Component} from '@angular/core';
import { DataService } from './data.service';

@Component({
  selector: 'testWS',
  templateUrl: './testWS.component.html',
  styleUrls: ['./testWS.component.css']
})

export class TestWSComponent {
    testResults: string[] = [];
  
    constructor(private dataService: DataService) {}
  
    ngOnInit() {
      this.testGetBusinesses();
      this.testGetBusinessById();
      this.testGetLastPageNumber();
      this.testPostReview();
    }
  
    private testGetBusinesses() {
      const page = 1;
      this.testResults.push(`Testing getBusinesses for page ${page}...`);
      const businesses = this.dataService.getBusinesses(page);
      if (businesses && businesses[0]?.places?.length > 0) {
        this.testResults.push(`getBusinesses: PASS (${businesses[0].places.length} places retrieved)`);
      } else {
        this.testResults.push('getBusinesses: FAIL');
      }
    }
  
    private testGetBusinessById() {
      const testId = '1'; // Replace with valid business ID for testing
      this.testResults.push(`Testing getBusiness with ID ${testId}...`);
  
      try {
        const business = this.dataService.getBusiness(testId);
        if (business && business[0]?.places?.length > 0) {
          this.testResults.push(`getBusiness: PASS (Found ${business[0].places[0]?.name || 'unknown'})`);
        } else {
          this.testResults.push('getBusiness: FAIL (Business not found)');
        }
      } catch (error: any) {
        this.testResults.push(`getBusiness: FAIL (Error: ${error?.message || 'Unknown error'})`);
      }
    }
  
    private testGetLastPageNumber() {
      const cityId = 'c_arm';
      this.testResults.push(`Testing getLastPageNumber for city ${cityId}...`);
      const lastPage = this.dataService.getLastPageNumber(cityId);
      if (lastPage > 0) {
        this.testResults.push(`getLastPageNumber: PASS (Last page is ${lastPage})`);
      } else {
        this.testResults.push('getLastPageNumber: FAIL');
      }
    }
  
    private testPostReview() {
      const businessId = '1'; // Replace with valid business ID
      const mockReview = {
        author_name: 'Test User',
        content: 'Amazing experience!',
        rating: 5,
      };
      this.testResults.push(`Testing postReview for business ${businessId}...`);
  
      try {
        this.dataService.postReview(businessId, mockReview);
        const business = this.dataService.getBusiness(businessId);
        if (
          business &&
          business[0]?.places[0]?.ratings?.recent_reviews?.find(
            (r: any) => r.content === mockReview.content
          )
        ) {
          this.testResults.push('postReview: PASS (Review added successfully)');
        } else {
          this.testResults.push('postReview: FAIL (Review not found)');
        }
      } catch (error: any) {
        this.testResults.push(`postReview: FAIL (Error: ${error?.message || 'Unknown error'})`);
      }
    }
}

