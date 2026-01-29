const validator = require('validator');

class ValidationUtils {
    // Validate email format
    static isValidEmail(email) {
        return validator.isEmail(email);
    }

    // Validate password strength
    static isStrongPassword(password) {
        const minLength = 6;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return {
            isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
            requirements: {
                minLength: password.length >= minLength,
                hasUpperCase,
                hasLowerCase,
                hasNumbers,
                hasSpecialChar
            },
            strength: this.calculatePasswordStrength(password)
        };
    }

    // Calculate password strength score
    static calculatePasswordStrength(password) {
        let score = 0;
        
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/\d/.test(password)) score += 1;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
        if (!/(.)\1{2,}/.test(password)) score += 1; // No repeated characters
        
        if (score <= 2) return 'weak';
        if (score <= 4) return 'medium';
        return 'strong';
    }

    // Validate username
    static isValidUsername(username) {
        const isValid = /^[a-zA-Z0-9_]{3,30}$/.test(username);
        const reservedWords = [
            'admin', 'administrator', 'root', 'api', 'www', 'mail', 'ftp',
            'codearena', 'system', 'support', 'help', 'info', 'contact'
        ];
        const isReserved = reservedWords.includes(username.toLowerCase());

        return {
            isValid: isValid && !isReserved,
            errors: [
                ...(!isValid ? ['Username must be 3-30 characters and contain only letters, numbers, and underscores'] : []),
                ...(isReserved ? ['This username is reserved'] : [])
            ]
        };
    }

    // Validate problem code
    static validateProblemCode(code, language) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: []
        };

        // Basic validation
        if (!code || code.trim().length === 0) {
            validation.isValid = false;
            validation.errors.push('Code cannot be empty');
            return validation;
        }

        if (code.length > 50000) {
            validation.isValid = false;
            validation.errors.push('Code is too long (max 50,000 characters)');
        }

        // Language-specific validation
        switch (language) {
            case 'javascript':
                this.validateJavaScript(code, validation);
                break;
            case 'python':
                this.validatePython(code, validation);
                break;
            case 'java':
                this.validateJava(code, validation);
                break;
            case 'cpp':
            case 'c':
                this.validateCpp(code, validation);
                break;
        }

        // Security checks
        this.checkForSuspiciousCode(code, validation);

        return validation;
    }

    // JavaScript-specific validation
    static validateJavaScript(code, validation) {
        // Check for common syntax patterns
        const hasFunction = /function\s+\w+|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=/.test(code);
        
        if (!hasFunction) {
            validation.warnings.push('No function definitions found. Make sure your code includes the required function.');
        }

        // Check for console.log (allowed but warned)
        if (/console\.log/.test(code)) {
            validation.warnings.push('Remove console.log statements before submitting for better performance.');
        }

        // Check for setTimeout/setInterval (not allowed)
        if (/setTimeout|setInterval/.test(code)) {
            validation.isValid = false;
            validation.errors.push('setTimeout and setInterval are not allowed in submissions.');
        }
    }

    // Python-specific validation
    static validatePython(code, validation) {
        // Check for function definition
        if (!/def\s+\w+/.test(code)) {
            validation.warnings.push('No function definitions found. Make sure your code includes the required function.');
        }

        // Check for print statements (allowed but warned)
        if (/print\s*\(/.test(code)) {
            validation.warnings.push('Remove print statements before submitting for better performance.');
        }

        // Check for dangerous imports
        const dangerousImports = ['os', 'subprocess', 'sys', 'socket', 'urllib', 'requests'];
        dangerousImports.forEach(imp => {
            if (new RegExp(`import\\s+${imp}|from\\s+${imp}`).test(code)) {
                validation.isValid = false;
                validation.errors.push(`Import '${imp}' is not allowed for security reasons.`);
            }
        });
    }

    // Java-specific validation
    static validateJava(code, validation) {
        // Check for class definition
        if (!/public\s+class\s+\w+/.test(code)) {
            validation.errors.push('Java code must contain a public class definition.');
            validation.isValid = false;
        }

        // Check for System.out.println (allowed but warned)
        if (/System\.out\.print/.test(code)) {
            validation.warnings.push('Remove System.out.print statements before submitting for better performance.');
        }

        // Check for restricted imports
        const restrictedImports = ['java.io.File', 'java.net', 'java.lang.Runtime'];
        restrictedImports.forEach(imp => {
            if (code.includes(`import ${imp}`)) {
                validation.isValid = false;
                validation.errors.push(`Import '${imp}' is not allowed for security reasons.`);
            }
        });
    }

    // C/C++ specific validation
    static validateCpp(code, validation) {
        // Check for main function
        if (!/int\s+main\s*\(/i.test(code)) {
            validation.warnings.push('No main function found. Make sure your code includes a main function.');
        }

        // Check for restricted includes
        const restrictedIncludes = ['<fstream>', '<filesystem>', '<cstdlib>', '<system>'];
        restrictedIncludes.forEach(inc => {
            if (code.includes(`#include ${inc}`)) {
                validation.isValid = false;
                validation.errors.push(`Include '${inc}' is not allowed for security reasons.`);
            }
        });

        // Check for system calls
        if (/system\s*\(/.test(code)) {
            validation.isValid = false;
            validation.errors.push('System calls are not allowed.');
        }
    }

    // Check for suspicious or malicious code
    static checkForSuspiciousCode(code, validation) {
        const suspiciousPatterns = [
            { pattern: /eval\s*\(/, message: 'eval() function is not allowed' },
            { pattern: /exec\s*\(/, message: 'exec() function is not allowed' },
            { pattern: /spawn|fork|process/i, message: 'Process creation functions are not allowed' },
            { pattern: /file|read|write|open/i, message: 'File operations may be restricted' },
            { pattern: /network|http|socket/i, message: 'Network operations are not allowed' },
            { pattern: /while\s*\(\s*true\s*\)|for\s*\(\s*;\s*;\s*\)/, message: 'Infinite loops detected - this may cause timeout' }
        ];

        suspiciousPatterns.forEach(({ pattern, message }) => {
            if (pattern.test(code)) {
                if (message.includes('not allowed')) {
                    validation.isValid = false;
                    validation.errors.push(message);
                } else {
                    validation.warnings.push(message);
                }
            }
        });
    }

    // Validate test case format
    static validateTestCase(testCase) {
        const validation = {
            isValid: true,
            errors: []
        };

        if (!testCase.input && testCase.input !== '') {
            validation.isValid = false;
            validation.errors.push('Test case input is required');
        }

        if (!testCase.expectedOutput && testCase.expectedOutput !== '') {
            validation.isValid = false;
            validation.errors.push('Test case expected output is required');
        }

        if (typeof testCase.input !== 'string') {
            validation.isValid = false;
            validation.errors.push('Test case input must be a string');
        }

        if (typeof testCase.expectedOutput !== 'string') {
            validation.isValid = false;
            validation.errors.push('Test case expected output must be a string');
        }

        return validation;
    }

    // Validate problem examples
    static validateExamples(examples) {
        const validation = {
            isValid: true,
            errors: []
        };

        if (!Array.isArray(examples)) {
            validation.isValid = false;
            validation.errors.push('Examples must be an array');
            return validation;
        }

        if (examples.length === 0) {
            validation.isValid = false;
            validation.errors.push('At least one example is required');
            return validation;
        }

        examples.forEach((example, index) => {
            if (!example.input && example.input !== '') {
                validation.isValid = false;
                validation.errors.push(`Example ${index + 1}: input is required`);
            }

            if (!example.output && example.output !== '') {
                validation.isValid = false;
                validation.errors.push(`Example ${index + 1}: output is required`);
            }
        });

        return validation;
    }

    // Sanitize user input
    static sanitizeInput(input) {
        if (typeof input !== 'string') return input;

        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+\s*=/gi, '') // Remove event handlers
            .trim();
    }

    // Validate file upload
    static validateFileUpload(file, allowedTypes, maxSize) {
        const validation = {
            isValid: true,
            errors: []
        };

        if (!file) {
            validation.isValid = false;
            validation.errors.push('No file provided');
            return validation;
        }

        // Check file size
        if (file.size > maxSize) {
            validation.isValid = false;
            validation.errors.push(`File size exceeds limit of ${maxSize / 1024 / 1024}MB`);
        }

        // Check file type
        if (!allowedTypes.includes(file.mimetype)) {
            validation.isValid = false;
            validation.errors.push(`File type '${file.mimetype}' is not allowed`);
        }

        // Check file extension
        const ext = file.originalname.split('.').pop().toLowerCase();
        const allowedExtensions = allowedTypes.map(type => type.split('/')[1]);
        if (!allowedExtensions.includes(ext)) {
            validation.isValid = false;
            validation.errors.push(`File extension '.${ext}' is not allowed`);
        }

        return validation;
    }

    // Rate limiting helper
    static isRateLimited(requests, timeWindow, maxRequests) {
        const now = Date.now();
        const validRequests = requests.filter(timestamp => now - timestamp < timeWindow);
        
        return {
            isLimited: validRequests.length >= maxRequests,
            remaining: Math.max(0, maxRequests - validRequests.length),
            resetTime: validRequests.length > 0 ? validRequests[0] + timeWindow : now
        };
    }
}

module.exports = ValidationUtils;
