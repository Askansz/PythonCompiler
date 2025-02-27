// Initialize variables
let pyodideReadyPromise;
let pyodide;

// Initialize Pyodide
async function initPyodide() {
    pyodide = await loadPyodide();
    await pyodide.loadPackagesFromImports('numpy matplotlib');
    return pyodide;
}

// Set up the Pyodide initialization promise
window.addEventListener('load', () => {
    pyodideReadyPromise = initPyodide();
    
    // Show initialization message with typing effect
    setTimeout(() => {
        appendOutput("LOADING PYODIDE RUNTIME...", true);
    }, 1000);
    
    setTimeout(() => {
        appendOutput("[SUCCESS] PYTHON INTERPRETER READY", true);
    }, 3000);
});

// Track multiline input
let multilineInput = [];
let isMultilineMode = false;

// Terminal history
let commandHistory = [];
let historyIndex = -1;

// Get DOM elements
const terminal = document.getElementById('terminal');
const outputElement = document.getElementById('output');
const inputElement = document.getElementById('terminal-input');

// Focus input when terminal is clicked
terminal.addEventListener('click', () => {
    inputElement.focus();
});

// Handle input submission
inputElement.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        
        const input = inputElement.value;
        inputElement.value = '';
        
        // Handle empty input
        if (input.trim() === '' && !isMultilineMode) {
            appendOutput(`<span class="prompt">root@h4ck3r:~#</span> `, false);
            return;
        }
        
        // Add to command history
        if (input.trim() !== '') {
            commandHistory.push(input);
            historyIndex = commandHistory.length;
        }
        
        // Display input
        appendOutput(`<span class="prompt">root@h4ck3r:~#</span> ${input}`, false);
        
        // Handle multiline input
        if (isMultilineMode) {
            if (input.trim() === '```') {
                isMultilineMode = false;
                const codeToRun = multilineInput.join('\n');
                multilineInput = [];
                await executeCode(codeToRun);
            } else {
                multilineInput.push(input);
            }
            return;
        }
        
        // Handle special commands
        if (input.trim() === 'clear') {
            outputElement.innerHTML = '';
            return;
        } else if (input.trim() === 'help') {
            showHelp();
            return;
        } else if (input.trim() === 'multiline' || input.trim() === '```') {
            isMultilineMode = true;
            multilineInput = [];
            appendOutput("Enter multiline code. Type ``` to execute:", true);
            return;
        }
        
        // Execute Python code
        await executeCode(input);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex > 0) {
            historyIndex--;
            inputElement.value = commandHistory[historyIndex];
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
            historyIndex++;
            inputElement.value = commandHistory[historyIndex];
        } else {
            historyIndex = commandHistory.length;
            inputElement.value = '';
        }
    }
});

// Execute Python code
async function executeCode(code) {
    try {
        // Wait for Pyodide to be ready
        const pyodide = await pyodideReadyPromise;
        
        // Add animation to show execution
        appendOutput("EXECUTING CODE...", true);
        
        // Execute the code
        let result;
        try {
            result = await pyodide.runPythonAsync(code);
            if (result !== undefined) {
                const resultStr = pyodide.globals.get('str')(result);
                setTimeout(() => {
                    appendOutput("OUTPUT:", true);
                    appendOutput(resultStr.toString(), true);
                }, 500);
            }
        } catch (err) {
            setTimeout(() => {
                appendOutput(`<span class="error">ERROR: ${err.message}</span>`, true);
            }, 500);
        }
    } catch (err) {
        appendOutput(`<span class="error">SYSTEM ERROR: ${err.message}</span>`, true);
    }
}

// Append output to terminal
function appendOutput(text, typing = false) {
    const outputLine = document.createElement('div');
    if (typing) {
        outputLine.className = 'typing';
        outputLine.style.width = '0';
        
        // Create a temporary span to calculate the full width
        const tempSpan = document.createElement('span');
        tempSpan.style.visibility = 'hidden';
        tempSpan.style.position = 'absolute';
        tempSpan.style.whiteSpace = 'nowrap';
        tempSpan.innerHTML = text;
        document.body.appendChild(tempSpan);
        const fullWidth = tempSpan.offsetWidth;
        document.body.removeChild(tempSpan);
        
        // Animate the typing effect
        outputLine.innerHTML = text;
        outputElement.appendChild(outputLine);
        
        // Calculate typing speed based on content length
        const typingDuration = Math.min(Math.max(text.length * 30, 500), 2000);
        
        outputLine.animate(
            [
                { width: '0', borderRightColor: '#00ff00' },
                { width: fullWidth + 'px', borderRightColor: '#00ff00' }
            ],
            {
                duration: typingDuration,
                easing: 'steps(40, end)',
                fill: 'forwards'
            }
        );
    } else {
        outputLine.innerHTML = text;
        outputElement.appendChild(outputLine);
    }
    
    // Scroll to bottom
    terminal.scrollTop = terminal.scrollHeight;
}

// Show help text
function showHelp() {
    appendOutput("AVAILABLE COMMANDS:", true);
    setTimeout(() => {
        appendOutput(" - <span style='color:#ffbd2e'>help</span>: Show this help menu", false);
        appendOutput(" - <span style='color:#ffbd2e'>clear</span>: Clear terminal screen", false);
        appendOutput(" - <span style='color:#ffbd2e'>multiline</span> or <span style='color:#ffbd2e'>```</span>: Enter multiline code mode", false);
        appendOutput("PYTHON EXAMPLES:", true);
        setTimeout(() => {
            appendOutput(" - <span style='color:#ffbd2e'>print('Hello, Hacker World!')</span>", false);
            appendOutput(" - <span style='color:#ffbd2e'>import random; random.randint(1, 100)</span>", false);
            appendOutput(" - <span style='color:#ffbd2e'>for i in range(5): print(f'Loop: {i}')</span>", false);
        }, 500);
    }, 500);
}
