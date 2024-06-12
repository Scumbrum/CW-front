import {StreamData} from "./params";

export interface LoginResponse {
  id: number,
  login: string,
  name: string,
  role: 'user' | 'admin',
  subscribers: number,
  about: string
}

export interface UserResponse {
  id: number,
  about: string,
  login: string,
  name: string,
  role: 'user' | 'admin',
  subscribers: number,
  blocked: boolean,
  isSubscribed?: boolean
}

export interface Subscription {
  name: string,
  id: number
}

export interface SubscriptionResponse {
  data: Subscription[],
  total: number
}

export interface UsersListResponse {
  data: UserResponse[],
  totalPages: number
}

export interface NotificationResponse {
  date: string,
  id: number,
  isViewed: boolean,
  text: string,
  userId: number
}

export interface NotificationListResponse {
  data: NotificationResponse[],
  totalPages: number,
  unreaded: number
}

export interface Stream {
  id: number;
  name: string;
  userId: number;
  userName: string;
  viewers: number;
  reports: number;
  dateStart: string;
  assignmentId: number | null;
  planItemId: number | null;
  courseId: number | null
  type: number;
  planed: boolean;
}

export interface Course {
  id: number;
  name: string;
  userId: number;
  userName: string;
  dateStart: string;
  dateEnd: string;
}

export interface StreamResponse {
  data: Stream;
  isModerator: false;
  endPoint?: number;
}

export interface StreamListResponse {
  data: Stream[],
  totalPages: number,
}

export interface CourseListResponse {
  data: Course[],
  totalPages: number,
}

export interface CourseDetailsData extends Course{
  description: string;
  isPassed: boolean;
  isSubscribed: boolean;
}

export interface Assignment {
  id: number;
  name: string;
  type: number;
  time: number;
  minimumScore: number;
  userId: number;

}

export interface AssignmentResponse {
  data: Assignment[];
  totalPages: number;
}

export interface PlanItem {
  courseId: number;
  name: string;
  assignmentId: number | null;
  assignmentName: string | null;
  minimumScore: number | null;
  streamId: number;
  planItemId: number;
  startDate: string;
  streamName: string;
  isActive: boolean;
  recordId: number | null;
  isPassed: boolean | null;
  isAsync: boolean | null;
  passDate: string | null;
  score: number | null;
}
export interface UserAssignment extends PlanItem {
  userId: number;
  userName: string;
}

export interface UserAssignmentResponse extends PlanItem {
  data: UserAssignment[];
  total: number;
}

export interface PlanItemResponse {
  data: PlanItem[];
  total: number;
}

export interface CourseDataWithPlan {
  data: CourseDetailsData;
  plan: PlanItem[];
}

export interface CourseSubscription {
  userId: number;
  courseId: string;
}

export interface FrameResponse {
  partNumber: number;
}

export interface RestrictionResponse {
  userId: number;
  restrictionType: number;
  userName: string;
}

export interface ReportResponse {
  reports: number
}

export interface AnswerCase {
  answerCaseId: number;
  answerCaseText: string;
  isAnswerCorrect: number; // Assuming 0 represents false and 1 represents true
}

export interface Question {
  taskType: number;
  taskId: number;
  question: string;
  correctAnswer: any; // You might want to specify the correct answer type if it's known
  taskScore: number;
  correctComment: string;
  userScore: number | null;
  isUserCorrect: boolean | null;
  userComment: string | null;
  answerCases: AnswerCase[];
  chosenAnswers: number[]; // You might want to specify the chosen answer type if it's known
  multiple: boolean;
}

export interface AssignmentData extends Assignment {
  planItemId: number | null;
  streamId: number | null;
  passDate: string | null;
  recordId: number | null;
  dateStart: string | null;
}

export interface AssignmentDetails {
  data: AssignmentData;
  questions: Question[];
}

export interface Plan {
  planItemId: number;
  userId: number;
  isPassed: boolean;
  isAsync: boolean;
  score: number;
  passDate: string;
}

export interface Answer {
  taskId: number;
  userId: number;
  score: number;
  isCorrect: boolean;
  chosenAnswers: number[];
}

export interface UserAssignmentResponse {
  plan: Plan;
  answers: Answer[];
  isCertificateReady: boolean;
}
