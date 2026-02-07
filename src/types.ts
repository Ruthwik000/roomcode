export interface TestCase {
  input: string;
  output: string;
}

export interface Question {
  id: string;
  title: string;
  topic?: string;
  difficulty: "Easy" | "Medium" | "Hard" | string;
  description: string;
  language: "cpp" | "java" | "python";
  testCases: TestCase[];
  timeLimit?: number;
  memoryLimit?: number;
}

export interface TestResult {
  test: number;
  status: "Passed" | "Wrong Answer" | "Runtime Error" | "Time Limit Exceeded";
  expected?: string;
  actual?: string;
}

export interface RunResult {
  verdict: "Accepted" | "Wrong Answer" | "Runtime Error" | "Time Limit Exceeded";
  results: TestResult[];
}

export interface ContestRoom {
  id: string;
  questions: Question[];
  startTime: number;
  duration: number;
  status?: 'waiting' | 'active' | 'ended';
  participants?: string[];
}
