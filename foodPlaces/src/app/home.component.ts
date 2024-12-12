import { Component } from '@angular/core'; 
import { RouterOutlet } from '@angular/router'; 
/*import { AuthButtonComponent } from './authButton.component'*/;

@Component({ 
  selector: 'home', 
  standalone: true, 
  imports: [RouterOutlet, /*AuthButtonComponent*/], 
  templateUrl: './home.component.html', 
  styleUrl: './home.component.css' 
}) 

export class HomeComponent { }