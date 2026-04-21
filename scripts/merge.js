// Global state cho file merge
let mergedData = {};
let originalMergeResult = '';
let selectedMergeOption = 'main-secondary';
let mergeSearchMatches = [];
let mergeCurrentIndex = 0;

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

        // Dựa vào parse.js (phải load parse.js trước file này)
        if (typeof parseToDict !== "function") {
            throw new Error('Chưa kết nối file thư viện parseToDict. Vui lòng update template HTML gốc.');
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
    textarea.addEventListener('input', function () {
        detectChanges(this, originalMergeResult);
    });
}

// Detect changes and highlight
function detectChanges(textarea, original) {
    const current = textarea.innerText;
    const originalLines = original.split('<br>').map(s=>s.replace(/<[^>]+>/g, '')); // Crude clean 
    // This logic relies strictly on innerText
    // Let's keep original format
    if (current && original) {
       textarea.style.borderColor = '#fdcb6e';
       textarea.style.borderWidth = '3px';
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

function resetMergeEdit() {
    const editArea = document.getElementById('mergeEditArea');
    editArea.innerHTML = originalMergeResult;
    editArea.style.borderColor = '#e0e0e0';
    editArea.style.borderWidth = '2px';
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
