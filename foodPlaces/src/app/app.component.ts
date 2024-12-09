import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BusinessesComponent } from './businesses.component';
import jsonData from '../assets/foodPlaces.json';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BusinessesComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {
  title = 'foodPlaces';
  ngOnInit() {
    console.log(jsonData);
  }
}
