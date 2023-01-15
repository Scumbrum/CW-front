import {Component, OnInit} from '@angular/core';
import {UsersService} from "../../service/users.service";
import {Subscription} from "../../shared/interfaces/responses";
import {PageEvent} from "@angular/material/paginator";

@Component({
  selector: 'app-subscriber-list',
  templateUrl: './subscriber-list.component.html',
  styleUrls: ['./subscriber-list.component.css']
})
export class SubscriberListComponent implements OnInit {
  public subscruption: Subscription[] = []
  public pageSize = 10;
  public total!:number;

  constructor(
    private readonly usersService: UsersService
  ) {}
  public ngOnInit(): void {
    this.usersService.getSubscriptions(this.pageSize, 1)
      .subscribe(response => {
        this.subscruption = response.data;
        this.total = response.total;
      })
  }

  public loadMore(event: PageEvent) {
    this.usersService.getSubscriptions(this.pageSize, event.pageIndex)
      .subscribe(response => {
        this.subscruption = response.data;
        this.total = response.total;
      })
  }
}
