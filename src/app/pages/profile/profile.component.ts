import {Component, OnDestroy, OnInit} from '@angular/core';
import {UsersService} from "../../service/users.service";
import {
  Assignment,
  AssignmentDetails,
  Course,
  Stream,
  StreamListResponse,
  UserResponse
} from "../../shared/interfaces/responses";
import {EMPTY, Subject, switchMap, takeUntil, tap} from "rxjs";
import {FormControl, FormGroup} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../service/auth.service";
import {ROUTES} from "../../constants/routes";
import {MatDialog} from "@angular/material/dialog";
import {StreamModalComponent} from "../../components/stream-modal/stream-modal.component";
import {PageEvent} from "@angular/material/paginator";
import {StreamService} from "../../service/stream.service";
import {CourseService} from "../../service/course.service";
import {CourseModalComponent} from "../../components/course-modal/course-modal.component";
import {ToastrService} from "../../service/toastr.service";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  public user!: UserResponse;
  public mode!: 'me' | 'other';
  private destroy$ = new Subject<void>();
  public editMode: boolean = false;
  public form!: FormGroup;
  public role!: 'admin' | 'user';
  public endedStreams: Stream[] = [];
  public activeStreams: Stream[] = [];
  public total!: number;
  public pageSize = 10;
  public selectedStreams = new FormControl('active');
  public myCourses: Course[] = [];
  public myAssignments: Assignment[] = [];
  public totalCourses = 0;
  public totalAssignments = 0;
  private currentAssignmentPage = 1;

  constructor(
    private readonly usersService: UsersService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly authService: AuthService,
    private readonly streamService: StreamService,
    private readonly courseService: CourseService,
    private readonly router: Router,
    private readonly toastrService: ToastrService,
    private readonly dialog: MatDialog
  ) {
    this.form = new FormGroup({
      name: new FormControl(''),
      about: new FormControl('')
    })
  }

  public ngOnInit(): void {
    this.activatedRoute.params
      .pipe(
        switchMap(params => {
          if(params['id'] && +params['id'] !== this.authService.authedId.getValue()) {
            this.mode = 'other';
            return this.usersService.getUser(+params['id'])
          }
          this.mode = 'me';
          return this.usersService.getMe()
        }),
        tap(user => {
          this.getActiveStreams(user.id);
        })
      )
      .subscribe(user => this.recordUser(user));

    this.authService.authedRole
      .pipe(takeUntil(this.destroy$))
      .subscribe(role => this.role = role!);

    this.listenStreams();
    this.listenCourses();
    this.listenAssignments();
  }

  private listenStreams(): void {
    this.selectedStreams.valueChanges
      .pipe(
        switchMap(value => {
          this.total = 0;
          if (value === 'active') {
            return this.usersService.getActiveStreams(this.user.id);
          }
          if (value === 'ended') {
            return this.usersService.getEndedStreams(this.user.id, this.pageSize, 1)
          }

          if (value === 'planed') {
            return this.usersService.getPlanedStreams('', this.user.id)
          }
          return EMPTY
        })
      )
      .subscribe(value => {
        const length = (value as Stream[]).length;
        if (length) {
          this.endedStreams = value as Stream[]
        } else {
          const response = value as StreamListResponse;
          this.endedStreams = response.data;
          this.total = response.totalPages;
        }
      })
  }

  private listenCourses(): void {
    this.courseService.getMyCourses(this.pageSize, 1)
      .subscribe(response => {
        this.myCourses = response.data;
        this.totalCourses = response.totalPages
      })
  }

  private listenAssignments(): void {
    this.courseService.getMyAssignmentsList(this.pageSize, 1)
      .subscribe(response => {
        this.myAssignments = response.data;
        this.totalAssignments = response.totalPages
      })
  }

  public onCoursePage(event: PageEvent): void {
    this.courseService.getMyCourses(this.pageSize, event.pageIndex + 1)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.myCourses = response.data;
        this.total = response.totalPages;
      })
  }

  public editAssignment(id: number, event: Event): void {
    event.stopPropagation();
    this.courseService.openAssignmentEditModal(id)
      .subscribe(() => this.toastrService.setSuccess('Assignment successfully updated'))
  }

  public deleteAssignment(id: number, event: Event): void {
    event.stopPropagation();
    this.courseService.deleteAssignment(id)
      .pipe(
        switchMap(() => this.courseService.getMyAssignmentsList(this.pageSize, this.currentAssignmentPage))
      )
      .subscribe((response) => {
        this.myAssignments = response.data;
        this.total = response.totalPages;
      })
  }

  public onAssignmentPage(event: PageEvent): void {
    this.currentAssignmentPage = event.pageIndex + 1;
    this.courseService.getMyAssignmentsList(this.pageSize, event.pageIndex + 1)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.myAssignments = response.data;
        this.total = response.totalPages;
      })
  }

  public downloadHandler(id: number):void {
    this.streamService.getRecordStream(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.streamService.downLoadFile(data, 'video\/mp4'))
  }

  public clickHandler(id: number): void {
    switch(this.selectedStreams.value) {
      case 'ended':
        return this.downloadHandler(id)
      case 'active':
        this.router.navigate(['/stream', id])
        return
      case 'planed':
        this.streamService.startStream(id)
          .subscribe(() => this.router.navigate(['/stream', id]))
    }
  }

  public onPage(event: PageEvent): void {
    this.usersService.getEndedStreams(this.user.id, this.pageSize, event.pageIndex + 1)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.endedStreams = response.data;
        this.total = response.totalPages;
      })
  }

  private getActiveStreams(userId: number): void {
    this.usersService.getActiveStreams(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.activeStreams = response;
      })
  }

  public logout(): void {
    this.authService.logout();
    this.router.navigate([ROUTES.AUTH])
  }

  public openStreamModal(): void {
    this.dialog.open(StreamModalComponent, {
      width: '60%',
      height: '80vh',
    })
  }

  public openAssignmentModal(): void {
    const modal = this.dialog.open(CourseModalComponent)

    modal.afterClosed()
      .pipe(
        switchMap(value => this.courseService.addAssignment(value))
      )
      .subscribe(() => {
        this.toastrService.setSuccess('Assignment was added')
      })
  }

  public onSubscribe(): void {
    this.usersService.subscribe(this.user.id)
      .pipe(
        switchMap(_ => {
          return this.usersService.getUser(this.user.id)
        })
      )
      .subscribe(user => this.recordUser(user));
  }

  public onUnsubscribe(): void {
    this.usersService.unsubscribe(this.user.id)
      .pipe(
        switchMap(_ => {
          return this.usersService.getUser(this.user.id)
        })
      )
      .subscribe(user => this.recordUser(user));
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private recordUser(user:UserResponse) {
    this.form.setValue({
      name: user.name,
      about: user.about
    })
    this.user = user;
  }

  public onSubmit() {
    if(this.form.valid) {
      const {name, about} = this.form.value;
      this.usersService.updateMe({ name, about })
        .subscribe(response => {
          this.recordUser(response);
          this.editMode = false;
        })
    }
  }
}
