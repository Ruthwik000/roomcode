const { exec, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

async function runTests(solutionPath, testCases) {
    const ext = path.extname(solutionPath);
    const language = getLanguage(ext);
    
    const results = {
        passed: 0,
        total: testCases.length,
        details: []
    };

    // Compile once if needed
    let compiledPath = null;
    if (language === 'cpp' || language === 'java') {
        try {
            compiledPath = await compile(solutionPath, language);
        } catch (error) {
            return {
                passed: 0,
                total: testCases.length,
                details: [{
                    passed: false,
                    error: `Compilation failed: ${error.message}`,
                    expected: '',
                    actual: 'Compilation Error'
                }]
            };
        }
    }

    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        try {
            const result = await runSingleTest(solutionPath, testCase, language, compiledPath);
            results.details.push(result);
            if (result.passed) results.passed++;
        } catch (error) {
            results.details.push({
                passed: false,
                error: error.message,
                expected: testCase.output,
                actual: 'Runtime Error',
                time: 0
            });
        }
    }

    return results;
}

async function compile(solutionPath, language) {
    const tempDir = os.tmpdir();
    const baseName = path.basename(solutionPath, path.extname(solutionPath));
    
    if (language === 'cpp') {
        const exePath = path.join(tempDir, baseName + (process.platform === 'win32' ? '.exe' : ''));
        const command = `g++ "${solutionPath}" -o "${exePath}" -std=c++17`;
        
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(stderr || error.message));
                } else {
                    resolve(exePath);
                }
            });
        });
    } else if (language === 'java') {
        const command = `javac "${solutionPath}"`;
        
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(stderr || error.message));
                } else {
                    resolve(path.dirname(solutionPath));
                }
            });
        });
    }
    
    return null;
}

async function runSingleTest(solutionPath, testCase, language, compiledPath) {
    const startTime = Date.now();
    const baseName = path.basename(solutionPath, path.extname(solutionPath));
    
    return new Promise((resolve, reject) => {
        let command, args;
        
        switch (language) {
            case 'cpp':
                command = compiledPath;
                args = [];
                break;
                
            case 'python':
                command = 'python';
                args = [solutionPath];
                break;
                
            case 'java':
                command = 'java';
                args = ['-cp', compiledPath, baseName];
                break;
                
            case 'javascript':
                command = 'node';
                args = [solutionPath];
                break;
                
            case 'go':
                command = 'go';
                args = ['run', solutionPath];
                break;
                
            default:
                reject(new Error(`Unsupported language: ${language}`));
                return;
        }

        const process = spawn(command, args, {
            timeout: 5000,
            shell: true
        });

        let stdout = '';
        let stderr = '';

        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        // Write input to stdin
        if (testCase.input) {
            process.stdin.write(testCase.input);
            process.stdin.end();
        } else {
            process.stdin.end();
        }

        process.on('close', (code) => {
            const time = Date.now() - startTime;
            
            if (code !== 0 && !stdout) {
                reject(new Error(stderr || `Process exited with code ${code}`));
                return;
            }

            const actual = stdout.trim();
            const expected = testCase.output.trim();
            
            // Normalize line endings for comparison
            const normalizedActual = actual.replace(/\r\n/g, '\n');
            const normalizedExpected = expected.replace(/\r\n/g, '\n');
            
            const passed = normalizedActual === normalizedExpected;

            resolve({
                passed,
                time,
                expected: expected,
                actual: actual,
                input: testCase.input
            });
        });

        process.on('error', (error) => {
            reject(error);
        });
    });
}

function getLanguage(ext) {
    const langMap = {
        '.cpp': 'cpp',
        '.c': 'cpp',
        '.py': 'python',
        '.java': 'java',
        '.js': 'javascript',
        '.go': 'go',
        '.rs': 'rust'
    };
    return langMap[ext] || 'cpp';
}

module.exports = { runTests };
