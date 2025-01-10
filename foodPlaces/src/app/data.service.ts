/**
 * Code file to provide functions to retrieve and manipulate business data
 * Functionalities such as fetching paginated data from a JSON file
 */

import { Injectable } from '@angular/core';
import jsonData from '../assets/foodPlaces.json'


@Injectable({
    providedIn: 'root'
})

export class DataService {

    /**
     * Number of businesses per page for pagination
     */
    pageSize: number = 10;

    /* Works but doesnt do correct page size
    getBusinesses(page: number) {
        return jsonData;
        let pageStart = (page - 1) * this.pageSize; 
        let pageEnd = pageStart + this.pageSize; 
        return (jsonData as any[]).slice(pageStart, pageEnd);
    }
    */

    /**
     * Constructor for DataService
     * Loads saved business data
     * Merges the saved data with JSON data if allowed
     */
    constructor() {
        // Load saved data from localStorage
        const savedData = localStorage.getItem('businessData'); // Get businessData from localStorage

        // Check if any data was retrieved from localStorage
        if (savedData) { // If there is 
            const parsedData = JSON.parse(savedData); // Convert savedData
            // Update jsonData with savedData
            if (Array.isArray(parsedData)) { // Check if parsedData is in an array before proccessing
                for (let i = 0; i < parsedData.length; i++) { // Go through each item 
                    if (parsedData[i]?.places) { // Check if it currently contains "places"
                        (jsonData as any[])[i].places = parsedData[i].places; // Update the "places" 
                    }
                }
            }
        }
    }

    /**
     * Fetches businesses for a specific page and city
     * Retrieves businesses associated with the specified city ID
     * Applies pagination to the list of businesses
     * @param page the number of page
     * @param cityId ID for each city
     * @returns {any[]} an array containing the city data with pagination
     */
    getBusinesses(page: number, cityId: string = 'c_arm') {
        // Find the city that has places (in this case, Armagh)
        const cityData = (jsonData as any []).find((city: any) => city.city_id === cityId);

        if (!cityData) return []; // Return an empty array if the city is not found

        // Apply pagination to the places array
        let pageStart = (page - 1) * this.pageSize; // Calculate the start index for the page
        let pageEnd = pageStart + this.pageSize; // Calculate the end index for the page
        
        /*
        // Console log to verify data
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

    /**
     * Fetches the last page number for a specific city
     * Determines the total number of pages based on the city data
     * Divides the total number of places by the page size
     * @param cityId ID for each city
     * @returns {number} the total number of pages for the city's places
     */
    getLastPageNumber(cityId: string = 'c_arm') { 
        // Get city data by ID
        const cityData = (jsonData as any[]).find(city => city.city_id === cityId);
        // Get the total number of places 
        const totalPlaces = cityData?.places?.length; 
        // Calculate and return the total pages
        return Math.ceil(totalPlaces / this.pageSize);  // Diveded by 
    } 

    /**
     * Submits a new review for a business
     * Finds the business by ID and adds the new review
     * Updates the business's average rating and review count
     * @param businessId ID for each business
     * @param review the review details 
     * @returns {boolean} returns true if the review was successfully added, otherwise false
     */
    postReview(businessId: string, review: any): boolean { 
        // Create a new review with provided details
        let newReview = { 
            author_name: review.author_name, 
            content: review.content, 
            rating: Number(review.rating),
            date_posted: new Date(),
            review_id: `review_${Date.now()}`,
            userEmail: review.userEmail
        }; 
        
        // To track if the business was found 
        let businessFound = false; // Can be changed after being declared since of let
        
        // Go through city data to get the business
        for (const city of (jsonData as any[])) {
            if (!city.places) continue; // Skip if the city has no places
            
            const place = city.places.find((p: any) => p._id?.$oid === businessId); // Find the business by ID
            if (place) {
                // Start ratings if needed
                if (!place.ratings) { // Checks
                    place.ratings = {
                        average_rating: 0,  // Default average rating
                        review_count: 0,
                        recent_reviews: []
                    };
                }
    
                // Add new review
                place.ratings.recent_reviews = place.ratings.recent_reviews || []; // Ensure the list exists
                place.ratings.recent_reviews.push(newReview); // Add the new review

    
                // Update review statistics
                const oldCount = place.ratings.review_count || 0; // Previous review count
                const newCount = oldCount + 1; // Increment the review count
                const oldTotal = (place.ratings.average_rating || 0) * oldCount; // Total rating before the new review
                const newTotal = oldTotal + newReview.rating;  // Add the new review rating to the total
                
                place.ratings.review_count = newCount; // Update the review count
                place.ratings.average_rating = Number((newTotal / newCount).toFixed(1)); // Update the average rating
                
                businessFound = true; // Mark the business as found
                localStorage.setItem('businessData', JSON.stringify(jsonData)); // Save updated data to localStorage
                break; // Exit the loop once the business is found
            }
        }
        
        // Handle the case where the business was not found
        if (!businessFound) {
            console.error('Business not found:', businessId); // Log error
            return false; // Return false if fails
        }
    
        return true; // Return true if the review was successfully added
    }
    
    /**
     * Edits an existing review for a business
     * Finds the business and review by their IDs
     * Updates the review content and recalculates the average rating
     * @param businessId ID of business
     * @param reviewId ID of review
     * @param reviewData updated review data
     * @returns {boolean} returns true if the review was successfully updated, otherwise false
     */
    editReview(businessId: string, reviewId: string, reviewData: any): boolean {
        // Go through the city data to locate the business and review
        for (const city of (jsonData as any[])) {
            if (!city.places) continue; // Skip if the city has no places
            
            const place = city.places.find((p: any) => p._id?.$oid === businessId);  // Find the business by ID
            if (place?.ratings?.recent_reviews) {  // Ensure the business and reviews exist
                const reviewIndex = place.ratings.recent_reviews.findIndex(
                    (r: any) => r.review_id === reviewId // Locate the review by ID
                );
    
                if (reviewIndex !== -1) { // If the review is found
                    // Update the review with the new
                    place.ratings.recent_reviews[reviewIndex] = {
                        ...reviewData, // Merge the updated data
                        review_id: reviewId, // Keep the original review ID
                        edited: true, // Mark the review as edited
                        edit_date: new Date(), // Add the edit date
                        userEmail: reviewData.userEmail || place.ratings.recent_reviews[reviewIndex].userEmail // Keep the email
                    };
                    
                    this.updateAverageRating(place); // Recalculate the average rating
                    localStorage.setItem('businessData', JSON.stringify(jsonData)); // Save updated data to localStorage
                    return true;
                }
            }
        }
        return false; // Return false if the review was not foun
    }

    /**
     * Updates the average rating of a business
     * Calculates the new average based on all existing reviews
     * @param place business data containing the reviews
     */
    private updateAverageRating(place: any) {
        if (place.ratings?.recent_reviews?.length) { // Check if there are reviews to calculat
            const reviews = place.ratings.recent_reviews; // Get the list of reviews
            const totalRating = reviews.reduce((sum: number, r: any) => sum + Number(r.rating), 0); // Calculate the total rating
            place.ratings.average_rating = Number((totalRating / reviews.length).toFixed(1)); // Update the average rating
        }
    }
    
    /**
     * Deletes an existing review for a business
     * Finds the business and review by their IDs
     * Removes the review and recalculates the average rating
     * @param businessId ID of business
     * @param reviewId ID of review
     * @returns {boolean} returns true if the review was successfully deleted, otherwise false
     */
    deleteReview(businessId: string, reviewId: string): boolean {
        let reviewDeleted = false; // To track if the review was deleted
        
        // Go through the city data to locate the business and review
        for (const city of (jsonData as any[])) {
            if (!city.places) continue; // Skip if the city has no places
            
            const place = city.places.find((p: any) => p._id?.$oid === businessId); // Find the business by ID
            if (place?.ratings?.recent_reviews) { // Ensure the business and reviews exist
                const reviewIndex = place.ratings.recent_reviews.findIndex(
                    (r: any) => r.review_id === reviewId // Locate the review by ID
                );
    
                if (reviewIndex !== -1) { // If the review is found
                    // Remove the review
                    place.ratings.recent_reviews.splice(reviewIndex, 1); // Delete the review
                    
                    // Update review count
                    place.ratings.review_count = place.ratings.recent_reviews.length;
    
                    // Recalculate average rating
                    if (place.ratings.recent_reviews.length > 0) { // If there are remaining reviews
                        const reviews = place.ratings.recent_reviews; // Get the remaining reviews
                        const totalRating = reviews.reduce((sum: number, r: any) => sum + Number(r.rating), 0); // Calculate the total rating
                        place.ratings.average_rating = Number((totalRating / reviews.length).toFixed(1)); // Update the average rating
                    } else {
                        place.ratings.average_rating = 0; // Set the average rating to 0 if no reviews remain
                    }
    
                    reviewDeleted = true; // Mark the review as deleted
                    localStorage.setItem('businessData', JSON.stringify(jsonData)); // Save updated data to localStorage
                    break; // Exit the loop once the review is deleted
                }
            }
        }
    
        return reviewDeleted; // Return true if the review was deleted, otherwise false
    }
}