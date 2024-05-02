export interface LoginData {
  login: string,
  password: string
}

export interface RegisterData {
  login: string,
  password: string,
  name: string,
}

export interface UserData {
  name: string,
  about: string
}

export interface SubscriptionData {
  target: number;
}

export interface RestrictionData {
  streamId: number,
  restrictionType: number
}

export interface StreamData {
  name: string;
  moderators: number[]
  dateStart: string;
  type: number;
}

export enum LiveMessageTypes {
  JOIN = 'JOIN',
  MESSAGE = 'MESSAGE',
  ERROR = 'ERROR',
  CREATE =  'CREATE',
  DELETE = 'DELETE',
  DISCONNECT = 'DISCONNECT',
  DELETE_MESSAGE = 'DELETE_MESSAGE',
}

export interface LiveMessage {
  id?: number;
  messageType: LiveMessageTypes;
  text: string;
  userId: number;
  date: string;
  name: string
}

export interface SelectOption {
  id: number;
  label: string;
}

export interface CourseRequestData {
  name: string;
  description: string;
  dateEnd: string;
  dateStart: string
}

export interface PlanItemRequestData {
  streamId: number;
  assignmentId: number;
}

export interface PlanItemRequestData {
  streamId: number;
  assignmentId: number;
}
export interface PlanRequestData {
  courseId: number;
  plans: PlanItemRequestData[];
}
