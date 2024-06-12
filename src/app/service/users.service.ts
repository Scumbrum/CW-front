import { Injectable } from '@angular/core';
import {ApiService} from "./api.service";
import {
  NotificationListResponse,
  RestrictionResponse, Stream, StreamListResponse, StreamResponse,
  SubscriptionResponse,
  UserResponse,
  UsersListResponse
} from "../shared/interfaces/responses";
import { Observable, repeat } from "rxjs";
import { RestrictionData, SubscriptionData, UserData } from "../shared/interfaces/params";
import { HttpParams } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private baseUrl = 'users';

  constructor(
    private readonly api: ApiService
  ) { }

  public getMe(): Observable<UserResponse> {
    return this.api.get<UserResponse>(`${this.baseUrl}/me`)
  }

  public getActiveStreams(userId: number): Observable<Stream[]> {
    return this.api.get<Stream[]>(`${this.baseUrl}/${userId}/active`)
  }

  public getEndedStreams(userId: number, size: number, pageNumber: number): Observable<StreamListResponse> {
    const params = new HttpParams({
      fromObject: {
        size,
        pageNumber
      }
    })
    return this.api.get<StreamListResponse>(`${this.baseUrl}/${userId}/ended`, params)
  }

  public getPlanedStreams(name: string, userId: number, courseId?: number): Observable<Stream[]> {
    const params = new HttpParams({
      fromObject: {
        name,
        courseId: courseId || ''
      }
    })
    return this.api.get<Stream[]>(`${this.baseUrl}/${userId}/planed`, params)
  }

  public subscribe(id: number): Observable<UserResponse> {
    return this.api.post<SubscriptionData, UserResponse>(`${this.baseUrl}/subscription`, { target: id })
  }

  public addRestriction(id: number, streamId: number, restrictionType: number): Observable<RestrictionResponse> {
    return this.api.post<RestrictionData, RestrictionResponse>(`${this.baseUrl}/${id}/restriction`, { streamId, restrictionType })
  }

  public deleteRestriction(id: number, streamId: number): Observable<RestrictionResponse> {
    const params = new HttpParams({
      fromObject: {
        streamId
      }
    })
    return this.api.delete<RestrictionResponse>(`${this.baseUrl}/${id}/restriction`, params)
  }

  public unsubscribe(id: number): Observable<UserResponse> {
    return this.api.patch<SubscriptionData, UserResponse>(`${this.baseUrl}/subscription`, { target: id })
  }

  public getUser(id: number): Observable<UserResponse> {
    return this.api.get<UserResponse>(`${this.baseUrl}/${id}`)
  }

  public updateMe(data: UserData): Observable<UserResponse> {
    return this.api.put<UserData, UserResponse>(`${this.baseUrl}/me`, data)
  }

  public getSubscriptions(size: number, pageNumber: number) {
    const params = new HttpParams({
      fromObject: {
        size,
        pageNumber
      }
    })
    return this.api.get<SubscriptionResponse>(`${this.baseUrl}/subscription`, params);
  }
  public getUsers(size: number, pageNumber: number, name?: string): Observable<UsersListResponse> {
    const params = new HttpParams({
      fromObject: {
        size,
        pageNumber,
        name: name ?? ''
      }
    })
    return this.api.get<UsersListResponse>(`${this.baseUrl}`, params);
  }

  public listenNotification(size: number, pageNumber: number): Observable<NotificationListResponse> {
    const params = new HttpParams({
      fromObject: {
        size,
        pageNumber
      }
    })
    return this.api.get<NotificationListResponse>(`${this.baseUrl}/notification`, params, 'json', true)
      .pipe(
        repeat({delay: 5000})
      )
  }

  public loadNotification(size: number, pageNumber: number): Observable<NotificationListResponse> {
    const params = new HttpParams({
      fromObject: {
        size,
        pageNumber
      }
    })
    return this.api.get<NotificationListResponse>(`${this.baseUrl}/notification`, params)
  }

  public updateUserBlocked(id: number): Observable<UserResponse> {
    return this.api.patch<undefined, UserResponse>(`${this.baseUrl}/${id}/block`, undefined)
  }

  public markedNotification(id: number): Observable<NotificationListResponse> {
    return this.api.patch<undefined, NotificationListResponse>(`${this.baseUrl}/notification/${id}`, undefined)
  }
}
