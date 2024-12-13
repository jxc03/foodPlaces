import { Component } from '@angular/core'; 
import { RouterOutlet } from '@angular/router'; 
import { AuthButtonComponent } from './authButton.component';
import { AuthUserComponent } from './authUser.component';

@Component({ 
  selector: 'home', 
  standalone: true, 
  imports: [RouterOutlet, AuthButtonComponent, AuthUserComponent], 
  templateUrl: './home.component.html', 
  styleUrl: './home.component.css' 
}) 

export class HomeComponent { }