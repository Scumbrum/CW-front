import {Component, OnInit} from '@angular/core';
import {CourseService} from "../../service/course.service";
import {ActivatedRoute, Router} from "@angular/router";
import {EMPTY, map, Observable, Subject, switchMap, takeUntil, zip} from "rxjs";
import {
  Assignment,
  AssignmentDetails,
  Course,
  CourseDataWithPlan, Plan,
  PlanItem,
  Stream, UserAssignmentResponse
} from "../../shared/interfaces/responses";
import {AuthService} from "../../service/auth.service";
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {DatePipe} from "@angular/common";
import {StreamService} from "../../service/stream.service";
import {UsersService} from "../../service/users.service";
import {MatDialog} from "@angular/material/dialog";
import {StreamModalComponent} from "../../components/stream-modal/stream-modal.component";
import {CourseModalComponent} from "../../components/course-modal/course-modal.component";
import {ToastrService} from "../../service/toastr.service";
import {AssignmentAddRequest, Task} from "../../shared/interfaces/params";
import {TestKey} from "@angular/cdk/testing";
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";

@Component({
  selector: 'app-course-details',
  templateUrl: './course-details.component.html',
  providers: [DatePipe],
  styleUrls: ['./course-details.component.css']
})
export class CourseDetailsComponent implements OnInit {
  public isEditCourseMode = false;
  public isEditPlanMode = false;
  public isMyCourse = true;
  public details?: CourseDataWithPlan;
  public courseForm!: FormGroup;
  public planForm!: FormArray;
  public planedStreams!: Stream[];
  public filteredStreams!: Stream[];
  public assignments!: Assignment[];
  public filteredAssignments!: Assignment[];
  public searchAssigment = new FormControl('')
  public searchStream = new FormControl('')
  private searcherDestroy = new Subject<void>();
  private redirectAfterFill = false;

  constructor(
    private readonly courseService: CourseService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly userService: UsersService,
    private readonly authService: AuthService,
    private readonly datePipe: DatePipe,
    private readonly streamService: StreamService,
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly toastrService: ToastrService,
    private readonly sanitizer: DomSanitizer
  ) {
  }

  public ngOnInit(): void {
    this.buildForm();

    this.activatedRoute.params
      .pipe(
        switchMap(params => {
          if (params['id'] !== 'create') {
            return this.courseService.getCourseDetails( params['id'])
          }
          this.toggleEditMode()
          this.redirectAfterFill = true;
          return EMPTY;
        })
      ).subscribe(response => {
        this.details = response;
        this.isMyCourse = this.details.data.userId === this.authService.authedId.getValue()
          || this.authService.authedRole.getValue() === 'admin'
    })
  }

  private listenPlanedStreams(): void {
    this.userService.getPlanedStreams('', this.authService.authedId.getValue())
      .subscribe(value => {
        this.planedStreams = value;
        this.filteredStreams = value;
      })

    this.searchStream.valueChanges
      .pipe(takeUntil(this.searcherDestroy))
      .subscribe(value => this.filteredStreams = this.planedStreams
        .filter(item => item.name.toLowerCase().includes(value!.toLowerCase())))
  }

  public addStream(): void {
    const modal = this.dialog.open(StreamModalComponent, {
      data: {
        onlyPlan: true
      }
    });

    modal.afterClosed()
      .subscribe((stream) => {
        console.log(stream)
        if (!stream) return;
        this.planedStreams = [
          ...this.planedStreams,
          stream
        ];

        this.filteredStreams = this.planedStreams;
      })
  }

  private listenAssignments(): void {
    this.courseService.getMyAssignmentsList(1000, 1)
      .subscribe(value => {
        this.assignments = value.data;
        this.filteredAssignments = value.data;
      })

    this.searchAssigment.valueChanges
      .pipe(takeUntil(this.searcherDestroy))
      .subscribe(value => this.filteredAssignments = this.assignments
        .filter(item => item.name.toLowerCase().includes(value!.toLowerCase())))
  }

  public clearStreamSearch(): void {
    this.searchStream.patchValue('')
  }

  private buildForm(): void {
    this.courseForm = this.fb.group({
      name: ['', Validators.required],
      description: '',
      dateStart: ['', Validators.required],
      dateEnd: ['', Validators.required],
    });

    this.planForm = this.fb.array([]);
  }

  public toggleEditMode(): void {
    if (this.isEditCourseMode) {
      this.isEditCourseMode = false
    } else {
      this.courseForm.patchValue({
        name: this.details?.data.name,
        description: this.details?.data.description,
        dateStart: this.details?.data.dateStart,
        dateEnd: this.details?.data.dateEnd
      });
      this.isEditCourseMode = true
    }
  }

  public togglePlanEditMode(): void {
    if (this.isEditPlanMode) {
      this.isEditPlanMode = false
      this.searcherDestroy.next();
    } else {
      this.listenPlanedStreams();
      this.listenAssignments();
      this.planForm.clear();
      this.details?.plan.forEach(item => {
        this.planForm.push(this.fb.group({
          streamId: [item.streamId, Validators.required],
          assignmentId: [item.assignmentId ? item.assignmentId : 0],
          id: item.planItemId,
          isRemoved: false
        }))
      })
      this.isEditPlanMode = true
    }
  }

  public deletePlanItem(index: number): void {
    const form = this.itemForm(index);
    if (form.value.id) {
      form.patchValue({
        isRemoved: true
      })
    } else {
      this.planForm.controls = this.planForm.controls.filter((value, i) => i !== index);
    }
  }

  public addPlanItem(): void {
    this.planForm.push( this.fb.group({
      streamId: [null, Validators.required],
      assignmentId: [null],
      isRemoved: false
    }))
  }

  public itemForm(index: number): FormGroup {
    return this.planForm.controls[index] as FormGroup;
  }

  public saveCourseChanges(): void {
    let stream!: Observable<Course | CourseDataWithPlan>;

    if (this.details?.data.id) {
      stream = this.editCourseData();
    } else {
      stream = this.addCourseData();
    }

    stream.subscribe((value) => {
      this.isEditCourseMode = false;

      if (this.details) {
        this.details!.data = {
          ...this.details?.data || {},
          ...value
        };
      } else {
        this.details = value as CourseDataWithPlan;
        this.togglePlanEditMode();
      }
    })
  }

  public deleteCourse(): void {
    this.courseService.deleteCourse(this.details!.data.id)
      .subscribe(() => this.router.navigate(['../../']));
  }

  private editCourseData(): Observable<Course> {
    return this.courseService.editCourse(this.details!.data.id, {
      dateEnd: this.datePipe.transform(this.courseForm.value.dateEnd, 'YYYY-MM-dd')!,
      dateStart: this.datePipe.transform(this.courseForm.value.dateStart, 'YYYY-MM-dd')!,
      description: this.courseForm.value.description,
      name: this.courseForm.value.name
    });
  }

  private addCourseData(): Observable<CourseDataWithPlan> {
    return this.courseService.addCourse( {
      dateEnd: this.datePipe.transform(this.courseForm.value.dateEnd, 'YYYY-MM-dd')!,
      dateStart: this.datePipe.transform(this.courseForm.value.dateStart, 'YYYY-MM-dd')!,
      description: this.courseForm.value.description,
      name: this.courseForm.value.name
    });
  }

  public savePlanData(): void {
    const itemsToAdd = this.planForm.controls.filter(control => !control.value.id);
    const itemsToRemove = this.planForm.controls.filter(control => control.value.isRemoved);
    const itemsToUpdate = this.planForm.controls.filter(control => this.details!.plan.some(item => {
      const assignment = control.value.assignmentId === 0 ? null : control.value.assignmentId;
      return item.planItemId === control.value.id
        && (item.streamId !== control.value.streamId
          || item.assignmentId !== assignment)
      }
    ));

    const deletes: Observable<number>[] = itemsToRemove.map(item => this.courseService.deletePlanItem(item.value.id));

    const updates: Observable<CourseDataWithPlan>[] = itemsToUpdate.map(item => this.courseService.editPlanItem(
      item.value.id,
      {
        assignmentId: item.value.assignmentId === 0 ? null : item.value.assignmentId,
        streamId:  item.value.streamId
      }
    ));

    const observables = [...deletes, ...updates];

    if (itemsToAdd.length) {
      observables.push(this.courseService.addPlanItems({
        courseId: this.details!.data.id,
        plans: itemsToAdd.map(item => ({
          assignmentId: item.value.assignmentId === 0 ? null : item.value.assignmentId,
          streamId:  item.value.streamId
        }))
      }))
    }

    zip(observables)
      .pipe(switchMap(() => this.courseService.getCourseDetails(this.details!.data.id)))
      .subscribe(value => {
        this.details = value;
        this.isEditPlanMode = false;
        if (this.redirectAfterFill) {
          this.router.navigate(['/'])
        }
      })
  }

  public isActive() {
    if (!this.details) return false;
    const today = new Date()
    return new Date(this.details?.data.dateStart).valueOf() <= today.valueOf()
      && today.valueOf() <= new Date(this.details?.data.dateEnd).valueOf()
  }

  public startStream(plan: PlanItem): void {
    if (this.isMyCourse && !plan.isActive) {
      this.streamService.startStream(plan.streamId)
        .subscribe(() => this.openInNewWindow(['/stream', plan.streamId]))
    } else {
      if (!plan.assignmentId && !plan.isPassed) {
        this.courseService.markPlanAsDone(plan.planItemId).subscribe()
      }

      if (new Date(plan.startDate).valueOf() < new Date().valueOf() && !plan.isActive) {
        this.streamService.getRecordStream(plan.streamId)
          .subscribe(data => this.streamService.downLoadFile(data, 'video\/mp4'))
      }

      if (plan.isActive) {
        this.openInNewWindow(['/stream', plan.streamId]);
      }
    }
  }

  public assignmentHandler(id: number): void {
    if (this.isMyCourse) {
      this.courseService.openAssignmentEditModal(id)
        .subscribe(() => this.toastrService.setSuccess('Assignment successfully updated'))
    } else {
      this.openInNewWindow(['/assignment', id])
    }
  }

  public addAssignment(): void {
    const modal = this.dialog.open(CourseModalComponent)

    modal.afterClosed()
      .pipe(
        switchMap(value => this.courseService.addAssignment(value))
      )
      .subscribe(value => {
        this.assignments = [
          ...this.assignments,
          value.data
        ];

        this.filteredAssignments = this.assignments;
        this.toastrService.setSuccess('Assignment was added')
      })
  }

  public isPlanValid(): boolean {
    const itemsCount = this.planForm.controls.filter(control => !control.value.isRemoved)
    return this.planForm.valid && itemsCount.length >= 3;
  }

  public isAsync() {
    if (!this.details) return false;
    const today = new Date()
    return today.valueOf() > new Date(this.details?.data.dateEnd).valueOf()
  }

  public minimumPlanPassed(): number {
    if (!this.details) return 0;
    return Math.ceil(this.details.plan.length * 0.7);
  }

  public userScore(): number {
    if (!this.details) return 0;
    return this.details.plan.reduce((acc, item) => acc + (item.score || 0), 0);
  }

  public get certificateUrl(): Observable<SafeResourceUrl> {
    return this.courseService.getCertificateUrl(this.details!.data.id)
      .pipe(map(url => this.sanitizer.bypassSecurityTrustResourceUrl(url)))
  }

  public openInNewWindow(url: any[]): void {
    const urlSerialized = this.router.serializeUrl(
      this.router.createUrlTree(url)
    );

    window.open(urlSerialized, '_blank');
  }

  public getStreamLabel(id: number): string {
    return this.planedStreams.find(stream => stream.id === id)!.name;
  }

  public isSelectedStreamInList(id: number): boolean {
    return this.planedStreams.some(stream => stream.id === id);
  }

  public isRecordStarted(plan: PlanItem): boolean {
    return !!plan.assignmentId && new Date(plan.startDate).valueOf() <= new Date().valueOf()
  }

  public deleteSubscription(): void {
    if (!this.details) return;
    this.courseService.deleteCourseSubscription(this.details.data.id)
      .subscribe(() => this.details!.data.isSubscribed = false)
  }
  public addSubscription(): void {
    if (!this.details) return;
    this.courseService.addCourseSubscription(this.details.data.id)
      .subscribe(() => this.details!.data.isSubscribed = true)
  }
}
