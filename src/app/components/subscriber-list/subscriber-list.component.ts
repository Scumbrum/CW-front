import {Component, OnInit} from '@angular/core';
import {UsersService} from "../../service/users.service";
import {Subscription} from "../../shared/interfaces/responses";
import {PageEvent} from "@angular/material/paginator";
import {CourseService} from "../../service/course.service";

@Component({
  selector: 'app-subscriber-list',
  templateUrl: './subscriber-list.component.html',
  styleUrls: ['./subscriber-list.component.css']
})
export class SubscriberListComponent implements OnInit {
  public subscruption: Subscription[] = []
  public pageSize = 10;
  public total!:number;
  public pageCourseSize = 10;
  public totalCourses!:number;
  public courseSubscription: Subscription[] = []

  constructor(
    private readonly usersService: UsersService,
    private readonly courseService: CourseService
  ) {}
  public ngOnInit(): void {
    this.usersService.getSubscriptions(this.pageSize, 1)
      .subscribe(response => {
        this.subscruption = response.data;
        this.total = response.total;
      })

    this.courseService.getCourseSubscriptions(this.pageCourseSize, 1)
      .subscribe(value => {
        this.courseSubscription = value.data;
        this.totalCourses = value.total;
      })
  }

  public loadMore(event: PageEvent) {
    this.usersService.getSubscriptions(this.pageSize, event.pageIndex)
      .subscribe(response => {
        this.subscruption = response.data;
        this.total = response.total;
      })
  }

  public loadCourseMore(event: PageEvent) {
    this.usersService.getSubscriptions(this.pageSize, event.pageIndex)
      .subscribe(response => {
        this.courseSubscription = response.data;
        this.totalCourses = response.total;
      })
  }
}
