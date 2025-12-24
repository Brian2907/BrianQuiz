
export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE'
}

export interface Question {
  id: string;
  type: QuestionType;
  questionText: string;
  options?: string[]; // For ABCD
  correctAnswer: string; // "A", "B", "C", "D" or "True"/"False"
  explanation?: string;
}

export interface QuizSession {
  id: string;
  title: string;
  questions: Question[];
  timeLimit?: number; // in minutes
}

export interface Participant {
  id: string;
  name: string;
  avatar?: string; // Base64 string from User avatar
  score: number;
  total: number;
  completedAt: string;
}

export interface QuizSlot {
  id: number;
  shareId: string;
  name: string;
  quiz: QuizSession | null;
  updatedAt: string | null;
  participants: Participant[];
}

export interface User {
  id: string;
  username: string;
  password?: string;
  avatar?: string; // Base64 string for uploaded image
}

export type AppState = 'AUTH' | 'HOME' | 'EDIT' | 'SETTINGS' | 'NAME_ENTRY' | 'TAKE' | 'CALCULATING' | 'RESULT';
