import {Component, OnInit} from '@angular/core';
import {CourseService} from "../../service/course.service";
import {PlanItem} from "../../shared/interfaces/responses";
import {PageEvent} from "@angular/material/paginator";

@Component({
  selector: 'app-my-plans',
  templateUrl: './my-plans.component.html',
  styleUrls: ['./my-plans.component.css']
})
export class MyPlansComponent implements OnInit {
  public plans: PlanItem[] = []
  public pageSize = 10;
  public total = 0;

  constructor(
    private readonly courseService: CourseService
  ) {}

  public ngOnInit(): void {
    this.courseService.getUserPlans(this.pageSize, 1)
      .subscribe(value => {
        this.plans = value.data;
        this.total = value.total;
      })
  }

  public onPage(event: PageEvent): void {
    this.courseService.getUserPlans(this.pageSize, event.pageIndex + 1)
      .subscribe(value => {
        this.plans = value.data;
        this.total = value.total
      })
  }
}
