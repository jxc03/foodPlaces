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
            const place = city.places.find((p: any) => p._id.$oid === businessId);
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
}

/* 
Note: 
as any[] tells Typescript that jsonData is an array to fix .slice error
const cityData fixes the pageSize pagnation in terms of correctly doing it
 cityId: string = 'c_arm' defaults to armagh
*/