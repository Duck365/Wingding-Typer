// --- Game State Variables ---
let currentScreen = 'main-menu';
let gameMode = 'tests'; // 'tests' or 'practice'
let currentCategory = ''; // 'Words', 'Letters', etc.
let currentCase = 'regular'; // 'lowercase', 'uppercase', 'regular'

let targetText = '';
let typedIndex = 0;
let isRegularTest = false;

let gameActive = false;
let startTime = 0;
let timerInterval = null;
let timeLimitSeconds = 0;
let timeElapsed = 0;

let totalKeystrokes = 0;
let errors = 0;
let correctCharacters = 0;

// --- Dictionaries ---
const dictionaries = {
    words: ["the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "wingdings", "typing", "practice", "neon", "green", "github", "keyboard", "monitor", "accuracy", "speed", "test", "coding", "developer", "symbols", "letters", "numbers"],
    letters: "abcdefghijklmnopqrstuvwxyz".split(""),
    numbers: "0123456789".split(""),
    punctuation: [".", ",", "?", "!", "'", "\"", ";", ":"],
    symbols: ["@", "#", "$", "%", "^", "&", "*", "(", ")", "-", "_", "=", "+", "[", "]", "{", "}", "\\", "|", "<", ">", "/", "~", "`"]
};

// Combine all for 'Mix'
dictionaries.mix = [].concat(dictionaries.words, dictionaries.letters, dictionaries.numbers, dictionaries.punctuation, dictionaries.symbols);

// --- Navigation ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;

    if (screenId === 'key-screen' && document.getElementById('key-grid').children.length === 0) {
        generateKeyGrid();
    }
}

function openCaseSelection(mode, category) {
    gameMode = mode;
    currentCategory = category;
    isRegularTest = false;
    showScreen('case-menu');
}

function goBackFromCase() {
    showScreen(gameMode + '-menu');
}

function setupRegularTest() {
    gameMode = 'tests';
    currentCategory = 'regular-test';
    isRegularTest = true;
    
    // Simple prompt to get time in minutes
    let mins = prompt("Enter time limit in minutes (e.g. 1, 3, 5):", "1");
    if (mins === null) return; // Cancelled
    mins = parseFloat(mins);
    if (isNaN(mins) || mins <= 0) mins = 1;
    
    timeLimitSeconds = Math.floor(mins * 60);
    startGame('regular');
}

// --- Game Initialization ---
function startGame(selectedCase) {
    currentCase = selectedCase;
    
    totalKeystrokes = 0;
    errors = 0;
    correctCharacters = 0;
    timeElapsed = 0;
    
    if (gameMode === 'practice') {
        timeLimitSeconds = 0; // Endless
    } else if (!isRegularTest) {
        // Flashcard tests default to 1 minute if not regular
        timeLimitSeconds = 60; 
    }

    showScreen('game-screen');
    
    // Toggle font size for page mode vs flashcard mode
    const wdDisplay = document.getElementById('wingdings-display');
    const engDisplay = document.getElementById('english-display');
    if (isRegularTest) {
        wdDisplay.classList.add('page-mode');
        engDisplay.classList.add('page-mode');
    } else {
        wdDisplay.classList.remove('page-mode');
        engDisplay.classList.remove('page-mode');
    }

    generateNextTarget();
    
    gameActive = true;
    startTime = Date.now();
    updateHUD();
    
    clearInterval(timerInterval);
    timerInterval = setInterval(gameTick, 1000);
    
    // Focus hidden input for mobile keyboards
    document.getElementById('hidden-input').focus();
}

function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    if (isRegularTest) {
        showScreen('tests-menu');
    } else {
        showScreen(gameMode + '-menu');
    }
}

function finishTest() {
    gameActive = false;
    clearInterval(timerInterval);
    
    let wpm = calculateWPM();
    let acc = calculateAccuracy();
    
    alert(`Test Complete!\n\nWPM: ${wpm}\nAccuracy: ${acc}%`);
    endGame();
}

// --- Game Logic ---
function gameTick() {
    if (!gameActive) return;
    timeElapsed = Math.floor((Date.now() - startTime) / 1000);
    
    if (timeLimitSeconds > 0 && timeElapsed >= timeLimitSeconds) {
        finishTest();
    } else {
        updateHUD();
    }
}

function generateNextTarget() {
    typedIndex = 0;
    
    if (isRegularTest) {
        // Generate a paragraph of text
        let sentence = [];
        for (let i = 0; i < 20; i++) {
            let word = dictionaries.words[Math.floor(Math.random() * dictionaries.words.length)];
            sentence.push(word);
        }
        targetText = sentence.join(" ") + ".";
    } else {
        // Flashcard mode
        let dict = dictionaries[currentCategory.toLowerCase()] || dictionaries.mix;
        targetText = dict[Math.floor(Math.random() * dict.length)];
    }
    
    // Apply Case
    if (currentCase === 'lowercase') {
        targetText = targetText.toLowerCase();
    } else if (currentCase === 'uppercase') {
        targetText = targetText.toUpperCase();
    }
    // 'regular' leaves it as is
    
    // Ensure uppercase letters are randomized in 'Mix' regular mode for variety
    if (currentCategory === 'Mix' && currentCase === 'regular') {
        if (Math.random() > 0.5) targetText = targetText.toUpperCase();
    }
    
    renderText();
}

function renderText() {
    const wdDisplay = document.getElementById('wingdings-display');
    const engDisplay = document.getElementById('english-display');
    
    wdDisplay.textContent = targetText;
    
    let html = '';
    for (let i = 0; i < targetText.length; i++) {
        if (i < typedIndex) {
            html += `<span class="typed">${targetText[i]}</span>`;
        } else {
            html += `<span>${targetText[i]}</span>`;
        }
    }
    engDisplay.innerHTML = html;
}

function calculateWPM() {
    let minutes = timeElapsed / 60;
    if (minutes === 0) return 0;
    // Standard WPM: (characters / 5) / minutes
    return Math.round((correctCharacters / 5) / minutes);
}

function calculateAccuracy() {
    if (totalKeystrokes === 0) return 100;
    let acc = ((totalKeystrokes - errors) / totalKeystrokes) * 100;
    return Math.max(0, Math.round(acc));
}

function updateHUD() {
    let timeString = "00:00";
    if (timeLimitSeconds > 0) {
        let remaining = timeLimitSeconds - timeElapsed;
        if (remaining < 0) remaining = 0;
        let m = Math.floor(remaining / 60).toString().padStart(2, '0');
        let s = (remaining % 60).toString().padStart(2, '0');
        timeString = `${m}:${s}`;
    } else {
        let m = Math.floor(timeElapsed / 60).toString().padStart(2, '0');
        let s = (timeElapsed % 60).toString().padStart(2, '0');
        timeString = `${m}:${s}`;
    }
    
    document.getElementById('timer-display').textContent = `Time: ${timeString}`;
    document.getElementById('stats-display').textContent = `WPM: ${calculateWPM()} | Acc: ${calculateAccuracy()}%`;
}

// --- Input Handling (Strict Advance on Match) ---
document.addEventListener('keydown', (e) => {
    if (!gameActive) return;
    
    // Ignore modifier and special keys
    if (e.key.length !== 1) return;
    
    // Prevent default scrolling for spacebar
    if (e.key === " ") e.preventDefault();
    
    let targetChar = targetText[typedIndex];
    totalKeystrokes++;
    
    if (e.key === targetChar) {
        // Correct
        typedIndex++;
        correctCharacters++;
        renderText();
        
        if (typedIndex >= targetText.length) {
            // Reached end of current prompt
            setTimeout(generateNextTarget, 50); // slight delay for smooth visual transition
        }
    } else {
        // Incorrect
        errors++;
        
        // Flash red on the current character
        const engDisplay = document.getElementById('english-display');
        const spans = engDisplay.querySelectorAll('span');
        if (spans[typedIndex]) {
            spans[typedIndex].classList.add('incorrect');
            setTimeout(() => {
                if(spans[typedIndex]) spans[typedIndex].classList.remove('incorrect');
            }, 200);
        }
    }
    
    updateHUD();
});

// Refocus hidden input if user clicks away
document.addEventListener('click', () => {
    if (gameActive) {
        document.getElementById('hidden-input').focus();
    }
});

// --- Key Generation ---
function generateKeyGrid() {
    const grid = document.getElementById('key-grid');
    grid.innerHTML = '';
    
    // Generate ASCII characters from 33 (!) to 126 (~)
    for (let i = 33; i <= 126; i++) {
        let char = String.fromCharCode(i);
        
        let item = document.createElement('div');
        item.className = 'key-item';
        
        let wd = document.createElement('div');
        wd.className = 'key-wingding';
        wd.textContent = char;
        
        let en = document.createElement('div');
        en.className = 'key-english';
        en.textContent = char;
        
        item.appendChild(wd);
        item.appendChild(en);
        grid.appendChild(item);
    }
}
