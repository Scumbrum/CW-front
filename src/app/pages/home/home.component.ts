import {Component, OnDestroy, OnInit} from '@angular/core';
import {StreamService} from "../../service/stream.service";
import {Stream} from "../../shared/interfaces/responses";
import {EMPTY, Subject, switchMap, takeUntil} from "rxjs";
import {AuthService} from "../../service/auth.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  public charts: Stream[] = [];
  public currentRole!: 'admin'| 'user' | null;
  public reported: Stream[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private readonly authService: AuthService,
    private readonly streamService: StreamService
  ) {}

  public ngOnInit(): void {
    this.authService.authedRole
      .pipe(
        takeUntil(this.destroy$),
        switchMap(role => {
          this.currentRole = role;
          if (role === 'user') {
            return this.streamService.getStreamsChart()
          }
          if (role === 'admin') {
            return this.streamService.getStreamsWithReports()
          }
          return EMPTY
        })
      )
      .subscribe(response => {
        if (this.currentRole === 'user') {
          this.charts = response;
        }
        if (this.currentRole === 'admin') {
          this.reported = response;
        }
      });
  }

  public stopStream(id: number): void {
    this.streamService.stopStream(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(_ => this.reported = this.reported.filter(stream => stream.id !== id));
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
