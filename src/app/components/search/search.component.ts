import {Component, OnDestroy, OnInit} from '@angular/core';
import {debounceTime,  Subject, switchMap, takeUntil} from "rxjs";
import {FormControl} from "@angular/forms";
import {UsersService} from "../../service/users.service";
import {Stream,  UserResponse} from "../../shared/interfaces/responses";
import {StreamService} from "../../service/stream.service";

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit, OnDestroy {
  public name = new FormControl('');
  public searchTarget = new FormControl('');
  public usersList!: UserResponse[];
  public streamList!: Stream[];
  private destroy$ = new Subject<void>();
  private currentPage = 1;
  private pageSize = 10;
  private totalPages = 1;

  constructor(
    private readonly usersService: UsersService,
    private readonly streamService: StreamService
  ) {
  }

  public ngOnInit(): void {
    this.searchTarget.valueChanges
      .pipe(
        switchMap(target => {
          this.currentPage = 1;
          if(target === 'users') {
            return this.usersService.getUsers(this.pageSize, 1)
          }
          return this.streamService.getStreams(this.pageSize, 1);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(response => {
        if (this.searchTarget.value === 'streams') {
          this.streamList = response.data as Stream[];
          this.totalPages = response.totalPages;
        } else {
          this.usersList = response.data as UserResponse[];
          this.totalPages = response.totalPages;
        }
      })

    this.name.valueChanges
      .pipe(
        debounceTime(500),
        switchMap(name => {
          if(this.searchTarget.value === 'users') {
            return this.usersService.getUsers(this.pageSize, 1, name!)
          }
          return this.streamService.getStreams(this.pageSize, 1, name!);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(response => {
        if (this.searchTarget.value === 'streams') {
          this.streamList = response.data as Stream[];
          this.totalPages = response.totalPages;
        } else {
          this.usersList = response.data as UserResponse[];
          this.totalPages = response.totalPages;
        }
        this.currentPage = 1;
      })
  }

  public onScroll():void {
    if(this.searchTarget.value === 'users') {
      this.usersService.getUsers(this.pageSize, ++this.currentPage, this.name.value!)
        .pipe(
          takeUntil(this.destroy$)
        )
        .subscribe(users => {
          this.usersList = [...this.usersList, ...users.data];
          this.totalPages = users.totalPages;
      })
      return
    }
    this.streamService.getStreams(this.pageSize, ++this.currentPage, this.name.value!)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(users => {
        this.streamList = [...this.streamList, ...users.data];
        this.totalPages = users.totalPages;
      })
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
