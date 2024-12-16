import { Injectable } from '@angular/core';
import jsonData from '../assets/foodPlaces.json'


@Injectable({
    providedIn: 'root'
})

export class DataService {
    pageSize: number = 10;
    /* Works but doesnt do correct page size
    getBusinesses(page: number) {
        return jsonData;
        let pageStart = (page - 1) * this.pageSize; 
        let pageEnd = pageStart + this.pageSize; 
        return (jsonData as any[]).slice(pageStart, pageEnd);
    }
    */

    constructor() {
        // Load saved data from localStorage
        const savedData = localStorage.getItem('businessData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            // Update jsonData with saved data
            if (Array.isArray(parsedData)) {
                for (let i = 0; i < parsedData.length; i++) {
                    if (parsedData[i]?.places) {
                        (jsonData as any[])[i].places = parsedData[i].places;
                    }
                }
            }
        }
    }

    getBusinesses(page: number, cityId: string = 'c_arm') {
        // Find the city that has places (in this case, Armagh)
        const cityData = (jsonData as any []).find((city: any) => city.city_id === cityId);

        if (!cityData) return [];

        // Apply pagination to the places array
        let pageStart = (page - 1) * this.pageSize; 
        let pageEnd = pageStart + this.pageSize; 
        
        /*
        // Log to verify data (you can remove these after testing)
        console.log('Total places:', cityData.places.length);
        console.log('Getting places from:', pageStart, 'to', pageEnd);
        console.log('Places in this page:', cityData.places.slice(pageStart, pageEnd).length);
        */
       
        // Return the city with paginated places
        return [{
            _id: cityData._id,
            city_name: cityData.city_name,
            places: cityData.places.slice(pageStart, pageEnd)
        }];
    }
    /*
    getBusiness(id: string, cityId: string) {
        // First find the correct city
        const cityData = (jsonData as any[]).find((city: any) => 
            city.city_id === cityId
        );

        if (!cityData) return [];

        // Then find the specific business in that city's places
        const business = cityData.places.find((place: any) => 
            place._id.$oid === id
        );

        if (!business) return [];

        // Return in the same format as getBusinesses for consistency
        return [{
            _id: cityData._id,
            city_name: cityData.city_name,
            places: [business]
        }];
        
    }
    */

    getBusiness(businessId: string) {
        // First, search through all cities
        for (const city of jsonData as any[]) {
            // Then search through each city's places
            const place = city.places?.find((p: any) => p._id?.$oid === businessId);
            if (place) {
                return [{
                    _id: city._id,
                    city_name: city.city_name,
                    places: [place]  // Return just the one place in the same format as getBusinesses
                }];
            }
        }
        return [];  // Return empty array if not found
    }

    getLastPageNumber(cityId: string = 'c_arm') { 
        /*const cityData = (jsonData as any[])[0];  // Get same city data*/
        const cityData = (jsonData as any[]).find(city => city.city_id === cityId);
        const totalPlaces = cityData?.places?.length;
        return Math.ceil(totalPlaces / this.pageSize);  
    } 

    postReview(businessId: string, review: any): boolean { 
        let newReview = { 
            author_name: review.author_name, 
            content: review.content, 
            rating: Number(review.rating),
            date_posted: new Date(),
            review_id: `review_${Date.now()}`,
            userEmail: review.userEmail
        }; 
    
        let businessFound = false;
        //const data = jsonData as any[];
    
        for (const city of (jsonData as any[])) {
            if (!city.places) continue;
            
            const place = city.places.find((p: any) => p._id?.$oid === businessId);
            if (place) {
                // Initialize ratings if needed
                if (!place.ratings) {
                    place.ratings = {
                        average_rating: 0,
                        review_count: 0,
                        recent_reviews: []
                    };
                }
    
                // Add new review
                place.ratings.recent_reviews = place.ratings.recent_reviews || [];
                place.ratings.recent_reviews.push(newReview);
    
                // Update statistics
                const oldCount = place.ratings.review_count || 0;
                const newCount = oldCount + 1;
                const oldTotal = (place.ratings.average_rating || 0) * oldCount;
                const newTotal = oldTotal + newReview.rating;
                
                place.ratings.review_count = newCount;
                place.ratings.average_rating = Number((newTotal / newCount).toFixed(1));
                
                businessFound = true;
                localStorage.setItem('businessData', JSON.stringify(jsonData));
                break;
            }
        }
    
        if (!businessFound) {
            console.error('Business not found:', businessId);
            return false;
        }
    
        return true;
    }
    
    editReview(businessId: string, reviewId: string, reviewData: any): boolean {
        for (const city of (jsonData as any[])) {
            if (!city.places) continue;
            
            const place = city.places.find((p: any) => p._id?.$oid === businessId);
            if (place?.ratings?.recent_reviews) {
                const reviewIndex = place.ratings.recent_reviews.findIndex(
                    (r: any) => r.review_id === reviewId
                );
    
                if (reviewIndex !== -1) {
                    // Keep original review_id and add edit information
                    place.ratings.recent_reviews[reviewIndex] = {
                        ...reviewData,
                        review_id: reviewId,
                        edited: true,
                        edit_date: new Date(),
                        userEmail: reviewData.userEmail || place.ratings.recent_reviews[reviewIndex].userEmail
                    };
                    
                    // Recalculate average rating if needed
                    this.updateAverageRating(place);
                    localStorage.setItem('businessData', JSON.stringify(jsonData));
                    return true;
                }
            }
        }
        return false;
    }

    private updateAverageRating(place: any) {
        if (place.ratings?.recent_reviews?.length) {
            const reviews = place.ratings.recent_reviews;
            const totalRating = reviews.reduce((sum: number, r: any) => sum + Number(r.rating), 0);
            place.ratings.average_rating = Number((totalRating / reviews.length).toFixed(1));
        }
    }
    
    deleteReview(businessId: string, reviewId: string): boolean {
        let reviewDeleted = false;
    
        for (const city of (jsonData as any[])) {
            if (!city.places) continue;
            
            const place = city.places.find((p: any) => p._id?.$oid === businessId);
            if (place?.ratings?.recent_reviews) {
                const reviewIndex = place.ratings.recent_reviews.findIndex(
                    (r: any) => r.review_id === reviewId
                );
    
                if (reviewIndex !== -1) {
                    // Remove the review
                    place.ratings.recent_reviews.splice(reviewIndex, 1);
                    
                    // Update review count
                    place.ratings.review_count = place.ratings.recent_reviews.length;
    
                    // Recalculate average rating
                    if (place.ratings.recent_reviews.length > 0) {
                        const reviews = place.ratings.recent_reviews;
                        const totalRating = reviews.reduce((sum: number, r: any) => sum + Number(r.rating), 0);
                        place.ratings.average_rating = Number((totalRating / reviews.length).toFixed(1));
                    } else {
                        place.ratings.average_rating = 0;
                    }
    
                    reviewDeleted = true;
                    localStorage.setItem('businessData', JSON.stringify(jsonData));
                    break;
                }
            }
        }
    
        return reviewDeleted;
    }
    
    /*
    postReview(businessId: string, review: any) { 
        let newReview = { 
            'author_name': review.author_name, 
            'content': review.content, 
            'rating': Number(review.rating),
            'date_posted': new Date()
        }; 
    
        // Type assertion for jsonData
        const data = jsonData as any[];
    
        // Iterate through all cities to find the business
        for (const city of data) {
            const place = city.places.find((p: any) => p._id.$oid === businessId);
            if (place) {
                // Initialize ratings if it doesn't exist
                if (!place.ratings) {
                    place.ratings = {
                        average_rating: 0,
                        review_count: 0,
                        recent_reviews: []
                    };
                }
                
                // Initialize recent_reviews if it doesn't exist
                if (!place.ratings.recent_reviews) {
                    place.ratings.recent_reviews = [];
                }
    
                // Add the new review to recent reviews
                place.ratings.recent_reviews.push(newReview);
    
                // Update review count and average rating incrementally
                const oldCount = place.ratings.review_count || 0;
                const oldAverage = place.ratings.average_rating || 0;
                
                // Calculate new total and count
                const newCount = oldCount + 1;
                const newTotal = (oldAverage * oldCount) + Number(newReview.rating);
                const newAverage = Number((newTotal / newCount).toFixed(1));
    
                // Update the statistics
                place.ratings.review_count = newCount;
                place.ratings.average_rating = newAverage;
                
                break;  // Exit loop once found
            }
        }
    }
    */
    
    private calculateAverageRating(reviews: any[]): number {
        if (!reviews.length) return 0;
        const sum = reviews.reduce((acc, review) => acc + Number(review.rating), 0);
        return Number((sum / reviews.length).toFixed(1));
    }
}

/* 
Note: 
as any[] tells Typescript that jsonData is an array to fix .slice error
const cityData fixes the pageSize pagnation in terms of correctly doing it
 cityId: string = 'c_arm' defaults to armagh
*/