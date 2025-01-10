import { Component } from '@angular/core'; 
import { RouterOutlet, RouterModule, ActivatedRoute,  } from '@angular/router'; 
import { DataService } from './data.service'; 
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, Validators } from '@angular/forms'; 
import { GoogleMapsModule } from '@angular/google-maps'
import { AuthService } from '@auth0/auth0-angular';
import { WebService } from './web.service';

@Component({ 
    selector: 'businessFail', 
    standalone: true, 
    imports: [RouterOutlet, RouterModule, CommonModule, ReactiveFormsModule, GoogleMapsModule], 
    providers: [DataService, WebService], 
    templateUrl: './businessFail.component.html', 
    styleUrl: './businessFail.component.css' 
}) 

export class BusinessFailComponent {
    business_list: any[] = [];
    cityId: string = '';
    reviewForm: any;
    showAllReviews: boolean = false;
    currentPhotoIndex: number = 0;
    photosToDisplay: any[] = [];
    business_lat: number = 0; 
    business_lng: number = 0; 
    map_options: google.maps.MapOptions = {zoom: 15, mapTypeId: 'roadmap'}; 
    map_locations: any[] = [ ]
    editingReviewId: string | null = null;
    userEmail: string | null = null;
    review_list: any[] = [];

    constructor(public dataService: DataService, private route: ActivatedRoute,  private formBuilder: FormBuilder, public authService: AuthService, private webService: WebService) {}

    ngOnInit() {
        const businessId = this.route.snapshot.paramMap.get('id');
        this.cityId = this.route.snapshot.paramMap.get('cityId') || '';

        console.log('BusinessComponent: Initialising with businessId:', businessId);
        console.log('BusinessComponent: City ID:', this.cityId);
        
        if (businessId && this.cityId) {
            // Get business details
            this.webService.getPlace(this.cityId, businessId)
                .subscribe((response: any) => {
                    this.business_list = [response];
                    
                    // Initialize maps if coordinates exist
                    if (response?.places?.[0]?.location?.coordinates) {
                        const coordinates = response.places[0].location.coordinates;
                        this.business_lat = coordinates.latitude;
                        this.business_lng = coordinates.longitude;
                        
                        this.map_options = {
                            mapId: "DEMO_MAP_ID",
                            center: { 
                                lat: this.business_lat,
                                lng: this.business_lng 
                            },
                            zoom: 15,
                            mapTypeId: 'roadmap'
                        };

                        this.map_locations = [{
                            lat: this.business_lat,
                            lng: this.business_lng
                        }];
                    }

                    // Initialize photos
                    if (response?.places?.[0]?.media?.photos) {
                        this.photosToDisplay = response.places[0].media.photos;
                    }
                });

            // Get business reviews separately
            this.webService.getPlaceReviews(this.cityId, businessId)
                .subscribe((response: any) => {
                    this.review_list = response;
                });
        }

        // Initialize form and auth user subscription
        this.reviewForm = this.formBuilder.group({
            author_name: ['', Validators.required],
            content: ['', Validators.required],
            rating: [5],
        });

        this.authService.user$.subscribe(user => {
            this.userEmail = user?.email || null;
        });
    }

    logUserReview(userName: string, reviewAuthor: string) {
        console.log('Comparing:', userName, 'with', reviewAuthor);
    }

    editReview(review: any) {
        // Pre-fill the form with existing review data
        this.reviewForm.patchValue({
            author_name: review.author_name,
            content: review.content,
            rating: review.rating
        });
    
        // Store the review ID being edited
        this.editingReviewId = review.review_id;
    }
    
    deleteReview(reviewId: string) {
        if (confirm('Are you sure you want to delete this review?')) {
            const businessId = this.route.snapshot.paramMap.get('id');
            if (businessId) {
                const success = this.dataService.deleteReview(businessId, reviewId);
                if (success) {
                    // Refresh the business data
                    this.business_list = this.dataService.getBusiness(businessId);
                } else {
                    console.error('Failed to delete review');
                }
            }
        }
    }

    onSubmit() {
        const businessId = this.route.snapshot.paramMap.get('id') || 'not-found';
        
        if (businessId === 'not-found') {
            console.error('Business ID not found');
            return;
        }
        
        const reviewData = {
            ...this.reviewForm.value,
            userEmail: this.userEmail  // Add the email for tracking
        };

        let success = false;
        if (this.editingReviewId) {
            // Edits existing review
            success = this.dataService.editReview(businessId, this.editingReviewId, reviewData);
            this.editingReviewId = null; // Resets edit
        } else {
            // Posts new reviews
            success = this.dataService.postReview(businessId, reviewData);
        }

        if (success) {
            this.reviewForm.reset();
            // Add a success message for user
            // Refreshes the data
            this.business_list = this.dataService.getBusiness(businessId);
        } else {
            console.error('Failed to post review');
        }
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

    /* 
    Placeholder images since my dataset to get the images is just a URL to the google map
    Shouldve downloaded them instead of using an URL link
    Unless there is a possibility to fetch the image using Google Places API through the backend
    */
    getImageUrl(photo: any, isThumbnail: boolean = false) {
        // Use a default image service like Picsum or a local asset
        if (isThumbnail) {
            return `https://picsum.photos/80/80?random=${photo?.photo_id || Math.random()}`;
        }
        
        // For main display image, use larger dimensions
        return `https://picsum.photos/800/600?random=${photo?.photo_id || Math.random()}`;
    }

    getImageDimensions(photo: any) {
        // Use original dimensions from photo data if available
        if (photo?.dimensions) {
            return {
                width: photo.dimensions.width,
                height: photo.dimensions.height
            };
        }
        // Default dimensions
        return { width: 800, height: 600 };
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
