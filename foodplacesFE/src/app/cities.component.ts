import { Component, OnInit } from '@angular/core';
import { CityService } from './city.service'

@Component({
  selector: 'app-cities',
  templateUrl: '/cities.component.html',
  styleUrl: './cities.component.css'
})
export class CitiesComponent implements OnInit {
  cities: any[] = [];

  constructor(private cityService: CityService) { }

  ngOnInit(): void {
    this.cityService.getCities().subscribe((data) => {
      this.cities = data;
    });
  }
}
