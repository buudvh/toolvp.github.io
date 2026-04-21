// Global state cho file filter
let filterdData = {};
let filterdOriginalData = {};
let invalidLinesInfo = [];
let filterSearchMatches = [];
let filterCurrentIndex = 0;
let originalFilterResult = '';

async function filterFile() {
    const fileInput = document.getElementById('filterFile');
    const contentInput = document.getElementById('filterInput');
    const loading = document.getElementById('filterLoading');
    const error = document.getElementById('filterError');
    const success = document.getElementById('filterSuccess');
    const preview = document.getElementById('filterPreview');
    const invalidSection = document.getElementById('filterInvalidSection');

    // Hide previous results
    error.style.display = 'none';
    success.style.display = 'none';
    preview.style.display = 'none';
    if(invalidSection) invalidSection.style.display = 'none';
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
        const cbEmptyRhs = document.getElementById('filterEmptyRhs');
        const filterEmptyRhs = cbEmptyRhs ? cbEmptyRhs.checked : true;
        const result = filterToDict(content, 1, "/", "/", filterEmptyRhs);
        filterdData = result.validData;
        filterdOriginalData = result.originalData;
        invalidLinesInfo = result.invalidLines;

        // Display results
        displayfilterResults(filterdData);
        displayInvalidLines(invalidLinesInfo);

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

function filterToDict(content, minLength = 1, splitChar = "/", joinChar = "/", filterEmptyRhs = true) {
    const validData = {};
    const originalData = {};
    const invalidLines = [];
    
    // Parse từng dòng dữ liệu
    const lines = content.split(/\r?\n/);

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        
        const parts = trimmed.split('=');
        if (parts.length < 2) {
            invalidLines.push({ line: trimmed, reason: 'Không đúng format $中文=Tiếng Việt' });
            return;
        }

        const key = parts[0].trim();
        const valueSnippet = parts.slice(1).join('=').trim();
        
        // Data nguyên sẽ cộng hết 100% data vào dưới dạng filter trùng lặp dictionary như các Tool khác
        if (key.length >= minLength) {
            if (originalData[key]) {
                const uniqueValues = [...new Set((originalData[key] + splitChar + valueSnippet).split(splitChar))];
                originalData[key] = uniqueValues.join(joinChar);
            } else {
                originalData[key] = [...new Set(valueSnippet.split(splitChar))].join(joinChar);
            }
        }

        // Điều kiện 0: Loại bỏ nếu vế nghĩa rỗng (khi option được kích hoạt)
        if (filterEmptyRhs && (!valueSnippet || valueSnippet === '')) {
            invalidLines.push({
                line: trimmed,
                reason: `Vế nghĩa Tiếng Việt bị bỏ trống`
            });
            return;
        }

        // Đếm số ký tự tiếng Trung
        const chineseChars = key.split('').filter(char => isChineseWord(char));
        const chineseCharCount = chineseChars.length;

        // Điều kiện 1: Loại bỏ name chỉ có 1 ký tự tiếng Trung
        if (chineseCharCount === 1) {
            invalidLines.push({
                line: trimmed,
                reason: `Chỉ có 1 ký tự tiếng Trung: "${key}"`
            });
            return;
        }

        // Điều kiện 2: Loại bỏ name không có từ tiếng Việt nào viết hoa ở cụm nghĩa
        if (!hasAtLeastOneCapitalizedWord(valueSnippet)) {
            invalidLines.push({
                line: trimmed,
                reason: `Không có từ tiếng Việt nào viết hoa ở vế nghĩa: "${valueSnippet}"`
            });
            return;
        }
        
        // Pass validation -> Push logic vào valid data (Merge format)
        if (key.length >= minLength) {
            if (validData[key]) {
                 const uniqueValues = [...new Set((validData[key] + splitChar + valueSnippet).split(splitChar))];
                 validData[key] = uniqueValues.join(joinChar);
            } else {
                 validData[key] = [...new Set(valueSnippet.split(splitChar))].join(joinChar);
            }
        }
    });

    return { validData, originalData, invalidLines };
}

function isChineseWord(char) {
    // Check regex char falls in Unicode range of CJK characters
    return /^[\u4e00-\u9fa5]$/.test(char);
}

function hasAtLeastOneCapitalizedWord(str) {
    // Check if there is at least one word starting with a capital letter
    const words = str.split(/[\s/]+/); // Tách bởi space hay dấu ngoặc chéo
    return words.some(word => word.length > 0 && word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase());
}

// Display filter results
function displayfilterResults(data) {
    const stats = document.getElementById('filterStats');
    const editArea = document.getElementById('filterEditArea');

    // Calculate statistics
    const totalEntries = Object.keys(data).length;
    const originalEntries = Object.keys(filterdOriginalData).length;
    const discardedEntries = originalEntries - totalEntries;

    // Display statistics
    stats.innerHTML = `
                <div class="stat-card">
                    <div class="stat-number">${originalEntries}</div>
                    <div class="stat-label">Số từ tổng</div>
                </div>
                <div class="stat-card" style="border: 1px solid #00b894; background: #fcfcfc;">
                    <div class="stat-number" style="color: #00b894;">${totalEntries}</div>
                    <div class="stat-label">Số từ đã lọc (Hợp lệ)</div>
                </div>
                <div class="stat-card" style="border: 1px solid #ff7675; background: #fff5f5; cursor: pointer;" onclick="openFilterModal()" title="Nhấn để xem chi tiết">
                    <div class="stat-number" style="color: #d63031;">${discardedEntries}</div>
                    <div class="stat-label">Từ bị loại (Xem)</div>
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
    originalFilterResult = outputText;
}

function displayInvalidLines(invalidArr) {
    const overlay = document.getElementById('filterModalOverlay');
    if(!overlay) return; // Bảo vệ khi load thiếu DOM

    const countEl = document.getElementById('filterInvalidCount');
    const listEl = document.getElementById('filterInvalidList');

    if (!invalidArr || invalidArr.length === 0) {
        return;
    }

    countEl.textContent = invalidArr.length;
    // Map data to UI HTML
    let listHTML = invalidArr.map(item => `<div><strong>🛑</strong> <code style="background:none;">${item.line}</code> <br> <span style="margin-left: 20px; color: #c62828;">➤ Lỗi: ${item.reason}</span></div>`).join('<hr style="margin:10px 0; border:0; border-top:1px dashed #ffcdd2;">');
    
    listEl.innerHTML = listHTML;
    
    // Auto Show
    openFilterModal();
}

function openFilterModal() {
    const overlay = document.getElementById('filterModalOverlay');
    if(overlay && invalidLinesInfo && invalidLinesInfo.length > 0) {
        overlay.style.display = 'flex';
    } else {
        alert('Dữ liệu hoàn hảo, không có Name nào bị loại bỏ!');
    }
}

function closeFilterModal() {
    const overlay = document.getElementById('filterModalOverlay');
    if(overlay) overlay.style.display = 'none';
}

function searchInfilter() {
    const keyInput = document.getElementById('filterSearchKey');
    const meaningInput = document.getElementById('filterSearchMeaning');
    const lineInput = document.getElementById('filterSearchLine');
    const resultsDiv = document.getElementById('filterSearchResults');
    const editArea = document.getElementById('filterEditArea');

    // Mượn global var bên common.js:
    filterSearchMatches = performSearch(keyInput.value, meaningInput.value, lineInput.value, editArea.innerText, resultsDiv, 'filter');
    filterCurrentIndex = 0;

    if (filterSearchMatches.length > 0) {
        showNavigateButton('filter', true);
        navigateToResult('filter', 0);
    } else {
        showNavigateButton('filter', false);
    }
}

function downloadfilterResult() {
    showWaitLayer();
    const content = document.getElementById('filterEditArea').innerText;
    if (!content.trim()) {
        alert('Không có dữ liệu hợp lệ để tải xuống');
        hideWaitLayer();
        return;
    }
    // downloadFile từ common (có suffix Clean_Data)
    downloadFile(content, `${currentFileName}_Filtered_${getNowFormatted()}.txt`);
    hideWaitLayer();
}

function downloadOriginalfilterResult() {
    showWaitLayer();
    // Tạo content text từ object data gốc
    if (Object.keys(filterdOriginalData).length === 0) {
        alert('Không có dữ liệu gốc để tải xuống');
        hideWaitLayer();
        return;
    }
    const outputText = Object.entries(filterdOriginalData)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");
        
    downloadFile(outputText, `${currentFileName}_Original_${getNowFormatted()}.txt`);
    hideWaitLayer();
}

function resetfilterEdit() {
    document.getElementById('filterEditArea').innerHTML = originalFilterResult;
}

function clearfilterResult() {
    document.getElementById('filterFile').value = '';
    document.getElementById('filterInput').value = '';
    document.getElementById('filterPreview').style.display = 'none';
    document.getElementById('filterError').style.display = 'none';
    document.getElementById('filterSuccess').style.display = 'none';
    if(document.getElementById('filterModalOverlay')) document.getElementById('filterModalOverlay').style.display = 'none';
    
    document.getElementById('filterSearchKey').value = '';
    document.getElementById('filterSearchMeaning').value = '';
    document.getElementById('filterSearchLine').value = '';
    document.getElementById('filterSearchResults').style.display = 'none';
    
    filterdData = {};
    filterdOriginalData = {};
    invalidLinesInfo = [];
    originalFilterResult = '';
}
