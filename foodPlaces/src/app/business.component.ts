import { Component } from '@angular/core'; 
import { RouterOutlet, RouterModule, ActivatedRoute,  } from '@angular/router'; 
import { DataService } from './data.service'; 
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, Validators } from '@angular/forms'; 
import { GoogleMapsModule } from '@angular/google-maps'
import { AuthService } from '@auth0/auth0-angular';
import { WebService } from './web.service';

/**
 * Manages the business-related functionalities
 * Handles business data, reviews, Google Maps integration, and form management
 */
@Component({ 
    selector: 'business', 
    standalone: true, 
    imports: [RouterOutlet, RouterModule, CommonModule, ReactiveFormsModule, GoogleMapsModule], 
    providers: [DataService, WebService], 
    templateUrl: './business.component.html', 
    styleUrl: './business.component.css' 
}) 

export class BusinessComponent {
    /**
     * List of businesses fetched from the data service
     */
    business_list: any [] = [];

    /**
     * Identifier for the current city
     */
    cityId: string = '';

    /**
     * Reactive form for submitting reviews.
    */
    reviewForm: any;

    /**
     * Flag to toggle showing all reviews
     */
    showAllReviews: boolean = false;

    /**
     * Current index for displayed photo in photo gallery
     */
    currentPhotoIndex: number = 0;

    /**
     * Array of photos to display for the business
     */
    photosToDisplay: any[] = [];

    /**
     * Latitude of the business location
     */
    business_lat: number = 0; 

    /**
     * Longitude of the business location
     */
    business_lng: number = 0; 

    /**
     * Google Maps options for rendering the map
     */
    map_options: google.maps.MapOptions = {zoom: 15, mapTypeId: 'roadmap'}; 

    /**
     * Array of map locations to display markers
     */
    map_locations: any[] = [];

    /**
     * ID of the review being edited, if any
     */
    editingReviewId: string | null = null;

    /**
     * Logged-in user's email
     */
    userEmail: string | null = null;

    /**
     * List of reviews for the business
     */
    review_list: any[] = [];

    /**
     * Flag to toggle details expansion
     */
    isDetailsExpanded = false;

    /**
     * Constructor to inject required services
     * @param dataService to handle data operations
     * @param route to fetch route parameters
     * @param formBuilder to create reactive forms
     * @param authService for authentication using Auth0
     * @param webService for connecting to backend
     */
    constructor(public dataService: DataService, private route: ActivatedRoute,  private formBuilder: FormBuilder, public authService: AuthService, private webService: WebService) {}

    ngOnInit() {
        const businessId = this.route.snapshot.paramMap.get('id'); // Fetch the business ID from the route
        console.log('Looking for business with ID:', businessId);

        if (businessId) {
            this.business_list = this.dataService.getBusiness(businessId); // Fetch business data using service
            console.log('Found business data:', this.business_list);

            // Google Maps with business location
            if (this.business_list?.[0]?.places?.[0]?.location?.coordinates) {
                const coordinates = this.business_list[0].places[0].location.coordinates;
                this.business_lat = coordinates.latitude;
                this.business_lng = coordinates.longitude;
                
                console.log('Business coordinates:', this.business_lat, this.business_lng);

                // Set map options
                this.map_options = {
                    mapId: "DEMO_MAP_ID",
                    center: { 
                        lat: this.business_lat,
                        lng: this.business_lng 
                    },
                    zoom: 15,
                    mapTypeId: 'roadmap'
                };

                // Add business location marker
                this.map_locations = [{
                    lat: this.business_lat,
                    lng: this.business_lng
                }];
            }

            // Load photos array if available
            if (this.business_list?.[0]?.places?.[0]?.media?.photos) {
                this.photosToDisplay = this.business_list[0].places[0].media.photos;
                console.log('Photos loaded:', this.photosToDisplay.length);
            }

            // Log reviews if available 
            if (this.business_list && this.business_list[0]?.ratings?.recent_reviews) {
                console.log('Reviews:', this.business_list[0].ratings.recent_reviews);
            }
        }

        // Review form with validation
        this.reviewForm = this.formBuilder.group({
            author_name: ['', Validators.required],
            content: ['', Validators.required],
            rating: [5],
        });

        // To get logged-in user's email
        this.authService.user$.subscribe(user => {
            console.log('Logged-in user:', user);
            this.userEmail = user?.email || null;
            console.log('Auth0 user email:', this.userEmail);
        });
    }

    /**
     * Logs user comparison for review author validation
     * @param userName 
     * @param reviewAuthor 
     */
    logUserReview(userName: string, reviewAuthor: string) {
        console.log('Comparing:', userName, 'with', reviewAuthor);
    }

    /**
     * Enables editing mode for a selected review
     * @param review object to edit
     */
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
    
    /**
     * Deletes a review after confirmation
     * @param reviewId ID of the review to delete
     */
    deleteReview(reviewId: string) {
        if (confirm('Are you sure you want to delete this review?')) {
            const businessId = this.route.snapshot.paramMap.get('id'); // Get the business ID
            if (businessId) {
                const success = this.dataService.deleteReview(businessId, reviewId); // Attempt to delete the review
                if (success) { // If deleted
                    this.business_list = this.dataService.getBusiness(businessId); // Refresh the business data
                } else { 
                    console.error('Failed to delete review');
                }
            }
        }
    }

    /**
     * Handles review form submission for creating or editing a review
     * @returns 
     */
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

    /**
     * Checks if a form control is invalid and touched
     * @param control
     * @returns 
     */
    isInvalid(control: any) {
        return this.reviewForm.controls[control].invalid && this.reviewForm.controls[control].touched;
    }

    /**
     * Checks if the form is untouched
     * @returns 
     */
    isUntouched() {
        return this.reviewForm.controls.author_name.pristine || this.reviewForm.controls.content.pristine;
    }

    /**
     * Checks if the form is incomplete
     * @returns 
     */
    isIncomplete() {
        return this.isInvalid('author_name') || this.isInvalid('content') || this.isUntouched();
    }
   
    /* 
    Placeholder images since my dataset to get the images is just a URL to the google map
    Shouldve downloaded them instead of using an URL link
    Unless there is a possibility to fetch the image using Google Places API through the backend
    */
   /**
    * Generates a placeholder image URL for a photo
    * @param photo object
    * @param isThumbnail to indicate if the image is a thumbnail
    * @returns 
    */
    getImageUrl(photo: any, isThumbnail: boolean = false) {
        // Placeholder service to get photo
        if (isThumbnail) {
            return `https://picsum.photos/80/80?random=${photo?.photo_id || Math.random()}`;
        }
        return `https://picsum.photos/800/600?random=${photo?.photo_id || Math.random()}`;
    }

    /**
     * Image dimensions for a photo
     * @param photo 
     * @returns 
     */
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

    /**
     * Go to next photo in the gallery
     */
    nextPhoto() {
        const photos = this.business_list?.[0]?.places?.[0]?.media?.photos;
        if (photos?.length) {
            this.currentPhotoIndex = (this.currentPhotoIndex + 1) % photos.length;
        }
    }

    /**
     * Go to previous photo in the gallery
     */
    previousPhoto() {
        const photos = this.business_list?.[0]?.places?.[0]?.media?.photos;
        if (photos?.length) {
            this.currentPhotoIndex = (this.currentPhotoIndex - 1 + photos.length) % photos.length;
        }
    }

    /**
     * Sets the current photo index
     * @param index index of the photo to display
     */
    setPhoto(index: number) {
        const photos = this.business_list?.[0]?.places?.[0]?.media?.photos;
        if (photos?.length && index >= 0 && index < photos.length) {
            this.currentPhotoIndex = index;
        }
    }

    /**
     * Coverts the options to an array
     * @param options 
     * @returns 
     */
    getServiceOptions(options: Record<string, boolean> | undefined): Array<{key: string, value: boolean}> {
        if (!options) return [];
        return Object.entries(options).map(([key, value]) => ({
        key,
        value
        }));
    }

    /**
     * Formats label/information by captalising words and removing underscores
     * @param key string to format
     * @returns 
     */
    formatLabel(key: string): string {
        return key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
}
