import { Question } from './types';

export const mockQuestions: Question[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    topic: "Array",
    difficulty: "Easy",
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

Example:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]

Constraints:
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9`,
    language: "python",
    testCases: [
      { input: "2 7 11 15\n9", output: "0 1" },
      { input: "3 2 4\n6", output: "1 2" },
      { input: "3 3\n6", output: "0 1" }
    ]
  },
  {
    id: "reverse-string",
    title: "Reverse String",
    topic: "String",
    difficulty: "Easy",
    description: `Write a function that reverses a string.

Example:
Input: "hello"
Output: "olleh"`,
    language: "cpp",
    testCases: [
      { input: "hello", output: "olleh" },
      { input: "world", output: "dlrow" },
      { input: "a", output: "a" }
    ]
  },
  {
    id: "fibonacci",
    title: "Fibonacci Number",
    topic: "Dynamic Programming",
    difficulty: "Medium",
    description: `Calculate the nth Fibonacci number.

Example:
Input: 5
Output: 5

Explanation: F(5) = F(4) + F(3) = 3 + 2 = 5`,
    language: "java",
    testCases: [
      { input: "5", output: "5" },
      { input: "10", output: "55" },
      { input: "0", output: "0" }
    ]
  }
];
