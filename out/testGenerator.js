// Simple test case generator for common problem patterns

function generateTestCases(problemData, count = 5) {
    const generatedTests = [];
    
    // Try to infer problem type from description
    const desc = (problemData.description || '').toLowerCase();
    const title = (problemData.title || '').toLowerCase();
    
    // Array sum problems
    if (title.includes('sum') || desc.includes('sum of')) {
        for (let i = 0; i < count; i++) {
            const n = Math.floor(Math.random() * 10) + 1;
            const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 100));
            const sum = arr.reduce((a, b) => a + b, 0);
            
            generatedTests.push({
                input: `${n}\n${arr.join(' ')}`,
                output: sum.toString(),
                generated: true
            });
        }
    }
    // Min/Max problems
    else if (title.includes('min') || title.includes('max')) {
        for (let i = 0; i < count; i++) {
            const n = Math.floor(Math.random() * 10) + 1;
            const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 100));
            const result = title.includes('min') ? Math.min(...arr) : Math.max(...arr);
            
            generatedTests.push({
                input: `${n}\n${arr.join(' ')}`,
                output: result.toString(),
                generated: true
            });
        }
    }
    // Comparison problems
    else if (title.includes('compare')) {
        for (let i = 0; i < count; i++) {
            const a = [Math.floor(Math.random() * 100), Math.floor(Math.random() * 100), Math.floor(Math.random() * 100)];
            const b = [Math.floor(Math.random() * 100), Math.floor(Math.random() * 100), Math.floor(Math.random() * 100)];
            
            let score = [0, 0];
            for (let j = 0; j < 3; j++) {
                if (a[j] > b[j]) score[0]++;
                else if (b[j] > a[j]) score[1]++;
            }
            
            generatedTests.push({
                input: `${a.join(' ')}\n${b.join(' ')}`,
                output: score.join(' '),
                generated: true
            });
        }
    }
    // Counting problems
    else if (title.includes('count') || desc.includes('how many')) {
        for (let i = 0; i < count; i++) {
            const n = Math.floor(Math.random() * 20) + 1;
            const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 10));
            const target = Math.floor(Math.random() * 10);
            const count = arr.filter(x => x === target).length;
            
            generatedTests.push({
                input: `${n}\n${arr.join(' ')}\n${target}`,
                output: count.toString(),
                generated: true
            });
        }
    }
    // String problems
    else if (title.includes('string') || title.includes('character')) {
        for (let i = 0; i < count; i++) {
            const len = Math.floor(Math.random() * 10) + 5;
            const str = Array.from({ length: len }, () => 
                String.fromCharCode(97 + Math.floor(Math.random() * 26))
            ).join('');
            
            generatedTests.push({
                input: str,
                output: str.length.toString(), // Simple length output
                generated: true
            });
        }
    }
    // Edge cases for any problem
    else {
        // Generate some basic edge cases
        generatedTests.push(
            { input: '0', output: '0', generated: true },
            { input: '1', output: '1', generated: true },
            { input: '10', output: '10', generated: true }
        );
    }
    
    return generatedTests;
}

function addEdgeCases(testCases, problemData) {
    const edgeCases = [];
    
    // Add empty/zero cases
    edgeCases.push({ input: '0', output: '0', generated: true, edge: true });
    
    // Add single element cases
    edgeCases.push({ input: '1\n1', output: '1', generated: true, edge: true });
    
    // Add large number cases if constraints mention limits
    const constraints = (problemData.constraints || []).join(' ');
    if (constraints.includes('10^9') || constraints.includes('1000000000')) {
        edgeCases.push({ 
            input: '1000000000', 
            output: '1000000000', 
            generated: true, 
            edge: true 
        });
    }
    
    return [...testCases, ...edgeCases];
}

module.exports = { generateTestCases, addEdgeCases };
