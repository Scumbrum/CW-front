import {Component, OnInit} from '@angular/core';
import {UserResponse} from "../../shared/interfaces/responses";
import {UsersService} from "../../service/users.service";
import {PageEvent} from "@angular/material/paginator";

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css']
})
export class UsersListComponent implements OnInit{
  public users: UserResponse[] = []
  public pageSize = 10;
  public total!: number;

  constructor(
    private readonly usersService: UsersService
  ) {}

  public ngOnInit(): void {
    this.usersService.getUsers(this.pageSize, 1)
      .subscribe(response => {
        this.users = response.data;
        this.total = response.totalPages;
      })
  }

  public loadMore(event: PageEvent): void {
    this.usersService.getUsers(this.pageSize, event.pageIndex)
      .subscribe(response => {
        this.users = response.data;
        this.total = response.totalPages;
      })
  }

  public updateHandler(id: number): void {
    this.usersService.updateUserBlocked(id)
      .subscribe(response => {
        this.users = this.users.map(user => {
          if(user.id === id) {
            return { ...user, blocked: !user.blocked };
          }
          return user;
        })
      });
  }
}
