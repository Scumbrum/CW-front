import { Injectable } from '@angular/core';
import {HttpParams} from "@angular/common/http";
import {
  AssignmentDetails,
  AssignmentResponse,
  Course,
  CourseDataWithPlan,
  CourseListResponse, CourseSubscription, Plan, PlanItem, PlanItemResponse,
  SubscriptionResponse, UserAssignmentResponse
} from "../shared/interfaces/responses";
import {ApiService} from "./api.service";
import {EMPTY, map, Observable, switchMap, zip} from "rxjs";
import {
  AddTaskRequest,
  AssignmentAddRequest, AssignmentEditRequest,
  CourseRequestData,
  PlanItemRequestData,
  PlanRequestData, Task, UserRecordData
} from "../shared/interfaces/params";
import {CourseModalComponent} from "../components/course-modal/course-modal.component";
import {MatDialog} from "@angular/material/dialog";

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private baseUrl = 'courses';
  constructor(
    private readonly api: ApiService,
    private readonly dialog: MatDialog
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

  public getUserPlans(size: number, pageNumber: number): Observable<PlanItemResponse> {
    const params = new HttpParams({
      fromObject: {
        size,
        pageNumber,
      }
    })
    return this.api.get<PlanItemResponse>(`${this.baseUrl}/plans`, params);
  }

  public getUserAssignments(planItem: number, size: number, pageNumber: number): Observable<UserAssignmentResponse> {
    const params = new HttpParams({
      fromObject: {
        size,
        pageNumber,
        planItem
      }
    })
    return this.api.get<UserAssignmentResponse>(`${this.baseUrl}/users-assignments`, params);
  }

  public getCertificates(): Observable<number[]> {
    return this.api.get<number[]>(`${this.baseUrl}/certificate`);
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

  public getMyCourses(size: number, pageNumber: number): Observable<CourseListResponse> {
    const params = new HttpParams({
      fromObject: {
        size,
        pageNumber,
      }
    })
    return this.api.get<CourseListResponse>(`${this.baseUrl}/my-courses`, params);
  }

  public addCourseSubscription(id: number): Observable<CourseSubscription> {
    return this.api.post<Object, CourseSubscription>(`${this.baseUrl}/subscription/${id}`, {});
  }

  public addAssignment(data: AssignmentAddRequest): Observable<AssignmentDetails> {
    return this.api.post<AssignmentAddRequest, AssignmentDetails>(`${this.baseUrl}/assignment`, data);
  }

  public getAssignment(id: number, userId?: number): Observable<AssignmentDetails> {
    const params = new HttpParams({
      fromObject: {
        userId: userId || ''
      }
    })
    return this.api.get<AssignmentDetails>(`${this.baseUrl}/assignment/${id}`, params);
  }

  public openAssignmentEditModal(id: number) {
    let assignment!: AssignmentDetails;
    return this.getAssignment(id)
      .pipe(switchMap(details => {
          const modal = this.dialog.open(CourseModalComponent, {
            data: details
          })

          assignment = details;

          return modal.afterClosed();
        }),
        switchMap(value => {
          if (!value) return EMPTY;

          return this.updateAssignment(assignment, value)
        }))
  }

  public updateAssignment(details: AssignmentDetails, data: AssignmentAddRequest) {
    const assignment = this.editAssignment(details.data.id, {
      name: data.name,
      type: data.type,
      time: data.time,
      minimumScore: data.minimumScore
    });

    const questionsToAdd = data.taskArray.filter(task => !task.id);
    const questionsToRemove = details.questions
      .filter(question => !data.taskArray.some(other => other.id && other.id === question.taskId));
    const questionsToUpdate = data.taskArray
      .filter(question => {
        if (!question.id) return;
        const prev = details.questions.find(other => other.taskId === question.id);
        let prevTask: Task;

        if (prev) {
          prevTask = {
            question: prev.question,
            id: prev.taskId,
            type: prev.taskType,
            score: prev.taskScore,
            correctComment: prev.correctComment,
            answers: prev.answerCases.map(answer => ({
              id: answer.answerCaseId,
              option: answer.answerCaseText,
              isCorrect: answer.isAnswerCorrect
            })),
          }
        }

        return prev && JSON.stringify(prevTask!) !== JSON.stringify(question);
      });

    const observables: Observable<number | Task>[] = [];

    questionsToAdd.forEach(question =>  observables.push(this.addAssignmentTask({
      ...question,
      assignmentId: details.data.id
    })));

    questionsToUpdate.forEach(question =>  observables.push(this.editAssignmentTask(question.id!, {
      ...question
    })));

    if (questionsToRemove.length) {
      observables.push(this.deleteAssignmentTask(questionsToRemove.map(question => question.taskId)));
    }

    return zip([
      ...observables,
      assignment
    ])
  }

  public editCourse(id: number, data: CourseRequestData): Observable<Course> {
    return this.api.put<CourseRequestData, Course>(`${this.baseUrl}/course/${id}`, data);
  }

  public addAssignmentUserRecord(data: UserRecordData): Observable<UserAssignmentResponse> {
    return this.api.post<UserRecordData, UserAssignmentResponse>(`${this.baseUrl}/assignment-record`, data);
  }

  public markPlanAsDone(id: number): Observable<Plan> {
    return this.api.post<{ planItem: number }, Plan>(`${this.baseUrl}//assignment/done`, { planItem: id });
  }

  public editAssignment(id: number, data: AssignmentEditRequest): Observable<UserAssignmentResponse> {
    return this.api.put<AssignmentEditRequest, UserAssignmentResponse>(`${this.baseUrl}/assignment/${id}`, data);
  }

  public addAssignmentTask(data: AddTaskRequest): Observable<Task> {
    return this.api.post<AddTaskRequest, Task>(`${this.baseUrl}/task`, data);
  }

  public editAssignmentTask(id: number, data: Task): Observable<number> {
    return this.api.put<Task, number>(`${this.baseUrl}/task/${id}`, data);
  }

  public deleteAssignmentTask(ids: number[]): Observable<number> {
    return this.api.post<{ids: number[]}, number>(`${this.baseUrl}/task/delete`,  { ids });
  }

  public editAssignmentUserRecord(recordId: number, data: UserRecordData): Observable<UserAssignmentResponse> {
    return this.api.put<UserRecordData, UserAssignmentResponse>(`${this.baseUrl}/assignment-record/${recordId}`, data);
  }

  public addCourse(data: CourseRequestData): Observable<CourseDataWithPlan> {
    return this.api.post<CourseRequestData, CourseDataWithPlan>(`${this.baseUrl}`, data);
  }

  public deleteCourse(id: number): Observable<number> {
    return this.api.delete<number>(`${this.baseUrl}/course/${id}`);
  }

  public deleteAssignment(id: number): Observable<number> {
    return this.api.delete<number>(`${this.baseUrl}/assignment/${id}`);
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

  public getCertificateUrl(id: number): Observable<string> {
    return this.api.get<ArrayBuffer>(`${this.baseUrl}/certificate/${id}`, undefined, 'blob')
      .pipe(map(value => {
        const blob = new Blob([value], {type: 'application/pdf'})
        return URL.createObjectURL(blob);
      }))
  }
}
