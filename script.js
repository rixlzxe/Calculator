// Calculator State
let currentInput = '0';
let previousInput = '';
let operator = null;
let shouldResetScreen = false;
let isRadians = false;
let memory = 0;
let openParentheses = 0;

// DOM Elements
const display = document.getElementById('display');
const history = document.getElementById('history');
const angleModeDisplay = document.getElementById('angleMode');
const memoryIndicator = document.getElementById('memoryIndicator');

// Update Displays
function updateDisplay() {
    display.textContent = currentInput;
}

function updateHistory() {
    if (previousInput && operator) {
        const opSymbol = operator === '*' ? '×' : operator === '/' ? '÷' : operator === '^' ? '^' : operator;
        history.textContent = `${previousInput} ${opSymbol}`;
    } else {
        history.textContent = '';
    }
}

function updateMemoryIndicator() {
    memoryIndicator.classList.toggle('active', memory !== 0);
}

// Angle Mode
function toggleAngleMode() {
    isRadians = !isRadians;
    angleModeDisplay.textContent = isRadians ? 'RAD' : 'DEG';
}

// Number Input
function appendNumber(number) {
    if (currentInput === '0' || shouldResetScreen) {
        currentInput = number;
        shouldResetScreen = false;
    } else if (currentInput.length < 16) {
        currentInput += number;
    }
    updateDisplay();
}

// Decimal
function appendDecimal() {
    if (shouldResetScreen) {
        currentInput = '0.';
        shouldResetScreen = false;
        updateDisplay();
        return;
    }
    const parts = currentInput.split(/[\+\-\*\/\^\(\)]/);
    const lastPart = parts[parts.length - 1];
    if (!lastPart.includes('.')) {
        currentInput += '.';
        updateDisplay();
    }
}

// Operators
function insertOperator(op) {
    if (shouldResetScreen && operator !== null) {
        operator = op;
        updateHistory();
        return;
    }
    
    if (operator !== null && !shouldResetScreen && !currentInput.endsWith('(')) {
        calculate();
    }
    
    previousInput = currentInput;
    operator = op;
    shouldResetScreen = true;
    updateHistory();
}

// Parentheses
function insertParenthesis(paren) {
    if (paren === '(') {
        if (currentInput === '0' || shouldResetScreen) {
            currentInput = '(';
            shouldResetScreen = false;
        } else {
            currentInput += '(';
        }
        openParentheses++;
    } else if (paren === ')' && openParentheses > 0) {
        currentInput += ')';
        openParentheses--;
    }
    updateDisplay();
}

// Scientific Functions
function insertFunction(func) {
    if (shouldResetScreen || currentInput === '0') {
        currentInput = func + '(';
        shouldResetScreen = false;
    } else {
        currentInput += func + '(';
    }
    openParentheses++;
    updateDisplay();
}

// Constants
function insertConstant(constant) {
    const value = constant === 'pi' ? Math.PI.toString() : Math.E.toString();
    if (currentInput === '0' || shouldResetScreen) {
        currentInput = value;
        shouldResetScreen = false;
    } else {
        currentInput += value;
    }
    updateDisplay();
}

// Sign Toggle
function toggleSign() {
    if (currentInput === '0') return;
    
    const match = currentInput.match(/(.*)([\+\-\*\/\^\(])(-?\d+\.?\d*)$/);
    if (match) {
        const num = parseFloat(match[3]);
        const newNum = (-num).toString();
        currentInput = match[1] + match[2] + newNum;
    } else {
        currentInput = (-parseFloat(currentInput)).toString();
    }
    updateDisplay();
}

// Factorial
function calculateFactorial() {
    const num = parseFloat(currentInput);
    if (num < 0 || !Number.isInteger(num) || num > 170) {
        currentInput = 'Error';
        updateDisplay();
        shouldResetScreen = true;
        return;
    }
    
    let result = 1;
    for (let i = 2; i <= num; i++) {
        result *= i;
    }
    
    currentInput = result.toString();
    updateDisplay();
    shouldResetScreen = true;
}

// Memory Functions
function memoryClear() {
    memory = 0;
    updateMemoryIndicator();
}

function memoryRecall() {
    currentInput = memory.toString();
    shouldResetScreen = true;
    updateDisplay();
}

function memoryAdd() {
    memory += parseFloat(currentInput) || 0;
    updateMemoryIndicator();
    shouldResetScreen = true;
}

function memorySubtract() {
    memory -= parseFloat(currentInput) || 0;
    updateMemoryIndicator();
    shouldResetScreen = true;
}

// Clear Functions
function clearAll() {
    currentInput = '0';
    previousInput = '';
    operator = null;
    shouldResetScreen = false;
    openParentheses = 0;
    updateDisplay();
    updateHistory();
}

function clearEntry() {
    currentInput = '0';
    updateDisplay();
}

function deleteLast() {
    if (currentInput.length === 1 || (currentInput.length === 2 && currentInput[0] === '-')) {
        currentInput = '0';
    } else {
        const lastChar = currentInput.slice(-1);
        if (lastChar === '(') openParentheses--;
        if (lastChar === ')') openParentheses++;
        currentInput = currentInput.slice(0, -1);
    }
    updateDisplay();
}

// Safe Evaluation with Scientific Functions
function safeEvaluate(expr) {
    let cleanExpr = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/\^/g, '**');
    
    cleanExpr = cleanExpr.replace(/(\d)\(/g, '$1*(');
    cleanExpr = cleanExpr.replace(/(\))(\d)/g, '$1*$2');
    
    const funcReplacements = {
        'sin(': 'Math.sin(',
        'cos(': 'Math.cos(',
        'tan(': 'Math.tan(',
        'log(': 'Math.log10(',
        'ln(': 'Math.log(',
        'sqrt(': 'Math.sqrt(',
        'cbrt(': 'Math.cbrt(',
        'abs(': 'Math.abs('
    };
    
    if (!isRadians) {
        cleanExpr = cleanExpr.replace(/Math\.sin\(/g, 'Math.sin(Math.PI/180*');
        cleanExpr = cleanExpr.replace(/Math\.cos\(/g, 'Math.cos(Math.PI/180*');
        cleanExpr = cleanExpr.replace(/Math\.tan\(/g, 'Math.tan(Math.PI/180*');
    }
    
    for (const [key, value] of Object.entries(funcReplacements)) {
        cleanExpr = cleanExpr.split(key).join(value);
    }
    
    while (openParentheses > 0) {
        cleanExpr += ')';
        openParentheses--;
    }
    
    try {
        const result = eval(cleanExpr);
        if (!isFinite(result) || isNaN(result)) throw new Error('Invalid result');
        return result;
    } catch (e) {
        throw new Error('Invalid expression');
    }
}

// Main Calculate
function calculate() {
    if (operator !== null && !shouldResetScreen) {
        let result;
        const prev = parseFloat(previousInput);
        const current = parseFloat(currentInput);
        
        if (isNaN(prev) || isNaN(current)) {
            currentInput = 'Error';
            updateDisplay();
            shouldResetScreen = true;
            return;
        }
        
        switch (operator) {
            case '+': result = prev + current; break;
            case '-': result = prev - current; break;
            case '*': result = prev * current; break;
            case '/':
                if (current === 0) {
                    currentInput = 'Error';
                    updateDisplay();
                    previousInput = '';
                    operator = null;
                    shouldResetScreen = true;
                    history.textContent = '';
                    return;
                }
                result = prev / current;
                break;
            case '^': result = Math.pow(prev, current); break;
            default: return;
        }
        
        result = parseFloat(result.toPrecision(12));
        currentInput = result.toString();
        previousInput = '';
        operator = null;
        shouldResetScreen = true;
        updateDisplay();
        history.textContent = '';
    } else {
        try {
            const result = safeEvaluate(currentInput);
            const formatted = parseFloat(result.toPrecision(12));
            currentInput = formatted.toString();
            shouldResetScreen = true;
            updateDisplay();
        } catch (e) {
            currentInput = 'Error';
            updateDisplay();
            shouldResetScreen = true;
        }
    }
}

// Keyboard Support
document.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9') appendNumber(e.key);
    if (e.key === '.') appendDecimal();
    if (e.key === '+') insertOperator('+');
    if (e.key === '-') insertOperator('-');
    if (e.key === '*') insertOperator('*');
    if (e.key === '/') {
        e.preventDefault();
        insertOperator('/');
    }
    if (e.key === '^') insertOperator('^');
    if (e.key === '(') insertParenthesis('(');
    if (e.key === ')') insertParenthesis(')');
    if (e.key === 'Enter' || e.key === '=') calculate();
    if (e.key === 'Escape') clearAll();
    if (e.key === 'Backspace') deleteLast();
});