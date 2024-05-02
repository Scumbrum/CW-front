import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {
  AssignmentResponse,
  Course,
  CourseDataWithPlan,
  CourseListResponse, CourseSubscription,
  StreamListResponse,
  SubscriptionResponse
} from "../shared/interfaces/responses";
import {ApiService} from "./api.service";
import {Observable} from "rxjs";
import {CourseRequestData, PlanItemRequestData, PlanRequestData} from "../shared/interfaces/params";

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private baseUrl = 'courses';
  constructor(
    private readonly api: ApiService
  ) { }

  public getCourseSubscriptions(size: number, pageNumber: number) {
    const params = new HttpParams({
      fromObject: {
        size,
        pageNumber
      }
    })
    return this.api.get<SubscriptionResponse>(`${this.baseUrl}/subscribed`, params);
  }

  public getCourseList(size: number, pageNumber: number, name?: string): Observable<CourseListResponse> {
    const params = new HttpParams({
      fromObject: {
        size,
        pageNumber,
        name: name || ''
      }
    })
    return this.api.get<CourseListResponse>(`${this.baseUrl}`, params);
  }

  public getMyAssignmentsList(size: number, pageNumber: number): Observable<AssignmentResponse> {
    const params = new HttpParams({
      fromObject: {
        size,
        pageNumber,
      }
    })
    return this.api.get<AssignmentResponse>(`${this.baseUrl}/my-assignments`, params);
  }

  public getCourseDetails(id: number): Observable<CourseDataWithPlan> {
    return this.api.get<CourseDataWithPlan>(`${this.baseUrl}/course/${id}`);
  }

  public addCourseSubscription(id: number): Observable<CourseSubscription> {
    return this.api.post<Object, CourseSubscription>(`${this.baseUrl}/subscription/${id}`, {});
  }

  public editCourse(id: number, data: CourseRequestData): Observable<Course> {
    return this.api.put<CourseRequestData, Course>(`${this.baseUrl}/course/${id}`, data);
  }

  public addCourse(data: CourseRequestData): Observable<CourseDataWithPlan> {
    return this.api.post<CourseRequestData, CourseDataWithPlan>(`${this.baseUrl}`, data);
  }

  public deleteCourse(id: number): Observable<number> {
    return this.api.delete<number>(`${this.baseUrl}/course/${id}`);
  }

  public addPlanItems(data: PlanRequestData): Observable<CourseDataWithPlan> {
    return this.api.post<PlanRequestData, CourseDataWithPlan>(`${this.baseUrl}/plan`, data);
  }

  public editPlanItem(id: number, data: PlanItemRequestData): Observable<CourseDataWithPlan> {
    return this.api.put<PlanItemRequestData, CourseDataWithPlan>(`${this.baseUrl}/plan/${id}`, data);
  }

  public deletePlanItem(id: number): Observable<number> {
    return this.api.delete<number>(`${this.baseUrl}/plan/${id}`);
  }

  public deleteCourseSubscription(id: number): Observable<CourseSubscription> {
    return this.api.delete<CourseSubscription>(`${this.baseUrl}/subscription/${id}`);
  }

  public getCertificateUrl(id: number): string {
    return `${this.baseUrl}/certificate/${id}`
  }
}
