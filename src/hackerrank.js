const axios = require('axios');
const cheerio = require('cheerio');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

let isLoggedIn = false;
let csrfToken = '';

async function login(username, password) {
    try {
        // Get CSRF token
        const loginPage = await client.get('https://www.hackerrank.com/auth/login', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        const cookies = loginPage.headers['set-cookie'];
        csrfToken = cookies?.find(c => c.includes('_csrf_token'))?.split('=')[1]?.split(';')[0];

        // Login
        await client.post('https://www.hackerrank.com/auth/login', {
            login: username,
            password: password,
            remember_me: false
        }, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            }
        });

        isLoggedIn = true;
        return true;
    } catch (error) {
        throw new Error(`HackerRank login failed: ${error.message}`);
    }
}

async function fetchProblem(url) {
    try {
        // Extract challenge slug from URL
        const slug = url.split('/challenges/')[1]?.split('/')[0];
        if (!slug) throw new Error('Invalid problem URL');

        // Fetch problem via API
        const response = await client.get(`https://www.hackerrank.com/rest/contests/master/challenges/${slug}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            }
        });
        const data = response.data.model;

        // Parse HTML body to extract sections
        const $ = cheerio.load(data.body_html || '');
        
        // Extract problem statement - get all text content
        let description = '';
        let inputFormat = '';
        let outputFormat = '';
        const constraints = [];
        
        // Get the main problem description
        const problemStatement = $('.challenge-body-html, .problem-statement').first();
        if (problemStatement.length) {
            description = problemStatement.text().trim();
        } else {
            // Fallback: get first substantial paragraph
            $('p').each((i, elem) => {
                const text = $(elem).text().trim();
                if (!description && text.length > 30) {
                    description = text;
                }
            });
        }

        // If still no description, use preview
        if (!description) {
            description = data.preview || 'No description available';
        }

        // Look for specific sections with better parsing
        let currentSection = '';
        $('h3, h4, h5, strong, p, pre, ul, li').each((i, elem) => {
            const $elem = $(elem);
            const text = $elem.text().trim();
            const tagName = elem.name;
            
            // Detect section headers
            if (tagName === 'h3' || tagName === 'h4' || tagName === 'h5' || (tagName === 'strong' && text.length < 50)) {
                const heading = text.toLowerCase();
                if (heading.includes('input format') || heading.includes('input description')) {
                    currentSection = 'input';
                } else if (heading.includes('output format') || heading.includes('output description')) {
                    currentSection = 'output';
                } else if (heading.includes('constraint')) {
                    currentSection = 'constraints';
                } else if (heading.includes('problem statement') || heading.includes('task')) {
                    currentSection = 'description';
                } else {
                    currentSection = '';
                }
            } else {
                // Add content to current section
                if (currentSection === 'input' && text) {
                    inputFormat += text + '\n';
                } else if (currentSection === 'output' && text) {
                    outputFormat += text + '\n';
                } else if (currentSection === 'constraints' && text) {
                    if (tagName === 'li' || text.includes('≤') || text.includes('<=')) {
                        constraints.push(text);
                    }
                }
            }
        });

        // Extract test cases
        const testCases = [];
        if (data.sample_testcases) {
            const cases = data.sample_testcases.split('\n\n');
            for (let i = 0; i < cases.length; i += 2) {
                if (cases[i]) {
                    testCases.push({
                        input: cases[i].trim(),
                        output: cases[i + 1]?.trim() || ''
                    });
                }
            }
        }

        return {
            id: slug,
            title: data.name,
            description: description.trim(),
            inputFormat: inputFormat.trim(),
            outputFormat: outputFormat.trim(),
            constraints: constraints.filter(c => c.length > 0),
            difficulty: data.difficulty_name,
            timeLimit: data.max_time_limit ? `${data.max_time_limit}s` : undefined,
            testCases,
            language: 'cpp',
            template: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}\n'
        };
    } catch (error) {
        throw new Error(`Failed to fetch problem: ${error.message}`);
    }
}

async function submitSolution(url, code, language) {
    if (!isLoggedIn) {
        throw new Error('Please login first');
    }

    try {
        const slug = url.split('/challenges/')[1]?.split('/')[0];
        
        // Language mapping
        const langMap = {
            'cpp': 'cpp14',
            'python': 'python3',
            'java': 'java8'
        };

        // Submit code
        const response = await client.post(`https://www.hackerrank.com/rest/contests/master/challenges/${slug}/submissions`, {
            code: code,
            language: langMap[language] || 'cpp14',
            contest_slug: 'master'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            }
        });

        return { status: 'Submitted successfully', id: response.data.model?.id };
    } catch (error) {
        throw new Error(`Submission failed: ${error.message}`);
    }
}

module.exports = { login, fetchProblem, submitSolution };
