# DSA Contest Rooms - Competitive Programming Helper

> A production-ready VS Code extension for competitive programming practice with contest rooms, HackerRank integration, and collaborative features

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Ruthwik000/roomcode)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## ✨ Features

### 🏆 Contest Mode
- **Create Contest Rooms** - Host coding contests with custom problems
- **Join Rooms** - Collaborate with friends using room codes
- **Real-time Judging** - Instant feedback on test cases
- **Timer & Leaderboard** - Track progress and compete

### 🎯 Practice Mode
- **Random Problems** - Fetch by difficulty (Easy/Medium/Hard) and topic
- **HackerRank Integration** - Import any problem instantly
- **Smart Test Generation** - Auto-generate additional test cases
- **Local Testing** - Run tests without submitting

### 🚀 Developer Experience
- **Multi-language Support** - C++, Python, Java, JavaScript, Go
- **Beautiful UI** - Modern webview interface
- **Auto-templates** - Start coding immediately
- **Browser Submission** - One-click submission with clipboard

## 📦 Installation

### Prerequisites
- VS Code 1.80.0 or higher
- Node.js 18.x or higher
- Compiler for your language (g++, python3, javac, etc.)

### From Source

```bash
# Clone the repository
git clone https://github.com/Ruthwik000/roomcode.git
cd roomcode

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Launch in development mode
code --extensionDevelopmentPath=.
# OR press F5 in VS Code
```

### Build VSIX Package

```bash
npm run package
# Installs: dsa-contest-rooms-1.0.0.vsix
```

## 🚀 Quick Start

### Contest Mode

**1. Create a Contest Room**
```
Ctrl+Shift+P → "DSA: Create Contest Room"
```
- Set duration and difficulty
- Share room code with friends
- Start coding together!

**2. Join a Contest Room**
```
Ctrl+Shift+P → "DSA: Join Contest Room"
```
- Enter room code
- View problem and timer
- Submit solutions

**3. Run Your Code**
```
Ctrl+Shift+P → "DSA: Run Code"
```
- Instant feedback on test cases
- See which tests passed/failed
- Track your progress

### Practice Mode

**1. Fetch Random Problem**
```
Ctrl+Shift+P → "DSA: Fetch Random Problem"
```
- Select category (Easy/Medium/Hard Algorithms or Data Structures)
- Problem fetched with test cases
- Start solving!

**2. Fetch Specific Problem**
```
Ctrl+Shift+P → "DSA: Fetch Problem by URL"
```
- Enter HackerRank URL
- Complete problem statement extracted
- All test cases included

**3. Test Your Solution**
```
Ctrl+Shift+P → "DSA: Run Sample Tests"
```
- Run provided test cases locally
- See detailed results

**4. Generate More Tests**
```
Ctrl+Shift+P → "DSA: Generate & Run More Tests"
```
- Auto-generates 5+ test cases
- Includes edge cases
- Comprehensive validation

**5. Submit Solution**
```
Ctrl+Shift+P → "DSA: Submit Solution"
```
- Code copied to clipboard
- Browser opens to submission page
- Login and paste!

## 📋 Commands

| Command | Description | Shortcut |
|---------|-------------|----------|
| `DSA: Create Contest Room` | Host a new contest | - |
| `DSA: Join Contest Room` | Join existing contest | - |
| `DSA: Run Code` | Execute in contest mode | - |
| `DSA: Fetch Random Problem` | Get random problem | - |
| `DSA: Fetch Problem by URL` | Import from HackerRank | - |
| `DSA: Run Sample Tests` | Test with samples | - |
| `DSA: Generate & Run More Tests` | Smart test generation | - |
| `DSA: Submit Solution` | Submit via browser | - |

## 🎨 UI Features

### Contest Room Interface
- **Clean Design** - Modern, distraction-free interface
- **Split View** - Problem on left, results on right
- **Live Timer** - Countdown to contest end
- **Verdict Banner** - Instant feedback (Accepted/Wrong Answer/etc.)
- **Test Results** - Detailed pass/fail for each test case
- **Room Code Display** - Easy sharing with copy button

### Practice Interface
- **Problem Viewer** - Formatted problem statements
- **Test Case Display** - Input/output examples
- **Result Visualization** - Color-coded test results
- **Progress Tracking** - See which tests passed

## 🏗️ Project Structure

```
dsa-contest-rooms/
├── src/
│   ├── extension.ts           # Main extension entry
│   ├── types.ts               # TypeScript interfaces
│   ├── config.ts              # Configuration
│   ├── executor.ts            # Code execution engine
│   ├── mockData.ts            # Sample data
│   ├── commands/
│   │   ├── createRoom.ts      # Contest creation
│   │   └── joinRoom.ts        # Room joining
│   ├── webview/
│   │   ├── index.html         # Contest UI
│   │   ├── app.js             # UI logic
│   │   └── styles.css         # Styling
│   ├── hackerrank.js          # HackerRank API
│   ├── randomProblem.js       # Problem selection
│   ├── testRunner.js          # Test execution
│   ├── testGenerator.js       # Test generation
│   ├── errorHandler.js        # Error handling
│   └── utils.js               # Utilities
├── package.json               # Extension manifest
├── tsconfig.json              # TypeScript config
├── .vscodeignore              # Package exclusions
└── README.md                  # This file
```

## 🔧 Configuration

### Environment Variables (Optional)

Create `.env` file:
```env
ABLY_API_KEY=your_ably_key_here  # For real-time collaboration
```

### Supported Languages

| Language | Compiler/Interpreter | Version |
|----------|---------------------|---------|
| C++ | g++ | C++17+ |
| Python | python3 | 3.7+ |
| Java | javac + java | 11+ |
| JavaScript | node | 14+ |
| Go | go | 1.16+ |

## 🧪 Testing

### Run Sample Tests
Tests your code against provided examples

### Generate Tests
Intelligently creates test cases based on:
- **Array Problems** - Random arrays with known results
- **String Problems** - Various string patterns
- **Math Problems** - Edge cases and boundaries
- **Graph Problems** - Different graph structures

## 🐛 Troubleshooting

### "No workspace folder open"
**Solution**: File > Open Folder, then select/create a folder

### Compilation errors
**Solution**: Ensure compiler is installed
```bash
g++ --version    # C++
python --version # Python
javac -version   # Java
node --version   # JavaScript
go version       # Go
```

### "Cannot find module"
**Solution**: Reinstall dependencies
```bash
npm install
npm run compile
```

### Contest room not connecting
**Solution**: Check Ably API key in `.env` file

### Characters not displaying
**Solution**: UTF-8 encoding is now supported (v1.0.0+)

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 Development

### Setup
```bash
npm install
npm run compile
```

### Watch Mode
```bash
npm run watch
```

### Package Extension
```bash
npm run package
```

## 🗺️ Roadmap

- [x] Contest room creation
- [x] Real-time collaboration
- [x] HackerRank integration
- [x] Smart test generation
- [x] Multi-language support
- [ ] LeetCode integration
- [ ] Codeforces integration
- [ ] Leaderboard system
- [ ] Solution history
- [ ] Code snippets library
- [ ] Performance analytics

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- HackerRank for problem platform
- Ably for real-time infrastructure
- VS Code Extension API
- The competitive programming community

## 📧 Support

- 🐛 [Report Bug](https://github.com/Ruthwik000/roomcode/issues)
- 💡 [Request Feature](https://github.com/Ruthwik000/roomcode/issues)
- 📖 [Documentation](https://github.com/Ruthwik000/roomcode/wiki)

## 🌟 Show Your Support

Give a ⭐️ if this project helped you!

---

**Made with ❤️ for competitive programmers**

**Status: Production Ready ✅**
