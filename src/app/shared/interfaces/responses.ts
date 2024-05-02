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
