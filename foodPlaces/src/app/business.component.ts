import { Component } from '@angular/core'; 
import { RouterOutlet, RouterModule, ActivatedRoute,  } from '@angular/router'; 
import { DataService } from './data.service'; 
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, Validators } from '@angular/forms'; 
import { GoogleMapsModule } from '@angular/google-maps'

@Component({ 
    selector: 'business', 
    standalone: true, 
    imports: [RouterOutlet, RouterModule, CommonModule, ReactiveFormsModule, GoogleMapsModule], 
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
    business_lat: any; 
    business_lng: any; 
    map_options: google.maps.MapOptions = {}; 
    map_locations: any[] = [ ]


    constructor(public dataService: DataService, private route: ActivatedRoute,  private formBuilder: FormBuilder) {}

    ngOnInit() {
        const businessId = this.route.snapshot.paramMap.get('id');
        console.log('Looking for business with ID:', businessId); // Debug log
        
        // Initialize Google Maps if we have business data
        if (this.business_list?.length && this.business_list[0]?.places?.length) {
            const place = this.business_list[0].places[0];
            
            // Set coordinates from business location
            if (place?.location?.coordinates) {
                this.business_lat = place.location.coordinates.latitude;
                this.business_lng = place.location.coordinates.longitude;

                // Initialize map options
                this.map_options = {
                    mapId: "DEMO_MAP_ID",
                    center: { 
                        lat: this.business_lat,
                        lng: this.business_lng 
                    },
                    zoom: 15
                };

                // Add marker for business location
                this.map_locations = [{
                    lat: this.business_lat,
                    lng: this.business_lng
                }];
            }
        }

        if (businessId) {
            this.business_list = this.dataService.getBusiness(businessId);
            console.log('Found business data:', this.business_list); // Debug log

            // Start photos array if available
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
