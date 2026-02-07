import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { TestCase, TestResult, RunResult } from './types';

export class CodeExecutor {
  private timeout = 2000; // 2 seconds

  async execute(language: string, code: string, testCases: TestCase[]): Promise<RunResult> {
    const results: TestResult[] = [];
    let verdict: RunResult['verdict'] = "Accepted";

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const result = await this.runTestCase(language, code, testCase, i + 1);
      results.push(result);

      if (result.status !== "Passed") {
        verdict = result.status as RunResult['verdict'];
        break; // Stop on first failure (contest-style)
      }
    }

    return { verdict, results };
  }

  private async runTestCase(
    language: string,
    code: string,
    testCase: TestCase,
    testNumber: number
  ): Promise<TestResult> {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsa-'));
    
    try {
      let output: string;
      
      switch (language) {
        case 'python':
          output = await this.runPython(code, testCase.input, tempDir);
          break;
        case 'cpp':
          output = await this.runCpp(code, testCase.input, tempDir);
          break;
        case 'java':
          output = await this.runJava(code, testCase.input, tempDir);
          break;
        default:
          throw new Error(`Unsupported language: ${language}`);
      }

      const expected = testCase.output.trim();
      const actual = output.trim();

      if (expected === actual) {
        return { test: testNumber, status: "Passed" };
      } else {
        return { 
          test: testNumber, 
          status: "Wrong Answer",
          expected,
          actual
        };
      }
    } catch (error: any) {
      if (error.message === 'TIMEOUT') {
        return { test: testNumber, status: "Time Limit Exceeded" };
      }
      return { 
        test: testNumber, 
        status: "Runtime Error",
        actual: error.message
      };
    } finally {
      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }

  private runPython(code: string, input: string, tempDir: string): Promise<string> {
    const filePath = path.join(tempDir, 'solution.py');
    fs.writeFileSync(filePath, code);
    return this.executeCommand('python', [filePath], input);
  }

  private async runCpp(code: string, input: string, tempDir: string): Promise<string> {
    const sourceFile = path.join(tempDir, 'solution.cpp');
    const exeFile = path.join(tempDir, 'solution.exe');
    fs.writeFileSync(sourceFile, code);

    // Compile
    await this.executeCommand('g++', [sourceFile, '-o', exeFile], '');
    
    // Run
    return this.executeCommand(exeFile, [], input);
  }

  private async runJava(code: string, input: string, tempDir: string): Promise<string> {
    const filePath = path.join(tempDir, 'Main.java');
    fs.writeFileSync(filePath, code);

    // Compile
    await this.executeCommand('javac', [filePath], '');
    
    // Run
    return this.executeCommand('java', ['-cp', tempDir, 'Main'], input);
  }

  private executeCommand(command: string, args: string[], input: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args);
      let stdout = '';
      let stderr = '';

      const timer = setTimeout(() => {
        process.kill();
        reject(new Error('TIMEOUT'));
      }, this.timeout);

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        clearTimeout(timer);
        if (code !== 0) {
          reject(new Error(stderr || `Process exited with code ${code}`));
        } else {
          resolve(stdout);
        }
      });

      process.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });

      if (input) {
        process.stdin.write(input);
        process.stdin.end();
      }
    });
  }
}
