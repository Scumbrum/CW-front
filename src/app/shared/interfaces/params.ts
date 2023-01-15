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
