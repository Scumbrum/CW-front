import {Component, OnInit} from '@angular/core';
import {PlanItem, UserAssignment} from "../../shared/interfaces/responses";
import {CourseService} from "../../service/course.service";
import {PageEvent} from "@angular/material/paginator";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-user-assignments',
  templateUrl: './user-assignments.component.html',
  styleUrls: ['./user-assignments.component.css']
})
export class UserAssignmentsComponent implements OnInit {
  public assignments: UserAssignment[] = []
  public pageSize = 10;
  public total = 0;

  constructor(
    private readonly courseService: CourseService,
    private readonly activateRoute: ActivatedRoute,
  ) {}

  public ngOnInit(): void {
    this.courseService.getUserAssignments(this.activateRoute.snapshot.params['id'], this.pageSize, 1)
      .subscribe(value => {
        this.assignments = value.data;
        this.total = value.total;
      })
  }

  public onPage(event: PageEvent): void {
    this.courseService.getUserAssignments(this.activateRoute.snapshot.params['id'], this.pageSize, event.pageIndex + 1)
      .subscribe(value => {
        this.assignments = value.data;
        this.total = value.total
      })
  }
}
