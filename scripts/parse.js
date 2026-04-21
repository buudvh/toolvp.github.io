// Global state cho file parse
let parsedData = {};
let originalParseResult = '';
let parseSearchMatches = [];
let parseCurrentIndex = 0;

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

// Search functions for parse
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

function resetParseEdit() {
    document.getElementById('parseEditArea').innerHTML = originalParseResult;
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
