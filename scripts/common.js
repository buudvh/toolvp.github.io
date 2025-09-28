// Global variables
let parsedData = {};
let mergedData = {};
let originalParseResult = '';
let originalMergeResult = '';
let selectedMergeOption = 'main-secondary';

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
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    editArea.value = outputText;
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

    } catch (err) {
        error.textContent = 'Lỗi: ' + err.message;
        error.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
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
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    editArea.value = outputText;
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
    const resultsDiv = document.getElementById('parseSearchResults');
    const editArea = document.getElementById('parseEditArea');

    performSearch(keyInput.value, meaningInput.value, editArea.value, resultsDiv);
}

function searchInMerge() {
    const keyInput = document.getElementById('mergeSearchKey');
    const meaningInput = document.getElementById('mergeSearchMeaning');
    const resultsDiv = document.getElementById('mergeSearchResults');
    const editArea = document.getElementById('mergeEditArea');

    performSearch(keyInput.value, meaningInput.value, editArea.value, resultsDiv);
}

function performSearch(keyTerm, meaningTerm, content, resultsDiv) {
    if (!keyTerm && !meaningTerm) {
        resultsDiv.style.display = 'none';
        return;
    }

    const lines = content.split('\n');
    let matches = [];

    lines.forEach((line, index) => {
        if (line.includes('=')) {
            const [key, value] = line.split('=', 2);
            let match = false;

            if (keyTerm && key.toLowerCase().includes(keyTerm.toLowerCase())) {
                match = true;
            }

            if (meaningTerm && value.toLowerCase().includes(meaningTerm.toLowerCase())) {
                match = true;
            }

            if (match) {
                matches.push({ line: index + 1, content: line });
            }
        }
    });

    if (matches.length > 0) {
        resultsDiv.innerHTML = `
                    <strong>🔍 Tìm thấy ${matches.length} kết quả:</strong><br>
                    ${matches.slice(0, 10).map(match =>
            `<div style="margin: 5px 0; padding: 5px; background: white; border-radius: 5px;">
                            <strong>Dòng ${match.line}:</strong> ${highlightSearchTerms(match.content, keyTerm, meaningTerm)}
                        </div>`
        ).join('')}
                    ${matches.length > 10 ? '<div style="color: #666; font-style: italic;">... và ' + (matches.length - 10) + ' kết quả khác</div>' : ''}
                `;
        resultsDiv.style.display = 'block';
    } else {
        resultsDiv.innerHTML = '<strong>❌ Không tìm thấy kết quả nào</strong>';
        resultsDiv.style.display = 'block';
    }
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

// Download functions
function downloadParseResult() {
    const content = document.getElementById('parseEditArea').value;
    if (!content.trim()) {
        alert('Không có dữ liệu để tải xuống');
        return;
    }
    downloadFile(content, 'viet_phrase_parsed.txt');
}

function downloadMergeResult() {
    const content = document.getElementById('mergeEditArea').value;
    if (!content.trim()) {
        alert('Không có dữ liệu để tải xuống');
        return;
    }
    downloadFile(content, 'viet_phrase_merged.txt');
}

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
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
    editArea.value = originalMergeResult;
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
    document.getElementById('mergeSearchResults').style.display = 'none';
    mergedData = {};
    originalMergeResult = '';
}

document.addEventListener("DOMContentLoaded", function () {
    addEvent
});

function addEvent() {
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

    // Initialize with first tool open
    document.addEventListener('DOMContentLoaded', function () {
        toggleTool('parse');
    });

    // Add real-time search
    document.addEventListener('DOMContentLoaded', function () {
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
    });
}