const axios = require('axios');

// Simplified problem lists - no authentication needed
const PROBLEM_SETS = {
    'easy-algorithms': [
        { slug: 'solve-me-first', title: 'Solve Me First', difficulty: 'easy' },
        { slug: 'simple-array-sum', title: 'Simple Array Sum', difficulty: 'easy' },
        { slug: 'compare-the-triplets', title: 'Compare the Triplets', difficulty: 'easy' },
        { slug: 'a-very-big-sum', title: 'A Very Big Sum', difficulty: 'easy' },
        { slug: 'diagonal-difference', title: 'Diagonal Difference', difficulty: 'easy' },
        { slug: 'plus-minus', title: 'Plus Minus', difficulty: 'easy' },
        { slug: 'staircase', title: 'Staircase', difficulty: 'easy' },
        { slug: 'mini-max-sum', title: 'Mini-Max Sum', difficulty: 'easy' },
        { slug: 'birthday-cake-candles', title: 'Birthday Cake Candles', difficulty: 'easy' },
        { slug: 'time-conversion', title: 'Time Conversion', difficulty: 'easy' }
    ],
    'medium-algorithms': [
        { slug: 'the-grid-search', title: 'The Grid Search', difficulty: 'medium' },
        { slug: 'extra-long-factorials', title: 'Extra Long Factorials', difficulty: 'medium' },
        { slug: 'append-and-delete', title: 'Append and Delete', difficulty: 'medium' },
        { slug: 'sherlock-and-squares', title: 'Sherlock and Squares', difficulty: 'medium' },
        { slug: 'library-fine', title: 'Library Fine', difficulty: 'medium' },
        { slug: 'cut-the-sticks', title: 'Cut the sticks', difficulty: 'medium' },
        { slug: 'non-divisible-subset', title: 'Non-Divisible Subset', difficulty: 'medium' },
        { slug: 'repeated-string', title: 'Repeated String', difficulty: 'medium' },
        { slug: 'jumping-on-the-clouds', title: 'Jumping on the Clouds', difficulty: 'medium' },
        { slug: 'equality-in-a-array', title: 'Equalize the Array', difficulty: 'medium' }
    ],
    'hard-algorithms': [
        { slug: 'matrix-rotation-algo', title: 'Matrix Layer Rotation', difficulty: 'hard' },
        { slug: 'the-bomberman-game', title: 'The Bomberman Game', difficulty: 'hard' },
        { slug: 'new-year-chaos', title: 'New Year Chaos', difficulty: 'hard' },
        { slug: 'minimum-swaps-2', title: 'Minimum Swaps 2', difficulty: 'hard' },
        { slug: 'array-manipulation', title: 'Array Manipulation', difficulty: 'hard' },
        { slug: 'roads-and-libraries', title: 'Roads and Libraries', difficulty: 'hard' },
        { slug: 'find-the-nearest-clone', title: 'Find the nearest clone', difficulty: 'hard' },
        { slug: 'max-array-sum', title: 'Max Array Sum', difficulty: 'hard' },
        { slug: 'abbreviation', title: 'Abbreviation', difficulty: 'hard' },
        { slug: 'candies', title: 'Candies', difficulty: 'hard' }
    ],
    'easy-data-structures': [
        { slug: 'arrays-ds', title: 'Arrays - DS', difficulty: 'easy' },
        { slug: '2d-array', title: '2D Array - DS', difficulty: 'easy' },
        { slug: 'dynamic-array', title: 'Dynamic Array', difficulty: 'easy' },
        { slug: 'array-left-rotation', title: 'Left Rotation', difficulty: 'easy' },
        { slug: 'sparse-arrays', title: 'Sparse Arrays', difficulty: 'easy' },
        { slug: 'print-the-elements-of-a-linked-list', title: 'Print the Elements of a Linked List', difficulty: 'easy' },
        { slug: 'insert-a-node-at-the-tail-of-a-linked-list', title: 'Insert a node at the tail of a linked list', difficulty: 'easy' },
        { slug: 'insert-a-node-at-the-head-of-a-linked-list', title: 'Insert a Node at the head of a Linked List', difficulty: 'easy' },
        { slug: 'tree-preorder-traversal', title: 'Tree: Preorder Traversal', difficulty: 'easy' },
        { slug: 'tree-postorder-traversal', title: 'Tree: Postorder Traversal', difficulty: 'easy' }
    ]
};

const CATEGORIES = {
    'Easy Algorithms': 'easy-algorithms',
    'Medium Algorithms': 'medium-algorithms',
    'Hard Algorithms': 'hard-algorithms',
    'Easy Data Structures': 'easy-data-structures'
};

async function getRandomProblem(category) {
    try {
        const categoryKey = CATEGORIES[category];
        const problems = PROBLEM_SETS[categoryKey];
        
        if (!problems || problems.length === 0) {
            throw new Error('No problems found for the selected category');
        }

        // Pick a random problem
        const randomProblem = problems[Math.floor(Math.random() * problems.length)];
        
        return {
            slug: randomProblem.slug,
            url: `https://www.hackerrank.com/challenges/${randomProblem.slug}/problem`,
            title: randomProblem.title,
            difficulty: randomProblem.difficulty
        };
    } catch (error) {
        throw new Error(`Failed to get random problem: ${error.message}`);
    }
}

function getCategories() {
    return Object.keys(CATEGORIES);
}

module.exports = { getRandomProblem, getCategories };
