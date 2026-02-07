const axios = require('axios');
const cheerio = require('cheerio');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

let isLoggedIn = false;

async function login(username, password) {
    try {
        // Get CSRF token
        const loginPage = await client.get('https://atcoder.jp/login', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        const $ = cheerio.load(loginPage.data);
        const csrfToken = $('input[name="csrf_token"]').val();

        // Login
        await client.post('https://atcoder.jp/login', {
            username,
            password,
            csrf_token: csrfToken
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        isLoggedIn = true;
        return true;
    } catch (error) {
        throw new Error(`AtCoder login failed: ${error.message}`);
    }
}

async function fetchProblem(url) {
    try {
        const response = await client.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html'
            }
        });
        const $ = cheerio.load(response.data);

        // Extract problem details
        const title = $('span.h2').first().text().trim();
        const problemId = url.split('/').pop();
        
        // Extract sections
        let description = '';
        let inputFormat = '';
        let outputFormat = '';
        const constraints = [];
        
        $('#task-statement').find('section').each((i, section) => {
            const $section = $(section);
            const heading = $section.find('h3').text().trim();
            const content = $section.find('.part').text().trim();
            
            if (heading.includes('Problem Statement') || heading.includes('問題文')) {
                description = content;
            } else if (heading.includes('Constraints') || heading.includes('制約')) {
                content.split('\n').forEach(line => {
                    if (line.trim()) constraints.push(line.trim());
                });
            } else if (heading.includes('Input') || heading.includes('入力')) {
                inputFormat = content;
            } else if (heading.includes('Output') || heading.includes('出力')) {
                outputFormat = content;
            }
        });

        // Extract time and memory limits
        const timeLimit = $('.col-sm-12').text().match(/Time Limit: ([\d.]+ sec)/)?.[1];
        const memoryLimit = $('.col-sm-12').text().match(/Memory Limit: ([\d]+ MB)/)?.[1];

        // Extract test cases
        const testCases = [];
        $('.part').each((i, elem) => {
            const $elem = $(elem);
            const heading = $elem.find('h3').text();
            if (heading.includes('Sample Input')) {
                const input = $elem.find('pre').text().trim();
                const outputElem = $elem.next();
                const output = outputElem.find('pre').text().trim();
                testCases.push({ input, output });
            }
        });

        return {
            id: problemId,
            title,
            description,
            inputFormat,
            outputFormat,
            constraints,
            timeLimit,
            memoryLimit,
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
        const contestId = url.split('/')[4];
        const problemId = url.split('/').pop();
        
        // Get CSRF token
        const submitPage = await client.get(`https://atcoder.jp/contests/${contestId}/submit`);
        const $ = cheerio.load(submitPage.data);
        const csrfToken = $('input[name="csrf_token"]').val();

        // Language ID mapping
        const langMap = {
            'cpp': '4003',
            'python': '4006',
            'java': '4005'
        };

        // Submit
        const response = await client.post(`https://atcoder.jp/contests/${contestId}/submit`, {
            'data.TaskScreenName': problemId,
            'data.LanguageId': langMap[language] || '4003',
            sourceCode: code,
            csrf_token: csrfToken
        });

        return { status: 'Submitted successfully' };
    } catch (error) {
        throw new Error(`Submission failed: ${error.message}`);
    }
}

module.exports = { login, fetchProblem, submitSolution };
