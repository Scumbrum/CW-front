import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {UserResponse} from "../../shared/interfaces/responses";
import {UsersService} from "../../service/users.service";
import {FormControl, Validators} from "@angular/forms";
import {debounceTime, Subject, switchMap, takeUntil} from "rxjs";
import {StreamService} from "../../service/stream.service";
import {D} from "@angular/cdk/keycodes";
import {Router} from "@angular/router";
import {ROUTES} from "../../constants/routes";

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
  private destroy$ = new Subject<void>();
  constructor(
    private readonly usersService: UsersService,
    private readonly streamService: StreamService,
    private readonly dialogRef: MatDialogRef<StreamModalComponent>,
    private readonly router: Router
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
      })
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
    const date = this.streamService.dateToString(new Date());
    const moderators =  this.selectedModerators.map(moderator => moderator.id);
    this.streamService.createStream({name: this.streamName.value!, moderators, dateStart: date })
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(response => {
        this.router.navigate(['stream', response.id]);
        this.dialogRef.close();
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
