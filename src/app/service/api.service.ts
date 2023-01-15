import { Injectable } from '@angular/core';
import {environment} from "../environment/environment";
import {BehaviorSubject, catchError, EMPTY, map, Observable, of, Subject, tap, throwError} from "rxjs";
import {HttpClient, HttpParams} from "@angular/common/http";
import { Router} from "@angular/router";
import {ROUTES} from "../constants/routes";

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = `${environment.API_URL}api`;
  private currentRequests = 0;
  private requests = new BehaviorSubject<number>(0);
  public isLoading = new BehaviorSubject<boolean>(false);
  public error = new Subject<string | null>();
  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {
    this.requests
      .subscribe(requests => {
        if(requests === 0) {
          this.isLoading.next(false);
        } else {
          this.isLoading.next(true);
        }
      });
  }

  public post<Body, T>(url: string, body: Body): Observable<T> {
    this.requests.next(++this.currentRequests);
    return this.responsePipe<T>(this.http.post<T>(`${this.baseUrl}/${url}`, body));
  }

  public delete<T>(url: string, params?: HttpParams): Observable<T> {
    this.requests.next(++this.currentRequests);
    return this.responsePipe<T>(this.http.delete<T>(`${this.baseUrl}/${url}`, { params })
      .pipe(
        map(array => array as T)
      ));
  }

  public get url(): string {
    return this.baseUrl;
  }

  public put<Body, T>(url: string, body: Body): Observable<T> {
    this.requests.next(++this.currentRequests);
    return this.responsePipe<T>(this.http.put<T>(`${this.baseUrl}/${url}`, body));
  }

  public patch<Body, T>(url: string, body: Body): Observable<T> {
    this.requests.next(++this.currentRequests);
    return this.responsePipe<T>(this.http.patch<T>(`${this.baseUrl}/${url}`, body));
  }

  public get<T>(url: string, params?: HttpParams, responseType: any = 'json', ignoreLoading = false): Observable<T> {
    if(!ignoreLoading) {
      this.requests.next(++this.currentRequests);
    }
    return this.responsePipe<T>(
      this.http.get(`${this.baseUrl}/${url}`, { params, responseType})
        .pipe(
          map(array => array as T)
        )
      , ignoreLoading);
  }

  private responsePipe<T>(stream: Observable<T>, ignoreLoading: boolean = false): Observable<T> {
    return stream
      .pipe(
        tap(_ => {
          if(!ignoreLoading) {
            this.requests.next(--this.currentRequests);
          }
        }),
        catchError(err => {
          if(!ignoreLoading) {
            this.requests.next(--this.currentRequests);
          }
          if(err.status !== 404 && err.status !== 405) {
            if ( err.error ) {
              this.error.next(err.error.message);
              return EMPTY;
            }
            this.error.next( err.message);
            return EMPTY;
          }
          if(err.status === 403) {
            this.router.navigate([ROUTES.AUTH]);
            return EMPTY;
          }
          return throwError(err.status);
        })
      )
  }

  private bufferToMessage(data: ArrayBuffer): string {
    const decoder = new TextDecoder("utf-8");
    const json = decoder.decode(data);
    return JSON.parse(json).message
  }
}
