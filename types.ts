export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  correctAnswerId: string;
  explanation: string;
}

export interface BreakdownItem {
  emoji: string;
  text: string;
  boldKeyTerm: string;
}

export interface LearningModule {
  tldr: string;
  visualMap: string; // ASCII Art
  analogy: string; // The "Game/Movie" comparison
  breakdown: BreakdownItem[];
  quiz: QuizQuestion[];
}

export interface XPPacket {
  id: number;
  amount: number;
  label: string;
  x: number;
  y: number;
}