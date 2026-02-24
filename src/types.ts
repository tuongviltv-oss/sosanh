export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct option
}

export type GameState = 'START' | 'PLAYING' | 'FINISHED';

export interface TeamState {
  score: number;
  name: string;
  color: string;
}
