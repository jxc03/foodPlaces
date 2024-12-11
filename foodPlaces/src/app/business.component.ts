import { Component } from '@angular/core'; 
import { RouterOutlet, RouterModule, ActivatedRoute,  } from '@angular/router'; 
import { DataService } from './data.service'; 
import { CommonModule } from '@angular/common';

@Component({ 
    selector: 'business', 
    standalone: true, 
    imports: [RouterOutlet, RouterModule, CommonModule], 
    providers: [DataService], 
    templateUrl: './business.component.html', 
    styleUrl: './business.component.css' 
}) 

export class BusinessComponent {
    business_list: any;
    cityId: string = '';

    constructor(public dataService: DataService, private route: ActivatedRoute) {}

    ngOnInit() {
        const businessId = this.route.snapshot.paramMap.get('id');
        console.log('Looking for business with ID:', businessId);  // Debug log

        if (businessId) {
            this.business_list = this.dataService.getBusiness(businessId);
            console.log('Found business data:', this.business_list);  // Debug log
        }
    }
}