const vscode = acquireVsCodeApi();

let currentQuestion = null;
let contestEndTime = null;

// Initialize
window.addEventListener('message', event => {
  const message = event.data;
  
  switch (message.type) {
    case 'LOAD_QUESTION':
      loadQuestion(message.payload);
      break;
    case 'RUN_RESULT':
      displayResults(message.payload);
      break;
  }
});

function loadQuestion(data) {
  currentQuestion = data.question;
  contestEndTime = data.contestEndTime;
  
  document.getElementById('questionTitle').textContent = currentQuestion.title;
  document.getElementById('difficulty').textContent = currentQuestion.difficulty;
  document.getElementById('difficulty').className = `difficulty ${currentQuestion.difficulty}`;
  document.getElementById('description').textContent = currentQuestion.description;
  document.getElementById('languageSelect').value = currentQuestion.language;
  
  // Show room code if available
  if (data.roomId) {
    document.getElementById('roomCodeValue').textContent = data.roomId;
    document.getElementById('roomCode').style.display = 'block';
  }
  
  startTimer();
}

// Copy room code functionality
document.getElementById('copyRoomCode').addEventListener('click', () => {
  const roomCode = document.getElementById('roomCodeValue').textContent;
  vscode.postMessage({
    type: 'COPY_ROOM_CODE',
    payload: { roomCode }
  });
});

function startTimer() {
  setInterval(() => {
    const now = Date.now();
    const remaining = Math.max(0, contestEndTime - now);
    
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    document.getElementById('timer').textContent = 
      `Time: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    if (remaining === 0) {
      document.getElementById('runButton').disabled = true;
      document.getElementById('timer').textContent = 'Contest Ended';
    }
  }, 1000);
}

document.getElementById('runButton').addEventListener('click', () => {
  const button = document.getElementById('runButton');
  button.disabled = true;
  button.textContent = 'Running...';
  
  // Clear previous results
  document.getElementById('verdictBanner').className = 'verdict-banner';
  document.getElementById('testResults').innerHTML = '';
  
  vscode.postMessage({
    type: 'RUN_CODE',
    payload: {
      language: document.getElementById('languageSelect').value,
      testCases: currentQuestion.testCases
    }
  });
});

function displayResults(result) {
  const button = document.getElementById('runButton');
  button.disabled = false;
  button.textContent = 'Run Code';
  
  // Show verdict banner
  const banner = document.getElementById('verdictBanner');
  banner.textContent = result.verdict;
  banner.className = `verdict-banner show ${result.verdict.replace(' ', '')}`;
  
  // Show test results
  const resultsContainer = document.getElementById('testResults');
  result.results.forEach(test => {
    const div = document.createElement('div');
    div.className = `test-result ${test.status === 'Passed' ? 'Passed' : 'Failed'}`;
    div.innerHTML = `
      <strong>Test ${test.test}:</strong> ${test.status}
      ${test.expected ? `<div class="test-result-details">Expected: ${test.expected}<br>Got: ${test.actual}</div>` : ''}
    `;
    resultsContainer.appendChild(div);
  });
}
