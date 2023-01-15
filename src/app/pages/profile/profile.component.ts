import {Component, OnDestroy, OnInit} from '@angular/core';
import {UsersService} from "../../service/users.service";
import {Stream, UserResponse} from "../../shared/interfaces/responses";
import {Subject, switchMap, takeUntil, tap} from "rxjs";
import {FormControl, FormGroup} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../service/auth.service";
import {ROUTES} from "../../constants/routes";
import {MatDialog} from "@angular/material/dialog";
import {StreamModalComponent} from "../../components/stream-modal/stream-modal.component";
import {PageEvent} from "@angular/material/paginator";
import {StreamService} from "../../service/stream.service";

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
  constructor(
    private readonly usersService: UsersService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly authService: AuthService,
    private readonly streamService: StreamService,
    private readonly router: Router,
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
          this.getEndedStreams(user.id);
          this.getActiveStreams(user.id);
        })
      )
      .subscribe(user => this.recordUser(user));

    this.authService.authedRole
      .pipe(takeUntil(this.destroy$))
      .subscribe(role => this.role = role!);
  }

  private getEndedStreams(userId: number): void {
    this.usersService.getEndedStreams(userId, this.pageSize, 1)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.endedStreams = response.data;
        this.total = response.totalPages;
      })
  }

  public downloadHandler(id: number):void {
    this.streamService.getRecordStream(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.downLoadFile(data, 'video\/mp4'))
  }

  private downLoadFile(data: ArrayBuffer, type: string) {
    let blob = new Blob([data], { type: type});
    let url = window.URL.createObjectURL(blob);
    let pwa = window.open(url);
    if (!pwa || pwa.closed || typeof pwa.closed == 'undefined') {
      alert( 'Please disable your Pop-up blocker and try again.');
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
