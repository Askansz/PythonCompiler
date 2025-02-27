// Initialize variables
let pyodideReadyPromise;
let pyodide;
let isReady = false;

// Initialize Pyodide with simulated downloads
async function initPyodide() {
    // First show initialization messages
    appendOutput("SYSTEM INITIALIZATION SEQUENCE STARTED...", true);
    
    await simulateDownload("core_system_files", 3);
    await simulateDownload("python_runtime", 5);
    
    try {
        appendOutput("CONNECTING TO PYTHON SERVERS...", true);
        pyodide = await loadPyodide();
        
        appendOutput("DOWNLOADING PYTHON LIBRARIES...", true);
        await simulateDownload("pythonlib311.so", 7);
        await simulateDownload("libpython3.11.so", 4);
        await simulateDownload("stdlib_modules", 6);
        
        appendOutput("CONFIGURING PYTHON ENVIRONMENT...", true);
        await pyodide.loadPackagesFromImports('numpy matplotlib');
        
        appendOutput("[SUCCESS] PYTHON INTERPRETER READY", true);
        appendOutput("SYSTEM FULLY OPERATIONAL - AWAITING COMMANDS", true);
        isReady = true;
        return pyodide;
    } catch (error) {
        appendOutput(`<span class="error">ERROR DURING INITIALIZATION: ${error.message}</span>`, true);
        appendOutput("<span class='error'>ATTEMPTING EMERGENCY RECOVERY...</span>", true);
        
        // Try an alternative approach or use a fallback mechanism
        await simulateDownload("emergency_recovery_modules", 5);
        appendOutput("<span class='error'>LIMITED FUNCTIONALITY MODE ACTIVATED</span>", true);
        
        // Return a simple mock object that handles basic operations
        return createFallbackPyodide();
    }
}

// Simulate downloading a file with progress bar
async function simulateDownload(filename, seconds) {
    return new Promise(resolve => {
        appendOutput(`DOWNLOADING: ${filename}`, true);
        
        // Create progress bar container
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-bar-container';
        
        // Create progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressContainer.appendChild(progressBar);
        
        // Add to output
        outputElement.appendChild(progressContainer);
        terminal.scrollTop = terminal.scrollHeight;
        
        // Simulate random download speed with occasional "glitches"
        const totalSteps = 20;
        const interval = (seconds * 1000) / totalSteps;
        let currentStep = 0;
        
        const downloadInterval = setInterval(() => {
            currentStep++;
            
            // Calculate progress percentage
            let progress = (currentStep / totalSteps) * 100;
            
            // Add random variation to simulate network fluctuations
            const randomVariation = Math.random() * 5;
            progress = Math.min(progress + randomVariation, currentStep === totalSteps ? 100 : 99);
            
            // Update progress bar
            progressBar.style.width = `${progress}%`;
            
            // Occasional "glitch" in the terminal
            if (Math.random() < 0.2) {
                const glitch = document.createElement('div');
                glitch.className = 'glitch';
                glitch.textContent = generateRandomHex(Math.floor(Math.random() * 20) + 5);
                outputElement.appendChild(glitch);
                
                // Remove glitch after a brief moment
                setTimeout(() => {
                    outputElement.removeChild(glitch);
                }, 200);
            }
            
            terminal.scrollTop = terminal.scrollHeight;
            
            if (currentStep >= totalSteps) {
                clearInterval(downloadInterval);
                appendOutput(`[SUCCESS] DOWNLOADED: ${filename}`, true);
                resolve();
            }
        }, interval);
    });
}

// Generate random hex characters for "glitch" effect
function generateRandomHex(length) {
    let result = '';
    const characters = '0123456789ABCDEF';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// Create a fallback mock Pyodide for basic functionality if real one fails
function createFallbackPyodide() {
    return {
        runPythonAsync: async (code) => {
            // Handle simple print statements
            if (code.includes('print(')) {
                const printMatch = code.match(/print\(['"](.+)['"]\)/);
                if (printMatch && printMatch[1]) {
                    return printMatch[1];
                }
            }
            
            // Basic math operations
            if (/^[\d\+\-\*\/\s\(\)\.]+$/.test(code)) {
                try {
                    return eval(code);
                } catch (e) {
                    throw new Error("Invalid math expression");
                }
            }
            
            // For other code, return a message about limited functionality
            return "Running in limited functionality mode. Only basic operations available.";
        },
        globals: {
            get: () => (obj) => obj.toString()
        }
    };
}

// Set up the Pyodide initialization promise when the page loads
window.addEventListener('load', () => {
    pyodideReadyPromise = initPyodide();
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
        } else if (input.trim() === 'install') {
            installPythonLibraries();
            return;
        } else if (input.trim() === 'system') {
            showSystemInfo();
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
    } else if (e.key === 'Tab') {
        e.preventDefault();
        autocompleteCommand();
    }
});

// Execute Python code
async function executeCode(code) {
    try {
        if (!isReady) {
            appendOutput("<span class='error'>SYSTEM STILL INITIALIZING. PLEASE WAIT...</span>", true);
            return;
        }
        
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

// Simulate installing additional Python libraries
async function installPythonLibraries() {
    appendOutput("INITIALIZING PACKAGE MANAGER...", true);
    await simulateDownload("package_index.db", 2);
    
    appendOutput("SCANNING FOR MISSING DEPENDENCIES...", true);
    const libs = [
        "python3.11-dev_3.11.4-1_amd64.deb",
        "libpython3.11-stdlib_3.11.4-1_amd64.deb",
        "pythonlib311-extensions.tar.gz",
        "python3.11-venv_3.11.4-1_amd64.deb",
        "libpython3.11-minimal_3.11.4-1_amd64.deb"
    ];
    
    for (const lib of libs) {
        await simulateDownload(lib, Math.random() * 3 + 2);
        appendOutput(`INSTALLING: ${lib}`, true);
        await simulateProgress(Math.random() * 2 + 1);
        appendOutput(`[SUCCESS] INSTALLED: ${lib}`, true);
    }
    
    appendOutput("CONFIGURING LIBRARIES...", true);
    await simulateProgress(3);
    appendOutput("<span style='color:#27c93f'>ALL LIBRARIES SUCCESSFULLY INSTALLED AND CONFIGURED!</span>", true);
    appendOutput("PYTHON 3.11 ENVIRONMENT IS NOW FULLY OPERATIONAL", true);
}

// Simulate a generic progress operation
async function simulateProgress(seconds) {
    return new Promise(resolve => {
        // Create progress bar container
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-bar-container';
        
        // Create progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressContainer.appendChild(progressBar);
        
        // Add to output
        outputElement.appendChild(progressContainer);
        terminal.scrollTop = terminal.scrollHeight;
        
        // Simulate progress
        const totalSteps = 20;
        const interval = (seconds * 1000) / totalSteps;
        let currentStep = 0;
        
        const progressInterval = setInterval(() => {
            currentStep++;
            
            // Calculate progress percentage
            let progress = (currentStep / totalSteps) * 100;
            
            // Update progress bar
            progressBar.style.width = `${progress}%`;
            
            terminal.scrollTop = terminal.scrollHeight;
            
            if (currentStep >= totalSteps) {
                clearInterval(progressInterval);
                resolve();
            }
        }, interval);
    });
}

// Show system information
function showSystemInfo() {
    appendOutput("GATHERING SYSTEM INFORMATION...", true);
    
    setTimeout(() => {
        appendOutput("==== SYSTEM DIAGNOSTICS ====", true);
        appendOutput(`OS: ${navigator.platform} [UNIX-BASED SYSTEM]`, false);
        appendOutput(`BROWSER: ${navigator.userAgent.match(/(?:firefox|chrome|safari|opera|edge|msie)[\/\s](\d+)/i)[0]}`, false);
        appendOutput(`PYTHON VERSION: 3.11.4 (64-bit)`, false);
        appendOutput(`CPU CORES: ${navigator.hardwareConcurrency || 'UNKNOWN'}`, false);
        appendOutput(`MEMORY AVAILABLE: ${Math.round(Math.random() * 8000 + 4000)}MB`, false);
        appendOutput(`DISK ENCRYPTION: ENABLED`, false);
        appendOutput(`NETWORK: SECURE CONNECTION [${Math.round(Math.random() * 100 + 50)}Mbps]`, false);
        appendOutput(`SYSTEM UPTIME: ${Math.round(Math.random() * 48 + 2)} HOURS`, false);
        appendOutput("========================", false);
    }, 1000);
}

// Auto-complete commands
function autocompleteCommand() {
    const input = inputElement.value.trim();
    const commands = ['help', 'clear', 'multiline', 'install', 'system', 'print', 'import'];
    
    const matchingCommands = commands.filter(cmd => cmd.startsWith(input));
    
    if (matchingCommands.length === 1) {
        inputElement.value = matchingCommands[0];
    } else if (matchingCommands.length > 1) {
        appendOutput(`<span class="prompt">root@h4ck3r:~#</span> ${input}`, false);
        appendOutput("POSSIBLE COMMANDS:", true);
        matchingCommands.forEach(cmd => {
            appendOutput(` - ${cmd}`, false);
        });
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
        appendOutput(" - <span style='color:#ffbd2e'>install</span>: Install Python libraries", false);
        appendOutput(" - <span style='color:#ffbd2e'>system</span>: Display system information", false);
        appendOutput("PYTHON EXAMPLES:", true);
        setTimeout(() => {
            appendOutput(" - <span style='color:#ffbd2e'>print('Hello, Hacker World!')</span>", false);
            appendOutput(" - <span style='color:#ffbd2e'>import random; random.randint(1, 100)</span>", false);
            appendOutput(" - <span style='color:#ffbd2e'>for i in range(5): print(f'Loop: {i}')</span>", false);
        }, 500);
    }, 500);
