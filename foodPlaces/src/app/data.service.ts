import { Injectable } from '@angular/core';
import jsonData from '../assets/foodPlaces.json'


@Injectable({
    providedIn: 'root'
})

export class DataService {
    getBusinesses() {
        return jsonData;
    }
}