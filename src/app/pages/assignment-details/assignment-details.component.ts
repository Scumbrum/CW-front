import {Component, OnInit} from '@angular/core';
import {CourseService} from "../../service/course.service";
import {AssignmentDetails, UserAssignmentResponse} from "../../shared/interfaces/responses";
import {ActivatedRoute} from "@angular/router";
import {combineLatest, Observable, switchMap} from "rxjs";
import {UserAnswer} from "../../shared/interfaces/params";
import {FormArray, FormControl, Validators} from "@angular/forms";
import {AuthService} from "../../service/auth.service";

@Component({
  selector: 'app-assignment-details',
  templateUrl: './assignment-details.component.html',
  styleUrls: ['./assignment-details.component.css']
})
export class AssignmentDetailsComponent implements OnInit {
  public assignment!: AssignmentDetails;
  public isStarted = false;
  public timeLeft = 0;
  private startTime = 0;
  private timeInterval?: NodeJS.Timer;
  private answers: UserAnswer[] = [];
  public isPassed: boolean = false;
  public userScore: number = 0;
  public isAttempted = false;
  public comments: Record<string, FormControl> = {};
  public availableDate: Date = new Date();
  public isMyAssignment = false;

  constructor(
    private readonly courseService: CourseService,
    private readonly activateRoute: ActivatedRoute,
    private readonly authService: AuthService
  ) {
  }

  public ngOnInit(): void {
    combineLatest(this.activateRoute.params, this.activateRoute.queryParams)
      .pipe(
        switchMap(([value, query]) =>
            this.courseService.getAssignment(value['id'],
              query['userId'] || this.authService.authedId.getValue())
        )
      )
      .subscribe(value => {
        this.assignment = value;
        this.isMyAssignment = value.data.userId === this.authService.authedId.getValue()
          || this.authService.authedRole.getValue() === 'admin';
        this.isAttempted = !!this.assignment.data.recordId;
        this.assignment.questions
          .filter(question => question.taskType === 2)
          .forEach(question => {
            this.comments[question.taskId] = new FormControl({value: '', disabled: true},  Validators.required)
          });

        if (this.assignment.data.passDate) {
          const date = new Date(this.assignment.data.passDate);
          date.setDate(date.getDate() + 3);
          this.availableDate = date;
        }

        this.checkUserProgress();
      })

  }


  public isStartHidden(): boolean {
    return this.isMyAssignment && !this.activateRoute.snapshot.queryParams['userId']
  }

  private checkUserProgress(): void {
    this.userScore = this.assignment.questions
      .reduce((acc, value) => (value.userScore || 0) + acc, 0);

    this.isPassed = this.userScore >= this.assignment.data.minimumScore;
  }

  public addAnswer(taskId: number, answer: number, multiple: boolean) {
    const exists = this.answers.findIndex(answer => answer.taskId === taskId);

    if (exists !== -1) {
      if (!multiple) {
        this.answers[exists].answerCaseIds = [];
      }

      if (!this.answers[exists].answerCaseIds?.includes(answer)) {
        this.answers[exists].answerCaseIds!.push(answer);
      } else {
        this.answers[exists].answerCaseIds = this.answers[exists].answerCaseIds!
          .filter(value => value !== answer)
      }
    } else {
      this.answers.push({
        taskId,
        answerCaseIds: [answer]
      })
    }
  }

  public startPassing(): void {
    this.isStarted = true;
    this.startTime = new Date().valueOf();
    this.assignment.questions.forEach(question => question.chosenAnswers = []);
    Object.values(this.comments).forEach(comment => comment.enable())
    if (!this.isMyAssignment) {
      this.timeInterval = setInterval(()=> {
        const spent = (new Date().valueOf() - this.startTime) / (1000 * 60);
        this.timeLeft = Math.round(this.assignment.data.time - spent);
        if (this.timeLeft <=0 ) {
          clearInterval(this.timeInterval)
          this.sendAssignment(true)
        }
      })
    }
  }

  public sendAssignment(fullTime: boolean): void {
    const spent = (new Date().valueOf() - this.startTime) / (1000 * 60);
    const resultAnswers: UserAnswer[] = [
        ...this.answers,
        ...Object.keys(this.comments).map(key => ({
        taskId: +key,
        comment: this.comments[key].value
      }))
    ];
    let stream!: Observable<UserAssignmentResponse>;

    if (!this.assignment.data.recordId) {
      stream = this.courseService.addAssignmentUserRecord({
        answers: resultAnswers,
        time: fullTime ? this.assignment.data.time : this.assignment.data.time - spent,
        planItem: this.assignment.data.planItemId!
      })
    } else {
      const userId = this.activateRoute.snapshot.queryParams['userId'];
      stream = this.courseService.editAssignmentUserRecord(this.assignment.data.recordId,{
        answers: resultAnswers,
        userId: userId && +userId,
        time: fullTime ? this.assignment.data.time : this.assignment.data.time - spent,
        planItem: this.assignment.data.planItemId!
      })
    }

    stream.subscribe(value => {
      this.isPassed = value.plan.isPassed;
      this.userScore = value.plan.score;
      value.answers.forEach(answer => {
        this.assignment.questions.map(value => {
          if (value.taskId === answer.taskId) {
            return {
              ...value,
              isUserCorrect: answer.isCorrect,
              userScore: answer.score,
              chosenAnswers: answer.chosenAnswers
            }
          }

          return value
        })
      });

      this.availableDate = new Date(value.plan.passDate);
      this.availableDate.setDate(this.availableDate.getDate() + 3);
      Object.values(this.comments).forEach(comment => comment.disable())
      this.isStarted = false;
      this.isAttempted = true;
    })
  }

  public get isAssignmentAvailable(): boolean {
    return this.isMyAssignment || !this.assignment.data.passDate || this.availableDate.valueOf() <= new Date().valueOf()
  }

  public get isStreamAvailable(): boolean {
    return new Date().valueOf() >= new Date(this.assignment.data.dateStart!).valueOf()
  }
}
