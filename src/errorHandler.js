// Production-level error handling

class ExtensionError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.name = 'ExtensionError';
        this.code = code;
        this.details = details;
    }
}

function handleError(error, context = '') {
    console.error(`[Competitive Coding Helper] Error in ${context}:`, error);
    
    // Network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return new ExtensionError(
            'Network error. Please check your internet connection.',
            'NETWORK_ERROR',
            { originalError: error.message }
        );
    }
    
    // HTTP errors
    if (error.response) {
        const status = error.response.status;
        if (status === 403) {
            return new ExtensionError(
                'Access denied. The problem might be private or unavailable.',
                'ACCESS_DENIED',
                { status }
            );
        } else if (status === 404) {
            return new ExtensionError(
                'Problem not found. Please check the URL.',
                'NOT_FOUND',
                { status }
            );
        } else if (status === 429) {
            return new ExtensionError(
                'Too many requests. Please wait a moment and try again.',
                'RATE_LIMIT',
                { status }
            );
        } else if (status >= 500) {
            return new ExtensionError(
                'Server error. Please try again later.',
                'SERVER_ERROR',
                { status }
            );
        }
    }
    
    // Compilation errors
    if (error.message && error.message.includes('g++')) {
        return new ExtensionError(
            'C++ compiler not found. Please install g++ and add it to PATH.',
            'COMPILER_NOT_FOUND',
            { compiler: 'g++' }
        );
    }
    
    if (error.message && error.message.includes('javac')) {
        return new ExtensionError(
            'Java compiler not found. Please install JDK and add it to PATH.',
            'COMPILER_NOT_FOUND',
            { compiler: 'javac' }
        );
    }
    
    // File system errors
    if (error.code === 'ENOENT') {
        return new ExtensionError(
            'File not found. Please ensure the problem was fetched correctly.',
            'FILE_NOT_FOUND',
            { path: error.path }
        );
    }
    
    if (error.code === 'EACCES') {
        return new ExtensionError(
            'Permission denied. Please check file permissions.',
            'PERMISSION_DENIED',
            { path: error.path }
        );
    }
    
    // Default error
    return new ExtensionError(
        error.message || 'An unexpected error occurred.',
        'UNKNOWN_ERROR',
        { originalError: error }
    );
}

function validateProblemUrl(url) {
    if (!url || typeof url !== 'string') {
        throw new ExtensionError(
            'Invalid URL provided.',
            'INVALID_URL'
        );
    }
    
    const hackerrankPattern = /^https?:\/\/(www\.)?hackerrank\.com\/challenges\/[^\/]+/;
    
    if (!hackerrankPattern.test(url)) {
        throw new ExtensionError(
            'Invalid HackerRank URL. Expected format: https://www.hackerrank.com/challenges/[problem-name]/problem',
            'INVALID_URL_FORMAT',
            { url }
        );
    }
    
    return true;
}

function validateWorkspace(workspaceFolder) {
    if (!workspaceFolder) {
        throw new ExtensionError(
            'No workspace folder is open. Please open a folder first (File > Open Folder).',
            'NO_WORKSPACE'
        );
    }
    return true;
}

function validateCompiler(language) {
    const compilers = {
        'cpp': 'g++',
        'java': 'javac',
        'python': 'python',
        'javascript': 'node',
        'go': 'go'
    };
    
    const compiler = compilers[language];
    if (!compiler) {
        throw new ExtensionError(
            `Unsupported language: ${language}`,
            'UNSUPPORTED_LANGUAGE',
            { language }
        );
    }
    
    return compiler;
}

module.exports = {
    ExtensionError,
    handleError,
    validateProblemUrl,
    validateWorkspace,
    validateCompiler
};
