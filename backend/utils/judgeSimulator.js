const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class JudgeSimulator {
    constructor() {
        this.tempDir = path.join(__dirname, '../temp');
        this.ensureTempDir();
    }

    async ensureTempDir() {
        try {
            await fs.access(this.tempDir);
        } catch {
            await fs.mkdir(this.tempDir, { recursive: true });
        }
    }

    // Main method to judge a submission
    async judgeSubmission(code, language, testCases, timeLimit = 2000, memoryLimit = 256) {
        try {
            const testResults = [];
            let finalStatus = 'Accepted';
            let errorDetails = '';

            // Compile code if necessary
            const compileResult = await this.compileCode(code, language);
            if (!compileResult.success) {
                return {
                    finalStatus: 'Compilation Error',
                    errorDetails: compileResult.error,
                    testResults: []
                };
            }

            // Run against each test case
            for (let i = 0; i < testCases.length; i++) {
                const testCase = testCases[i];
                const result = await this.runSingleTest(
                    compileResult.executablePath || code,
                    language,
                    testCase,
                    timeLimit,
                    memoryLimit,
                    i
                );

                testResults.push(result);

                // Update final status based on test result
                if (result.status !== 'Passed') {
                    if (result.status === 'Timeout') {
                        finalStatus = 'Time Limit Exceeded';
                    } else if (result.status === 'Error') {
                        finalStatus = 'Runtime Error';
                        errorDetails = result.errorMessage;
                    } else if (result.status === 'Failed') {
                        finalStatus = 'Wrong Answer';
                    }
                }
            }

            // Clean up temporary files
            if (compileResult.executablePath) {
                try {
                    await fs.unlink(compileResult.executablePath);
                } catch (error) {
                    console.warn('Failed to cleanup executable:', error.message);
                }
            }

            return {
                finalStatus,
                errorDetails,
                testResults
            };

        } catch (error) {
            console.error('Judge submission error:', error);
            return {
                finalStatus: 'System Error',
                errorDetails: 'Internal judging system error',
                testResults: []
            };
        }
    }

    // Run code against sample test cases (for testing)
    async runCode(code, language, testCases) {
        try {
            const results = [];

            // Compile if necessary
            const compileResult = await this.compileCode(code, language);
            if (!compileResult.success) {
                return [{
                    testCaseIndex: 0,
                    status: 'Error',
                    errorMessage: compileResult.error,
                    input: '',
                    expectedOutput: '',
                    actualOutput: ''
                }];
            }

            // Run each test case
            for (let i = 0; i < testCases.length; i++) {
                const result = await this.runSingleTest(
                    compileResult.executablePath || code,
                    language,
                    testCases[i],
                    5000, // 5 second timeout for testing
                    512,  // 512MB memory limit
                    i
                );
                results.push(result);
            }

            // Clean up
            if (compileResult.executablePath) {
                try {
                    await fs.unlink(compileResult.executablePath);
                } catch (error) {
                    console.warn('Failed to cleanup executable:', error.message);
                }
            }

            return results;

        } catch (error) {
            console.error('Run code error:', error);
            return [{
                testCaseIndex: 0,
                status: 'Error',
                errorMessage: 'Internal execution error',
                input: '',
                expectedOutput: '',
                actualOutput: ''
            }];
        }
    }

    // Compile code if needed (for compiled languages)
    async compileCode(code, language) {
        try {
            const tempId = crypto.randomBytes(16).toString('hex');
            
            switch (language) {
                case 'java':
                    return await this.compileJava(code, tempId);
                case 'cpp':
                case 'c':
                    return await this.compileCpp(code, language, tempId);
                case 'javascript':
                case 'python':
                    // Interpreted languages don't need compilation
                    return { success: true, executablePath: null };
                default:
                    throw new Error(`Unsupported language: ${language}`);
            }
        } catch (error) {
            return {
                success: false,
                error: `Compilation failed: ${error.message}`
            };
        }
    }

    // Compile Java code
    async compileJava(code, tempId) {
        const sourceFile = path.join(this.tempDir, `${tempId}.java`);
        const classFile = path.join(this.tempDir, `${tempId}.class`);

        // Extract class name from code (simplified)
        const classMatch = code.match(/public\s+class\s+(\w+)/);
        const className = classMatch ? classMatch[1] : 'Solution';

        // Write source file
        await fs.writeFile(sourceFile, code);

        return new Promise((resolve) => {
            const javac = spawn('javac', [sourceFile], {
                timeout: 10000,
                cwd: this.tempDir
            });

            let stderr = '';
            javac.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            javac.on('close', async (exitCode) => {
                try {
                    await fs.unlink(sourceFile);
                } catch (error) {
                    console.warn('Failed to cleanup source file:', error.message);
                }

                if (exitCode === 0) {
                    resolve({
                        success: true,
                        executablePath: classFile,
                        className
                    });
                } else {
                    resolve({
                        success: false,
                        error: stderr || 'Compilation failed'
                    });
                }
            });

            javac.on('error', (error) => {
                resolve({
                    success: false,
                    error: `Compilation error: ${error.message}`
                });
            });
        });
    }

    // Compile C/C++ code
    async compileCpp(code, language, tempId) {
        const sourceExt = language === 'cpp' ? '.cpp' : '.c';
        const sourceFile = path.join(this.tempDir, `${tempId}${sourceExt}`);
        const executableFile = path.join(this.tempDir, tempId);

        // Write source file
        await fs.writeFile(sourceFile, code);

        const compiler = language === 'cpp' ? 'g++' : 'gcc';
        const compileArgs = [sourceFile, '-o', executableFile, '-std=c++17'];

        return new Promise((resolve) => {
            const compile = spawn(compiler, compileArgs, {
                timeout: 10000
            });

            let stderr = '';
            compile.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            compile.on('close', async (exitCode) => {
                try {
                    await fs.unlink(sourceFile);
                } catch (error) {
                    console.warn('Failed to cleanup source file:', error.message);
                }

                if (exitCode === 0) {
                    resolve({
                        success: true,
                        executablePath: executableFile
                    });
                } else {
                    resolve({
                        success: false,
                        error: stderr || 'Compilation failed'
                    });
                }
            });

            compile.on('error', (error) => {
                resolve({
                    success: false,
                    error: `Compilation error: ${error.message}`
                });
            });
        });
    }

    // Run a single test case
    async runSingleTest(codeOrPath, language, testCase, timeLimit, memoryLimit, testIndex) {
        const startTime = Date.now();
        
        try {
            const result = await this.executeCode(codeOrPath, language, testCase.input, timeLimit);
            const executionTime = Date.now() - startTime;

            const actualOutput = result.output.trim();
            const expectedOutput = testCase.expectedOutput.trim();

            const status = actualOutput === expectedOutput ? 'Passed' : 'Failed';

            return {
                testCaseIndex: testIndex,
                status,
                input: testCase.input,
                expectedOutput: testCase.expectedOutput,
                actualOutput: result.output,
                executionTime,
                memoryUsed: result.memoryUsed || 0,
                errorMessage: result.error || ''
            };

        } catch (error) {
            return {
                testCaseIndex: testIndex,
                status: error.message.includes('timeout') ? 'Timeout' : 'Error',
                input: testCase.input,
                expectedOutput: testCase.expectedOutput,
                actualOutput: '',
                executionTime: Date.now() - startTime,
                memoryUsed: 0,
                errorMessage: error.message
            };
        }
    }

    // Execute code with given input
    async executeCode(codeOrPath, language, input, timeLimit) {
        return new Promise((resolve, reject) => {
            let process;
            let command, args;

            switch (language) {
                case 'javascript':
                    command = 'node';
                    args = ['-e', codeOrPath];
                    break;
                case 'python':
                    command = 'python3';
                    args = ['-c', codeOrPath];
                    break;
                case 'java':
                    // For Java, codeOrPath is the class file path
                    const classDir = path.dirname(codeOrPath);
                    const className = path.basename(codeOrPath, '.class');
                    command = 'java';
                    args = ['-cp', classDir, className];
                    break;
                case 'cpp':
                case 'c':
                    // For compiled languages, codeOrPath is the executable path
                    command = codeOrPath;
                    args = [];
                    break;
                default:
                    return reject(new Error(`Unsupported language: ${language}`));
            }

            process = spawn(command, args, {
                timeout: timeLimit,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            // Send input to the process
            if (input) {
                process.stdin.write(input);
            }
            process.stdin.end();

            process.on('close', (exitCode) => {
                if (exitCode === 0) {
                    resolve({
                        output: stdout,
                        error: stderr,
                        exitCode,
                        memoryUsed: Math.random() * 50 + 10 // Simulated memory usage
                    });
                } else {
                    reject(new Error(stderr || `Process exited with code ${exitCode}`));
                }
            });

            process.on('error', (error) => {
                if (error.code === 'ETIMEDOUT') {
                    reject(new Error('Execution timeout'));
                } else {
                    reject(new Error(`Execution error: ${error.message}`));
                }
            });
        });
    }
}

module.exports = new JudgeSimulator();
