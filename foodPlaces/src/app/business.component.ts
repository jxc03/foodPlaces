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
    showAllReviews: boolean = false;
    currentPhotoIndex: number = 0;
    photosToDisplay: any[] = [];

    constructor(public dataService: DataService, private route: ActivatedRoute,  private formBuilder: FormBuilder) {}

    ngOnInit() {
        const businessId = this.route.snapshot.paramMap.get('id');
        console.log('Looking for business with ID:', businessId); // Debug log

        if (businessId) {
            this.business_list = this.dataService.getBusiness(businessId);
            console.log('Found business data:', this.business_list); // Debug log

            // Initialize photos array if available
            if (this.business_list?.[0]?.places?.[0]?.media?.photos) {
                this.photosToDisplay = this.business_list[0].places[0].media.photos;
                console.log('Photos loaded:', this.photosToDisplay.length);
            }

            // Log reviews specifically to verify data
            if (this.business_list && this.business_list[0]?.ratings?.recent_reviews) {
                console.log('Reviews:', this.business_list[0].ratings.recent_reviews);
            }
        }

        this.reviewForm = this.formBuilder.group({
            author_name: ['', Validators.required],/*Validators.required*/
            content: ['', Validators.required],/*Validators.required*/
            rating: [5],
          });
    } 

    onSubmit() {
        /*console.log(this.reviewForm.value);*/
        // If no ID is found, use 'not-found' as default value
        const businessId = this.route.snapshot.paramMap.get('id') || 'not-found';
        
        if (businessId === 'not-found') {
            console.error('Business ID not found');
            return;
        }
    
        this.dataService.postReview(businessId, this.reviewForm.value); 
        this.reviewForm.reset();
    }

    isInvalid(control: any) {
        return this.reviewForm.controls[control].invalid && this.reviewForm.controls[control].touched;
    }

    isUntouched() {
        return this.reviewForm.controls.author_name.pristine || this.reviewForm.controls.content.pristine;
    }

    isIncomplete() {
        return this.isInvalid('author_name') || this.isInvalid('content') || this.isUntouched();
    }

    toggleReviews() {
        this.showAllReviews = !this.showAllReviews;
    }
    /*
    getImageUrl(photo: any) {
        if (photo?.url) {
            // If it's a Google Maps URL, we'll use placeholder
            // Since we can't directly use Google Maps image URLs
            if (photo.url.includes('google.com/maps')) {
                return `/api/placeholder/${this.getImageDimensions(photo).width}/${this.getImageDimensions(photo).height}`;
            }
            // For other direct image URLs, use them
            return photo.url;
        }
        // Fallback to placeholder if no URL
        return `/api/placeholder/800/600`;
    }
    */
   
    getImageUrl(photo: any, isThumbnail: boolean = false) {
        if (isThumbnail) {
            // Fixed small size for thumbnails
            return '/api/placeholder/80/80';
        }

        // Fixed safe size for main image
        return '/api/placeholder/400/300';
    }

    getImageDimensions(photo: any, isThumbnail: boolean = false) {
        if (isThumbnail) {
            return { width: 80, height: 80 };
        }
        return { width: 400, height: 300 };
    }

    nextPhoto() {
        const photos = this.business_list?.[0]?.places?.[0]?.media?.photos;
        if (photos?.length) {
            this.currentPhotoIndex = (this.currentPhotoIndex + 1) % photos.length;
        }
    }

    previousPhoto() {
        const photos = this.business_list?.[0]?.places?.[0]?.media?.photos;
        if (photos?.length) {
            this.currentPhotoIndex = (this.currentPhotoIndex - 1 + photos.length) % photos.length;
        }
    }

    setPhoto(index: number) {
        const photos = this.business_list?.[0]?.places?.[0]?.media?.photos;
        if (photos?.length && index >= 0 && index < photos.length) {
            this.currentPhotoIndex = index;
        }
    }
}
