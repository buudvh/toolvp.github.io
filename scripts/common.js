// Global variables
let parsedData = {};
let mergedData = {};
let filterdData = {};
let currentFileName = {};
let originalParseResult = '';
let originalMergeResult = '';
let selectedMergeOption = 'main-secondary';

// Search navigation state
let parseSearchMatches = [];
let parseCurrentIndex = 0;
let mergeSearchMatches = [];
let mergeCurrentIndex = 0;

// Collapse functionality
function toggleTool(toolName) {
    const content = document.getElementById(toolName + 'Content');
    const indicator = document.getElementById(toolName + 'Indicator');
    const header = indicator.parentElement;

    if (content.classList.contains('active')) {
        content.classList.remove('active');
        indicator.classList.remove('active');
        header.classList.remove('active');
    } else {
        content.classList.add('active');
        indicator.classList.add('active');
        header.classList.add('active');
    }
}

// File reading utility
function readFileContent(file) {
    return new Promise((resolve, reject) => {
        currentFileName = file.name.replace(".txt","");
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file, 'utf-8');
    });
}

// Parse file to dictionary
function parseToDict(content, minLength = 1, splitChar = "/", joinChar = "/") {
    const data = {};
    const lines = content.split('\n');

    lines.forEach(line => {
        line = line.trim();
        if (line.includes('=')) {
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=');

            if (key.length >= minLength) {
                if (data[key]) {
                    const tempValue = data[key] + splitChar + value;
                    const uniqueValues = [...new Set(tempValue.split(splitChar))];
                    data[key] = uniqueValues.join(joinChar);
                } else {
                    const uniqueValues = [...new Set(value.split(splitChar))];
                    data[key] = uniqueValues.join(joinChar);
                }
            }
        }
    });

    return data;
}

// Parse file function
async function parseFile() {
    const fileInput = document.getElementById('parseFile');
    const contentInput = document.getElementById('parseInput');
    const loading = document.getElementById('parseLoading');
    const error = document.getElementById('parseError');
    const success = document.getElementById('parseSuccess');
    const preview = document.getElementById('parsePreview');

    // Hide previous results
    error.style.display = 'none';
    success.style.display = 'none';
    preview.style.display = 'none';
    loading.style.display = 'block';

    try {
        let content = '';

        if (fileInput.files.length > 0) {
            content = await readFileContent(fileInput.files[0]);
        } else if (contentInput.value.trim()) {
            content = contentInput.value.trim();
        } else {
            throw new Error('Vui lòng chọn file hoặc nhập nội dung');
        }

        // Parse content
        parsedData = parseToDict(content);

        // Display results
        displayParseResults(parsedData);

        success.textContent = 'Phân tích file thành công!';
        success.style.display = 'block';
        preview.style.display = 'block';

        gotoResult('parse');
    } catch (err) {
        error.textContent = 'Lỗi: ' + err.message;
        error.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

// Display parse results
function displayParseResults(data) {
    const stats = document.getElementById('parseStats');
    const editArea = document.getElementById('parseEditArea');

    // Calculate statistics
    const totalEntries = Object.keys(data).length;
    const totalMeanings = Object.values(data).reduce((sum, value) =>
        sum + value.split('/').length, 0);
    const avgMeanings = totalEntries > 0 ? (totalMeanings / totalEntries).toFixed(1) : 0;

    // Display statistics
    stats.innerHTML = `
                <div class="stat-card">
                    <div class="stat-number">${totalEntries}</div>
                    <div class="stat-label">Tổng từ khóa</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${totalMeanings}</div>
                    <div class="stat-label">Tổng nghĩa</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${avgMeanings}</div>
                    <div class="stat-label">TB nghĩa/từ</div>
                </div>
            `;

    // Sort and display data
    const sortedData = Object.fromEntries(
        Object.entries(data).sort((a, b) => {
            const aWords = a[0].split(' ').length;
            const bWords = b[0].split(' ').length;
            return aWords !== bWords ? aWords - bWords : a[0].localeCompare(b[0]);
        })
    );

    const outputText = Object.entries(sortedData)
        .map(([key, value], index) => `<span id="parse-line-${index}">${key}=${value}</span>`)
        .join("<br>");

    editArea.innerHTML = outputText;

    originalParseResult = outputText;
}

// Merge option selection
function selectMergeOption(option) {
    document.querySelectorAll('.option-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.getElementById('option-' + option).classList.add('selected');
    selectedMergeOption = option;
}

// Merge files function
async function mergeFiles() {
    const mainFileInput = document.getElementById('mainFile');
    const secondaryFileInput = document.getElementById('secondaryFile');
    const mainContentInput = document.getElementById('mainContent');
    const secondaryContentInput = document.getElementById('secondaryContent');
    const loading = document.getElementById('mergeLoading');
    const error = document.getElementById('mergeError');
    const success = document.getElementById('mergeSuccess');
    const preview = document.getElementById('mergePreview');

    // Hide previous results
    error.style.display = 'none';
    success.style.display = 'none';
    preview.style.display = 'none';
    loading.style.display = 'block';

    try {
        let mainContent = '';
        let secondaryContent = '';

        // Get main file content
        if (mainFileInput.files.length > 0) {
            mainContent = await readFileContent(mainFileInput.files[0]);
        } else if (mainContentInput.value.trim()) {
            mainContent = mainContentInput.value.trim();
        } else {
            throw new Error('Vui lòng chọn file chính hoặc nhập nội dung');
        }

        // Get secondary file content
        if (secondaryFileInput.files.length > 0) {
            secondaryContent = await readFileContent(secondaryFileInput.files[0]);
        } else if (secondaryContentInput.value.trim()) {
            secondaryContent = secondaryContentInput.value.trim();
        } else {
            throw new Error('Vui lòng chọn file phụ hoặc nhập nội dung');
        }

        // Parse both files
        const mainData = parseToDict(mainContent, 1, "/", "/");
        const secondaryData = parseToDict(secondaryContent, 1, "¦", "/");

        // Merge data based on selected option
        mergedData = mergeDataByOption(mainData, secondaryData, selectedMergeOption);

        // Display results
        displayMergeResults(mergedData);

        success.textContent = 'Hợp nhất file thành công!';
        success.style.display = 'block';
        preview.style.display = 'block';

        gotoResult('merge');
    } catch (err) {
        error.textContent = 'Lỗi: ' + err.message;
        error.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

function gotoResult(toolType) {
    document.getElementById(`${toolType}EditArea`).scrollIntoView({
        behavior: 'smooth',
        block: 'start' // Ensure the top of the element aligns with the top of the viewport
    })
}

// Merge data by option
function mergeDataByOption(mainData, secondaryData, option) {
    let result = {};

    // Get all unique keys
    const allKeys = new Set([...Object.keys(mainData), ...Object.keys(secondaryData)]);

    allKeys.forEach(key => {
        const mainValue = mainData[key] || '';
        const secondaryValue = secondaryData[key] || '';

        switch (option) {
            case 'secondary':
                result[key] = secondaryValue || mainValue;
                break;
            case 'secondary-main':
                if (secondaryValue && mainValue) {
                    const combined = secondaryValue + '/' + mainValue;
                    result[key] = [...new Set(combined.split('/'))].join('/');
                } else {
                    result[key] = secondaryValue || mainValue;
                }
                break;
            case 'main':
                result[key] = mainValue || secondaryValue;
                break;
            case 'main-secondary':
            default:
                if (mainValue && secondaryValue) {
                    const combined = mainValue + '/' + secondaryValue;
                    result[key] = [...new Set(combined.split('/'))].join('/');
                } else {
                    result[key] = mainValue || secondaryValue;
                }
                break;
        }
    });

    return result;
}

// Display merge results
function displayMergeResults(data) {
    const stats = document.getElementById('mergeStats');
    const editArea = document.getElementById('mergeEditArea');

    // Calculate statistics
    const totalEntries = Object.keys(data).length;
    const totalMeanings = Object.values(data).reduce((sum, value) =>
        sum + value.split('/').length, 0);
    const avgMeanings = totalEntries > 0 ? (totalMeanings / totalEntries).toFixed(1) : 0;

    // Display statistics
    stats.innerHTML = `
                <div class="stat-card">
                    <div class="stat-number">${totalEntries}</div>
                    <div class="stat-label">Tổng từ khóa</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${totalMeanings}</div>
                    <div class="stat-label">Tổng nghĩa</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${avgMeanings}</div>
                    <div class="stat-label">TB nghĩa/từ</div>
                </div>
            `;

    // Sort and display data
    const sortedData = Object.fromEntries(
        Object.entries(data).sort((a, b) => {
            const aWords = a[0].split(' ').length;
            const bWords = b[0].split(' ').length;
            return aWords !== bWords ? aWords - bWords : a[0].localeCompare(b[0]);
        })
    );

    const outputText = Object.entries(sortedData)
        .map(([key, value], index) => `<span id="merge-line-${index}">${key}=${value}</span>`)
        .join("<br>");

    editArea.innerHTML = outputText;
    originalMergeResult = outputText;

    // Highlight merged parts
    highlightMergedContent(editArea);
}

// Highlight merged content
function highlightMergedContent(textarea) {
    // This will be handled via CSS and manual detection of changes
    textarea.addEventListener('input', function () {
        detectChanges(this, originalMergeResult);
    });
}

// Detect changes and highlight
function detectChanges(textarea, original) {
    const current = textarea.value;
    const originalLines = original.split('\n');
    const currentLines = current.split('\n');

    // Simple change detection - you could enhance this
    let hasChanges = false;
    for (let i = 0; i < Math.max(originalLines.length, currentLines.length); i++) {
        if (originalLines[i] !== currentLines[i]) {
            hasChanges = true;
            break;
        }
    }

    if (hasChanges) {
        textarea.style.borderColor = '#fdcb6e';
        textarea.style.borderWidth = '3px';
    } else {
        textarea.style.borderColor = '#e0e0e0';
        textarea.style.borderWidth = '2px';
    }
}

// Search functions
function searchInParse() {
    const keyInput = document.getElementById('parseSearchKey');
    const meaningInput = document.getElementById('parseSearchMeaning');
    const lineInput = document.getElementById('parseSearchLine');
    const resultsDiv = document.getElementById('parseSearchResults');
    const editArea = document.getElementById('parseEditArea');

    parseSearchMatches = performSearch(keyInput.value, meaningInput.value, lineInput.value, editArea.innerText, resultsDiv, 'parse');
    parseCurrentIndex = 0;

    if (parseSearchMatches.length > 0) {
        showNavigateButton('parse', true);
        navigateToResult('parse', 0);
    } else {
        showNavigateButton('parse', false);
    }
}

function showNavigateButton(toolType, isShow) {
    if (isShow) {
        document.getElementById(`${toolType}PrevBtn`).style.display = "block";
        document.getElementById(`${toolType}NextBtn`).style.display = "block";
    } else {
        document.getElementById(`${toolType}PrevBtn`).style.display = "none";
        document.getElementById(`${toolType}NextBtn`).style.display = "none";
    }
}

function searchInMerge() {
    const keyInput = document.getElementById('mergeSearchKey');
    const meaningInput = document.getElementById('mergeSearchMeaning');
    const lineInput = document.getElementById('mergeSearchLine');
    const resultsDiv = document.getElementById('mergeSearchResults');
    const editArea = document.getElementById('mergeEditArea');

    mergeSearchMatches = performSearch(keyInput.value, meaningInput.value, lineInput.value, editArea.innerText, resultsDiv, 'merge');
    mergeCurrentIndex = 0;

    if (mergeSearchMatches.length > 0) {
        showNavigateButton('merge', true);
        navigateToResult('merge', 0);
    } else {
        showNavigateButton('merge', false);
    }
}

function navigateResult(toolType, direction) {
    const matches = toolType === 'parse' ? parseSearchMatches : mergeSearchMatches;
    let currentIndex = toolType === 'parse' ? parseCurrentIndex : mergeCurrentIndex;

    if (matches.length === 0) return;

    if (direction === 'next') {
        currentIndex = (currentIndex + 1) % matches.length;
    } else if (direction === 'prev') {
        currentIndex = (currentIndex - 1 + matches.length) % matches.length;
    }

    if (toolType === 'parse') {
        parseCurrentIndex = currentIndex;
    } else {
        mergeCurrentIndex = currentIndex;
    }

    navigateToResult(toolType, currentIndex);
}

function navigateToResult(toolType, index) {
    const matches = toolType === 'parse' ? parseSearchMatches : mergeSearchMatches;
    const editArea = document.getElementById(toolType + 'EditArea');
    const resultsDiv = document.getElementById(toolType + 'SearchResults');

    if (matches.length === 0 || index >= matches.length) return;

    const match = matches[index];
    console.log(match)
    const lines = editArea.innerHTML.split('\n');

    const targetElement = document.getElementById(`${toolType}-line-${match.line - 1}`);
    targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center' // Ensure the top of the element aligns with the top of the viewport
    });

    highlightElement(targetElement, toolType);

    updateSearchResultsDisplay(toolType, matches, index);
}

function highlightElement(el, toolType) {
    if (!el) return;
    const elements = document.querySelectorAll(`[id^="${toolType}-line-"]`);
    elements.forEach(elm => elm.classList.remove("highlight"));
    el.classList.add("highlight")
}

function updateSearchResultsDisplay(toolType, matches, currentIndex) {
    const resultsDiv = document.getElementById(toolType + 'SearchResults');
    const keyInput = document.getElementById(toolType + 'SearchKey');
    const meaningInput = document.getElementById(toolType + 'SearchMeaning');

    let resultsHtml = `
                <div class="navigation-info">
                    Kết quả ${currentIndex + 1} / ${matches.length}
                </div>
                <strong>🔍 Tìm thấy ${matches.length} kết quả:</strong><br>`;

    resultsDiv.innerHTML = resultsHtml;
    resultsDiv.style.display = 'block';
}

function performSearch(keyTerm, meaningTerm, lineNumber, content, resultsDiv, toolType) {
    if (!keyTerm && !meaningTerm && !lineNumber) {
        resultsDiv.style.display = 'none';
        return [];
    }

    const lines = content.split('\n');
    let matches = [];

    // Search by line number
    if (lineNumber) {
        const lineIndex = parseInt(lineNumber) - 1;
        if (lineIndex >= 0 && lineIndex < lines.length) {
            matches.push({
                line: lineIndex + 1,
                content: lines[lineIndex],
                type: 'line'
            });
        }
    }

    // Search by content if no specific line number or if line number doesn't match
    if (!lineNumber || matches.length === 0) {
        lines.forEach((line, index) => {
            if (line.includes('=')) {
                const [key, value] = line.split('=', 2);
                let match = false;
                let matchType = [];

                if (keyTerm && key.toLowerCase().includes(keyTerm.toLowerCase())) {
                    match = true;
                    matchType.push('key');
                }

                if (meaningTerm && value.toLowerCase().includes(meaningTerm.toLowerCase())) {
                    match = true;
                    matchType.push('meaning');
                }

                if (match) {
                    matches.push({
                        line: index + 1,
                        content: line,
                        type: matchType.join('+')
                    });
                }
            }
        });
    }

    if (matches.length > 0) {
        return matches;
    } else {
        let searchInfo = [];
        if (keyTerm) searchInfo.push(`từ khóa "${keyTerm}"`);
        if (meaningTerm) searchInfo.push(`nghĩa "${meaningTerm}"`);
        if (lineNumber) searchInfo.push(`dòng ${lineNumber}`);

        resultsDiv.innerHTML = `<strong>❌ Không tìm thấy kết quả nào cho ${searchInfo.join(', ')}</strong>`;
        resultsDiv.style.display = 'block';
        return [];
    }
}

// Go to specific line
function goToLine(toolType) {
    const lineInput = document.getElementById(toolType + 'SearchLine');
    const editArea = document.getElementById(toolType + 'EditArea');

    const lineNumber = parseInt(lineInput.value);
    if (!lineNumber || lineNumber < 1) {
        alert('Vui lòng nhập số dòng hợp lệ');
        return;
    }

    const lines = editArea.value.split('\n');
    if (lineNumber > lines.length) {
        alert(`Dòng ${lineNumber} không tồn tại. Tổng cộng có ${lines.length} dòng.`);
        return;
    }

    // Calculate position to scroll to
    const lineHeight = 22; // Approximate line height
    const targetPosition = (lineNumber - 1) * lineHeight;

    // Focus and scroll to line
    editArea.focus();
    editArea.scrollTop = Math.max(0, targetPosition - editArea.clientHeight / 2);

    // Select the entire line
    const startPos = lines.slice(0, lineNumber - 1).join('\n').length + (lineNumber > 1 ? 1 : 0);
    const endPos = startPos + lines[lineNumber - 1].length;

    editArea.setSelectionRange(startPos, endPos);

    // Show success message
    const resultsDiv = document.getElementById(toolType + 'SearchResults');
    resultsDiv.innerHTML = `<strong>✅ Đã chuyển đến dòng ${lineNumber}</strong><br>
                <div style="margin: 5px 0; padding: 8px; background: white; border-radius: 5px; border-left: 4px solid #00b894;">
                    <strong>📍 Dòng ${lineNumber}:</strong> ${lines[lineNumber - 1] || '(dòng trống)'}
                </div>`;
    resultsDiv.style.display = 'block';
}

function highlightSearchTerms(text, keyTerm, meaningTerm) {
    let result = text;

    if (keyTerm) {
        const regex = new RegExp(`(${keyTerm})`, 'gi');
        result = result.replace(regex, '<span class="search-highlight">$1</span>');
    }

    if (meaningTerm) {
        const regex = new RegExp(`(${meaningTerm})`, 'gi');
        result = result.replace(regex, '<span class="search-highlight">$1</span>');
    }

    return result;
}

function showWaitLayer() {
    document.getElementById("waitLayer").style.display = "flex";
}

function hideWaitLayer() {
    document.getElementById("waitLayer").style.display = "none";
}

// Download functions
function downloadParseResult() {
    showWaitLayer();
    const content = document.getElementById('parseEditArea').innerText;
    if (!content.trim()) {
        alert('Không có dữ liệu để tải xuống');
        hideWaitLayer();
        return;
    }
    downloadFile(content);
    hideWaitLayer();
}

// Download functions
function downloadfilterResult() {
    showWaitLayer();
    const content = document.getElementById('filterEditArea').innerText;
    if (!content.trim()) {
        alert('Không có dữ liệu để tải xuống');
        hideWaitLayer();
        return;
    }
    downloadFile(content);
    hideWaitLayer();
}

function getNowFormatted() {
    const now = new Date();

    const yyyy = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    return `${yyyy}${MM}${dd}${hh}${mm}${ss}`;
}

function downloadMergeResult() {
    showWaitLayer();
    const content = document.getElementById('mergeEditArea').innerText;
    if (!content.trim()) {
        alert('Không có dữ liệu để tải xuống');
        hideWaitLayer();
        return;
    }
    downloadFile(content);
    hideWaitLayer();
}

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentFileName}_${getNowFormatted()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Reset functions
function resetParseEdit() {
    document.getElementById('parseEditArea').value = originalParseResult;
}

function resetMergeEdit() {
    const editArea = document.getElementById('mergeEditArea');
    editArea.innerText = originalMergeResult;
    editArea.style.borderColor = '#e0e0e0';
    editArea.style.borderWidth = '2px';
}

// Clear functions
function clearParseResult() {
    document.getElementById('parseFile').value = '';
    document.getElementById('parseInput').value = '';
    document.getElementById('parsePreview').style.display = 'none';
    document.getElementById('parseError').style.display = 'none';
    document.getElementById('parseSuccess').style.display = 'none';
    document.getElementById('parseSearchKey').value = '';
    document.getElementById('parseSearchMeaning').value = '';
    document.getElementById('parseSearchLine').value = '';
    document.getElementById('parseSearchResults').style.display = 'none';
    parsedData = {};
    originalParseResult = '';
}

function clearMergeResult() {
    document.getElementById('mainFile').value = '';
    document.getElementById('secondaryFile').value = '';
    document.getElementById('mainContent').value = '';
    document.getElementById('secondaryContent').value = '';
    document.getElementById('mergePreview').style.display = 'none';
    document.getElementById('mergeError').style.display = 'none';
    document.getElementById('mergeSuccess').style.display = 'none';
    document.getElementById('mergeSearchKey').value = '';
    document.getElementById('mergeSearchMeaning').value = '';
    document.getElementById('mergeSearchLine').value = '';
    document.getElementById('mergeSearchResults').style.display = 'none';
    mergedData = {};
    originalMergeResult = '';
}

// Parse file function
async function filterFile() {
    const fileInput = document.getElementById('filterFile');
    const contentInput = document.getElementById('filterInput');
    const loading = document.getElementById('filterLoading');
    const error = document.getElementById('filterError');
    const success = document.getElementById('filterSuccess');
    const preview = document.getElementById('filterPreview');

    // Hide previous results
    error.style.display = 'none';
    success.style.display = 'none';
    preview.style.display = 'none';
    loading.style.display = 'block';

    try {
        let content = '';

        if (fileInput.files.length > 0) {
            content = await readFileContent(fileInput.files[0]);
        } else if (contentInput.value.trim()) {
            content = contentInput.value.trim();
        } else {
            throw new Error('Vui lòng chọn file hoặc nhập nội dung');
        }

        // filter content
        filterdData = filterToDict(content);

        // Display results
        displayfilterResults(filterdData);

        success.textContent = 'Phân tích file thành công!';
        success.style.display = 'block';
        preview.style.display = 'block';

        gotoResult('filter');
    } catch (err) {
        error.textContent = 'Lỗi: ' + err.message;
        error.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

function filterToDict(content, minLength = 1, splitChar = "/", joinChar = "/") {
    const data = {};
    const lines = content.split('\n');

    lines.forEach(line => {
        line = line.trim();
        if (line.includes('=')) {
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=');
            const firstValue = value.split("/")[0];


            if (key.length >= minLength && isTitleCase(firstValue) && !hasNumberOrSpecial(firstValue)) {
                if (data[key]) {
                    const tempValue = data[key] + splitChar + value;
                    const uniqueValues = [...new Set(tempValue.split(splitChar))];
                    data[key] = uniqueValues.join(joinChar);
                } else {
                    const uniqueValues = [...new Set(value.split(splitChar))];
                    data[key] = uniqueValues.join(joinChar);
                }
            }
        }
    });

    return data;
}

function isTitleCase(str) {
    // Split the string into words
    const words = str.split(' ');

    // Check each word
    return words.every(word => {
        if (!word) return true; // skip empty strings
        return word[0] === word[0].toUpperCase() &&
            word.slice(1) === word.slice(1).toLowerCase();
    });
}

function hasNumberOrSpecial(str) {
    return /[^\p{L}\s]/u.test(str);
}

// Display filter results
function displayfilterResults(data) {
    const stats = document.getElementById('filterStats');
    const editArea = document.getElementById('filterEditArea');

    // Calculate statistics
    const totalEntries = Object.keys(data).length;
    const totalMeanings = Object.values(data).reduce((sum, value) =>
        sum + value.split('/').length, 0);
    const avgMeanings = totalEntries > 0 ? (totalMeanings / totalEntries).toFixed(1) : 0;

    // Display statistics
    stats.innerHTML = `
                <div class="stat-card">
                    <div class="stat-number">${totalEntries}</div>
                    <div class="stat-label">Tổng từ khóa</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${totalMeanings}</div>
                    <div class="stat-label">Tổng nghĩa</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${avgMeanings}</div>
                    <div class="stat-label">TB nghĩa/từ</div>
                </div>
            `;

    // Sort and display data
    const sortedData = Object.fromEntries(
        Object.entries(data).sort((a, b) => {
            const aWords = a[0].split(' ').length;
            const bWords = b[0].split(' ').length;
            return aWords !== bWords ? aWords - bWords : a[0].localeCompare(b[0]);
        })
    );

    const outputText = Object.entries(sortedData)
        .map(([key, value], index) => `<span id="filter-line-${index}">${key}=${value}</span>`)
        .join("<br>");

    editArea.innerHTML = outputText;

    originalParseResult = outputText;
}

// Add real-time search
document.addEventListener('DOMContentLoaded', function () {
    // Initialize with first tool open
    toggleTool('parse');

    // File input change handlers
    document.getElementById('parseFile').addEventListener('change', function () {
        if (this.files.length > 0) {
            document.getElementById('parseInput').value = '';
        }
    });

    document.getElementById('mainFile').addEventListener('change', function () {
        if (this.files.length > 0) {
            document.getElementById('mainContent').value = '';
        }
    });

    document.getElementById('secondaryFile').addEventListener('change', function () {
        if (this.files.length > 0) {
            document.getElementById('secondaryContent').value = '';
        }
    });
    // Parse search
    document.getElementById('parseSearchKey').addEventListener('input', function () {
        if (this.value.length >= 2 || document.getElementById('parseSearchMeaning').value.length >= 2) {
            searchInParse();
        } else if (!this.value && !document.getElementById('parseSearchMeaning').value) {
            document.getElementById('parseSearchResults').style.display = 'none';
        }
    });

    document.getElementById('parseSearchMeaning').addEventListener('input', function () {
        if (this.value.length >= 2 || document.getElementById('parseSearchKey').value.length >= 2) {
            searchInParse();
        } else if (!this.value && !document.getElementById('parseSearchKey').value) {
            document.getElementById('parseSearchResults').style.display = 'none';
        }
    });

    // Parse line search on Enter
    document.getElementById('parseSearchLine').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            goToLine('parse');
        }
    });

    // Merge search
    document.getElementById('mergeSearchKey').addEventListener('input', function () {
        if (this.value.length >= 2 || document.getElementById('mergeSearchMeaning').value.length >= 2) {
            searchInMerge();
        } else if (!this.value && !document.getElementById('mergeSearchMeaning').value) {
            document.getElementById('mergeSearchResults').style.display = 'none';
        }
    });

    document.getElementById('mergeSearchMeaning').addEventListener('input', function () {
        if (this.value.length >= 2 || document.getElementById('mergeSearchKey').value.length >= 2) {
            searchInMerge();
        } else if (!this.value && !document.getElementById('mergeSearchKey').value) {
            document.getElementById('mergeSearchResults').style.display = 'none';
        }
    });

    // Merge line search on Enter
    document.getElementById('mergeSearchLine').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            goToLine('merge');
        }
    });
});