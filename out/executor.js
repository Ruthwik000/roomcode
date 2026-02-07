"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeExecutor = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
class CodeExecutor {
    constructor() {
        this.timeout = 2000; // 2 seconds
    }
    async execute(language, code, testCases) {
        const results = [];
        let verdict = "Accepted";
        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            const result = await this.runTestCase(language, code, testCase, i + 1);
            results.push(result);
            if (result.status !== "Passed") {
                verdict = result.status;
                break; // Stop on first failure (contest-style)
            }
        }
        return { verdict, results };
    }
    async runTestCase(language, code, testCase, testNumber) {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsa-'));
        try {
            let output;
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
            }
            else {
                return {
                    test: testNumber,
                    status: "Wrong Answer",
                    expected,
                    actual
                };
            }
        }
        catch (error) {
            if (error.message === 'TIMEOUT') {
                return { test: testNumber, status: "Time Limit Exceeded" };
            }
            return {
                test: testNumber,
                status: "Runtime Error",
                actual: error.message
            };
        }
        finally {
            // Cleanup
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }
    runPython(code, input, tempDir) {
        const filePath = path.join(tempDir, 'solution.py');
        fs.writeFileSync(filePath, code);
        return this.executeCommand('python', [filePath], input);
    }
    async runCpp(code, input, tempDir) {
        const sourceFile = path.join(tempDir, 'solution.cpp');
        const exeFile = path.join(tempDir, 'solution.exe');
        fs.writeFileSync(sourceFile, code);
        // Compile
        await this.executeCommand('g++', [sourceFile, '-o', exeFile], '');
        // Run
        return this.executeCommand(exeFile, [], input);
    }
    async runJava(code, input, tempDir) {
        const filePath = path.join(tempDir, 'Main.java');
        fs.writeFileSync(filePath, code);
        // Compile
        await this.executeCommand('javac', [filePath], '');
        // Run
        return this.executeCommand('java', ['-cp', tempDir, 'Main'], input);
    }
    executeCommand(command, args, input) {
        return new Promise((resolve, reject) => {
            const process = (0, child_process_1.spawn)(command, args);
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
                }
                else {
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
exports.CodeExecutor = CodeExecutor;
//# sourceMappingURL=executor.js.map