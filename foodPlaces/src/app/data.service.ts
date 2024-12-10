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
    getBusinesses(page: number) {
        // Find the city that has places (in this case, Armagh)
        const cityData = (jsonData as any []).find((city: any) => city.city_name === 'Armagh');
        
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

    getLastPageNumber() { 
        const cityData = (jsonData as any[])[0];  // Get same city data
        const totalPlaces = cityData?.places?.length;
        return Math.ceil(totalPlaces / this.pageSize);  
    } 
}

/* 
Note: 
as any[] tells Typescript that jsonData is an array to fix .slice error
const cityData fixes the pageSize pagnation in terms of correctly doing it
*/