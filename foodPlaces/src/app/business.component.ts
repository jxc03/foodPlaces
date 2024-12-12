import { Component } from '@angular/core'; 
import { RouterOutlet, RouterModule, ActivatedRoute,  } from '@angular/router'; 
import { DataService } from './data.service'; 
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, Validators } from '@angular/forms'; 

@Component({ 
    selector: 'business', 
    standalone: true, 
    imports: [RouterOutlet, RouterModule, CommonModule, ReactiveFormsModule], 
    providers: [DataService], 
    templateUrl: './business.component.html', 
    styleUrl: './business.component.css' 
}) 

export class BusinessComponent {
    business_list: any;
    cityId: string = '';
    reviewForm: any;

    constructor(public dataService: DataService, private route: ActivatedRoute,  private formBuilder: FormBuilder) {}

    ngOnInit() {
        const businessId = this.route.snapshot.paramMap.get('id');
        console.log('Looking for business with ID:', businessId); // Debug log

        if (businessId) {
            this.business_list = this.dataService.getBusiness(businessId);
            console.log('Found business data:', this.business_list); // Debug log

            // Log reviews specifically to verify data
            if (this.business_list && this.business_list[0]?.ratings?.recent_reviews) {
                console.log('Reviews:', this.business_list[0].ratings.recent_reviews);
            }
        }

        this.reviewForm = this.formBuilder.group({
            author_name: ['', ],/*Validators.required*/
            content: ['', ],/*Validators.required*/
            rating: [5],
            language: ['en'] // Default language
          });
    }

    onSubmit() { 
        console.log(this.reviewForm.valid); 
      } 
}