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
