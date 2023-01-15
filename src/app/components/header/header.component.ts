import {Component, OnDestroy, OnInit} from '@angular/core';
import {EMPTY, Subject, switchMap, takeUntil, tap} from "rxjs";
import {AuthService} from "../../service/auth.service";
import {UsersService} from "../../service/users.service";
import {NotificationResponse} from "../../shared/interfaces/responses";
import {MatDialog} from "@angular/material/dialog";
import {NotificationModalComponent} from "../notification-modal/notification-modal.component";
import {ToastrService} from "../../service/toastr.service"
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  public isAuth: boolean = false;
  private destroy$ = new Subject<void>();
  public notifications: NotificationResponse[] = [];
  private totalPages!: number;
  public unreaded!: number;
  private pageSize = 10;
  private currentPage = 1;
  public currentRole!: 'admin'| 'user' | null;

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
    private readonly dialog: MatDialog,
    private readonly toastr: ToastrService,
  ) {}

  public ngOnInit(): void {
    this.authService.authedRole
      .pipe(takeUntil(this.destroy$))
      .subscribe(role => this.currentRole = role)

    this.authService.authedId
      .pipe(
        tap(status => this.isAuth = !!status),
        switchMap(status => {
          if(status) {
            return this.userService.listenNotification(this.pageSize, 1)
          }
          return EMPTY;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(notification => {
        if(this.unreaded !== notification.unreaded) {
          this.notifications = notification.data;
          this.totalPages = notification.totalPages;
          this.unreaded = notification.unreaded;
          this.currentPage = 1;
          if(this.unreaded > 0) {
            this.toastr.setInfo('You have new notifications');
          }
        }
      })
  }

  public loadMore(): void {
    this.userService.loadNotification(this.pageSize, ++this.currentPage)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(response => {
        this.notifications = [...this.notifications, ...response.data];
        this.totalPages = response.totalPages;
      })
  }

  public openNotificationModal(notification: NotificationResponse): void {
    const ref = this.dialog.open<NotificationModalComponent, NotificationResponse, boolean>(NotificationModalComponent, {
      width: '40%',
      height: '20vh',
      data: notification
    });

    ref.afterClosed()
      .pipe(
        switchMap(value => {
          if(value) {
            return this.userService.markedNotification(notification.id);
          }
          return EMPTY;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(_ => {
        this.notifications = this.notifications.map(other => {
          if(notification.id === other.id) {
            return {
              ...notification,
              isViewed: true
            }
          }
          return notification
        })
        this.unreaded -= 1;
      })
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
