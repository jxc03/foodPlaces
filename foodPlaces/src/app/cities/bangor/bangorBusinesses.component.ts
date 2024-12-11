import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { DataService } from '../../data.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'bangorBusinesses',
  imports: [RouterOutlet, RouterModule, CommonModule],
  providers: [DataService],
  templateUrl: './bangorBusinesses.component.html',
  styleUrls: ['./bangorBusinesses.component.css']
})

export class BangorBusinessesComponent {
  business_list: any = [];
  page: number = 1;
  cityId: string = 'c_ban';
  
  constructor(public dataService: DataService) { }

  ngOnInit() {
    if (sessionStorage['page']) {
      this.page = Number(sessionStorage['page']); 
    }

    this.business_list = this.dataService.getBusinesses(this.page, this.cityId);
    console.log('Raw data:', this.business_list);
    console.log('Places array:', this.business_list?.places);
  }

  previousPage() { 
    if (this.page > 1){
      this.page = this.page - 1 
      sessionStorage['page'] = this.page;
      this.business_list = this.dataService.getBusinesses(this.page, this.cityId);
    }
  } 

  nextPage() { 
    if (this.page < this.dataService.getLastPageNumber()){
      this.page = this.page + 1 
      sessionStorage['page'] = this.page;
      this.business_list = this.dataService.getBusinesses(this.page, this.cityId);
    }
  }
}

/*
styleUrl to styleUrls ['...'] to fix error after putting each city in their own folder
*/