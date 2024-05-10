import {Component, Inject, OnInit} from '@angular/core';
import {SelectOption} from "../../shared/interfaces/params";
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {DialogRef} from "@angular/cdk/dialog";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Subscription} from "rxjs";
import {minLengthArray} from "../../validators/arrayValidator";
import {AssignmentDetails} from "../../shared/interfaces/responses";

@Component({
  selector: 'app-course-modal',
  templateUrl: './course-modal.component.html',
  styleUrls: ['./course-modal.component.css']
})
export class CourseModalComponent implements OnInit {
  public assignmentForm!: FormGroup;
  private taskSubscriptions: Subscription[] = [];
  private arrayValidator = minLengthArray(1);

  public typeList: SelectOption[] = [
    {
      id: 1,
      label: 'Test'
    }
  ]

  public taskTypeList: SelectOption[] = [
    {
      id: 1,
      label: 'Answer cases'
    },
    {
      id: 2,
      label: 'Open question'
    }
  ]

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<CourseModalComponent>,
    @Inject(MAT_DIALOG_DATA) private readonly data?: AssignmentDetails
  ) {}

  public ngOnInit(): void {
    if (!this.data) {
      this.assignmentForm = this.fb.group({
        name: ['', Validators.required],
        type: ['', Validators.required],
        time: [0, Validators.required],
        minimumScore: [0, Validators.required],
        taskArray: this.fb.array([
          this.fb.group({
            question: ['', Validators.required],
            type: [1, Validators.required],
            score: [0, Validators.required],
            correctComment: '',
            answers: this.fb.array([
              this.fb.group({
                option: ['', Validators.required],
                isCorrect: false
              })
            ], { validators: this.arrayValidator })
          })
        ], {
          validators: this.arrayValidator
        })
      });

      this.addTaskListener(0);
    } else {
      this.assignmentForm = this.fb.group({
        name: [this.data.data.name, Validators.required],
        type: [this.data.data.type, Validators.required],
        time: [this.data.data.time, Validators.required],
        minimumScore: [this.data.data.minimumScore, Validators.required],
        taskArray: this.fb.array(this.data.questions.map(question => this.fb.group({
          question: [question.question, Validators.required],
          id: question.taskId,
          type: [question.taskType, Validators.required],
          score: [question.taskScore, Validators.required],
          correctComment: question.correctComment,
          answers: this.fb.array(question.answerCases
            .map(answer => this.fb.group({
              id: answer.answerCaseId,
              option: [answer.answerCaseText, Validators.required],
              isCorrect: answer.isAnswerCorrect
          })), { validators: this.arrayValidator })
          })
        ), {
          validators: this.arrayValidator
        })
      });

      this.tasks.controls.forEach((value, i) => this.addTaskListener(i))
    }
  }

  public get tasks(): FormArray {
    return this.assignmentForm.get('taskArray') as FormArray
  }

  public answers(task: AbstractControl): FormArray {
    return task.get('answers') as FormArray
  }

  public taskForm(task: AbstractControl): FormGroup {
    return task as FormGroup
  }

  public addAnswer(task: AbstractControl): void {
    this.answers(task).push(this.fb.group({
      option: ['', Validators.required],
      isCorrect: false
    }))
  }

  public deleteAnswer(task: AbstractControl, index: number): void {
    this.answers(task).removeAt(index)
  }

  public addTask(): void {
    this.tasks.push(this.fb.group({
      question: ['', Validators.required],
      type: [1, Validators.required],
      score: [0, Validators.required],
      correctComment: '',
      answers: this.fb.array([
        this.fb.group({
          option: ['', Validators.required],
          isCorrect: false
        })
      ], { validators: this.arrayValidator })
    }))

   this.addTaskListener(this.tasks.length - 1)
  }

  private addTaskListener(index: number): void {
    const taskForm =  this.taskForm(this.tasks.controls[index]);
    this.taskSubscriptions.push(
      taskForm.controls['type'].valueChanges
        .subscribe(value => {
          if (value === 1) {
            taskForm.controls['answers'].addValidators(this.arrayValidator)
            taskForm.controls['correctComment'].removeValidators(Validators.required);
          } else {
            taskForm.controls['answers'].removeValidators(this.arrayValidator)
            taskForm.controls['correctComment'].addValidators(Validators.required)
          }

          taskForm.controls['answers'].updateValueAndValidity();
          taskForm.controls['correctComment'].updateValueAndValidity()
        })
    )
  }

  public deleteTask(index: number): void {
    this.tasks.removeAt(index);
    this.taskSubscriptions[index].unsubscribe();
    this.taskSubscriptions = this.taskSubscriptions
      .filter((value, i) => i !== index)
  }

  public cancel(): void {
    this.dialogRef.close()
  }

  public get isAssignmentValid(): boolean {
    return this.assignmentForm.valid && this.isMinimumScoreValid;
  }

  public get isMinimumScoreValid(): boolean {
    const sumTaskScores = this.tasks.controls.reduce((acc, control) =>
      acc + this.taskForm(control).controls['score'].value
    , 0);

    return this.assignmentForm.value.minimumScore < sumTaskScores;
  }

  public save(): void {
    this.dialogRef.close(this.assignmentForm.value)
  }
}
