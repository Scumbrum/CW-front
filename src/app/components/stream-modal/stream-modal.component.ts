import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {UserResponse} from "../../shared/interfaces/responses";
import {UsersService} from "../../service/users.service";
import {FormControl, Validators} from "@angular/forms";
import {debounceTime, Subject, switchMap, takeUntil} from "rxjs";
import {StreamService} from "../../service/stream.service";
import {Router} from "@angular/router";
import {SelectOption} from "../../shared/interfaces/params";
import {ToastrService} from "../../service/toastr.service";
import {DateTime} from "luxon";

@Component({
  selector: 'app-stream-modal',
  templateUrl: './stream-modal.component.html',
  styleUrls: ['./stream-modal.component.css']
})
export class StreamModalComponent implements OnInit, OnDestroy{

  public selectedModerators: UserResponse[] = [];
  public currentUsers: UserResponse[] = []
  private pageSize: number = 5;
  private currentPage: number = 0;
  private totalPages!: number;
  public userQuery = new FormControl('' );
  public streamName = new FormControl('', [Validators.required]);
  public streamType = new FormControl(1, [Validators.required]);
  public dateStart = new FormControl(new Date(), [Validators.required]);
  public timeStart = new FormControl<string>(DateTime.now().toFormat('h:mm a'), [Validators.required]);
  private destroy$ = new Subject<void>();
  public startDate!: Date;

  public typeList: SelectOption[] = [
    {
      id: 1,
      label: 'Camera'
    },
    {
      id: 2,
      label: 'Screen'
    }
  ]
  constructor(
    private readonly usersService: UsersService,
    private readonly streamService: StreamService,
    private readonly dialogRef: MatDialogRef<StreamModalComponent>,
    private readonly router: Router,
    private readonly toastrService: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: {onlyPlan: boolean}
  ) {}

  public close(): void {
    this.dialogRef.close();
  }

  public ngOnInit(): void {
    this.loadMore();
    this.userQuery.valueChanges
      .pipe(
        debounceTime(500),
        switchMap(name => this.usersService.getUsers(this.pageSize, 1, name!)),
        takeUntil(this.destroy$)
      )
      .subscribe(users => {
        this.currentUsers = users.data;
        this.totalPages = users.totalPages;
        this.currentPage = 1;
      });

    const today = new Date();

    if (this.data?.onlyPlan) {
      today.setDate(today.getDate() + 1);
    }

    this.startDate = today;

    this.timeStart.setValue(DateTime.fromJSDate(this.startDate).toFormat('h:mm a'))
  }

  public get minTime(): DateTime {
    return DateTime.fromJSDate(this.dateStart.value!);
  }

  public addToModerators(moderator: UserResponse): void {
      this.selectedModerators = [...this.selectedModerators, moderator]
      this.currentUsers = this.currentUsers.filter(user => user.id !== moderator.id)
  }

  public removeFromModerators(moderator: UserResponse): void {
    this.selectedModerators  = this.selectedModerators.filter(user => user.id !== moderator.id)
  }

  public get dataValid(): boolean {
    return this.streamName.valid
  }

  public onSubmit():void {
    this.streamName.markAsTouched();
    if(!this.dataValid) return
    const rawDate = this.dateStart.value!;

    const rawTime = DateTime.fromFormat(this.timeStart.value!, 'h:mm a');
    rawDate.setHours(rawTime.get('hour'));
    rawDate.setMinutes(rawTime.get('minute'));

    if (this.data.onlyPlan && rawDate.valueOf() <= new Date().valueOf()) {
      this.toastrService.setError('Chose future date');
      return;
    }


    const date = this.streamService.dateToString(rawDate);
    const moderators =  this.selectedModerators.map(moderator => moderator.id);
    this.streamService.createStream({
      name: this.streamName.value!,
      moderators,
      dateStart: date,
      type: this.streamType.value!
    })
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(response => {
        if (response.planed) {
          this.toastrService.setSuccess('Stream created')
        } else {
          this.router.navigate(['stream', response.id]);
        }
        this.dialogRef.close(response);
      })
  }

  public loadMore(): void {
    this.usersService.getUsers(this.pageSize, ++this.currentPage, this.userQuery.value!)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(users => {
        const filtered = users.data.filter(user => !this.selectedModerators.some(moderator => moderator.id === user.id))
        this.currentUsers = [...this.currentUsers, ...filtered];
        this.totalPages = users.totalPages;
      })

  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
