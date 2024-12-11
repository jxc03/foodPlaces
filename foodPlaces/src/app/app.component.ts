import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import jsonData from '../assets/foodPlaces.json';
import { NavComponent } from './nav.component'
import { ArmaghBusinessesComponent } from './cities/armagh/armaghBusinesses.component';
import { BangorBusinessesComponent } from './cities/bangor/bangorBusinesses.component';
import { BelfastBusinessesComponent } from './cities/belfast/belfastBusinesses.component';
import { LisburnBusinessesComponent } from './cities/lisburn/lisburnBusinesses.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavComponent, ArmaghBusinessesComponent,BangorBusinessesComponent, BelfastBusinessesComponent, LisburnBusinessesComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {
  title = 'foodPlaces';
  ngOnInit() {
    console.log(jsonData);
  }
}
