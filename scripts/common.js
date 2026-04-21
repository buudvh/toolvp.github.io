// Global variables dùng chung
let currentFileName = '';

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
        currentFileName = file.name.replace(".txt", "");
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file, 'utf-8');
    });
}

function gotoResult(toolType) {
    document.getElementById(`${toolType}EditArea`).scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
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

function navigateResult(toolType, direction) {
    let matches;
    let currentIndex;

    if (toolType === 'parse') {
        matches = parseSearchMatches;
        currentIndex = parseCurrentIndex;
    } else if (toolType === 'merge') {
        matches = mergeSearchMatches;
        currentIndex = mergeCurrentIndex;
    } else if (toolType === 'filter') {
        matches = filterSearchMatches;
        currentIndex = filterCurrentIndex;
    }

    if (!matches || matches.length === 0) return;

    if (direction === 'next') {
        currentIndex = (currentIndex + 1) % matches.length;
    } else if (direction === 'prev') {
        currentIndex = (currentIndex - 1 + matches.length) % matches.length;
    }

    if (toolType === 'parse') {
        parseCurrentIndex = currentIndex;
    } else if (toolType === 'merge') {
        mergeCurrentIndex = currentIndex;
    } else if (toolType === 'filter') {
        filterCurrentIndex = currentIndex;
    }

    navigateToResult(toolType, currentIndex);
}

function navigateToResult(toolType, index) {
    let matches;
    if (toolType === 'parse') {
        matches = parseSearchMatches;
    } else if (toolType === 'merge') {
        matches = mergeSearchMatches;
    } else if (toolType === 'filter') {
        matches = filterSearchMatches;
    }

    const editArea = document.getElementById(toolType + 'EditArea');
    const resultsDiv = document.getElementById(toolType + 'SearchResults');

    if (!matches || matches.length === 0 || index >= matches.length) return;

    const match = matches[index];
    const targetElement = document.getElementById(`${toolType}-line-${match.line - 1}`);
    targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });

    highlightElement(targetElement, toolType);
    updateSearchResultsDisplay(toolType, matches, index);
}

function highlightElement(el, toolType) {
    if (!el) return;
    const elements = document.querySelectorAll(`[id^="${toolType}-line-"]`);
    elements.forEach(elm => elm.classList.remove("highlight"));
    el.classList.add("highlight");
}

function updateSearchResultsDisplay(toolType, matches, currentIndex) {
    const resultsDiv = document.getElementById(toolType + 'SearchResults');

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

    const lines = editArea.innerText.split('\n');
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

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename ? filename : `${currentFileName}_${getNowFormatted()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Global DOM Content Loaded Listener
document.addEventListener('DOMContentLoaded', function () {
    // Initialize with first tool open
    toggleTool('filter');

    // File input change handlers
    document.getElementById('parseFile')?.addEventListener('change', function () {
        if (this.files.length > 0) {
            document.getElementById('parseInput').value = '';
        }
    });

    document.getElementById('mainFile')?.addEventListener('change', function () {
        if (this.files.length > 0) {
            document.getElementById('mainContent').value = '';
        }
    });

    document.getElementById('secondaryFile')?.addEventListener('change', function () {
        if (this.files.length > 0) {
            document.getElementById('secondaryContent').value = '';
        }
    });

    document.getElementById('filterFile')?.addEventListener('change', function () {
        if (this.files.length > 0) {
            document.getElementById('filterInput').value = '';
        }
    });

    // Parse Search Events
    const parseSearchKey = document.getElementById('parseSearchKey');
    const parseSearchMeaning = document.getElementById('parseSearchMeaning');
    if (parseSearchKey) {
        parseSearchKey.addEventListener('input', function () {
            if (this.value.length >= 2 || parseSearchMeaning.value.length >= 2) {
                if (typeof searchInParse === "function") searchInParse();
            } else if (!this.value && !parseSearchMeaning.value) {
                document.getElementById('parseSearchResults').style.display = 'none';
            }
        });
    }
    if (parseSearchMeaning) {
        parseSearchMeaning.addEventListener('input', function () {
            if (this.value.length >= 2 || parseSearchKey.value.length >= 2) {
                if (typeof searchInParse === "function") searchInParse();
            } else if (!this.value && !parseSearchKey.value) {
                document.getElementById('parseSearchResults').style.display = 'none';
            }
        });
    }
    document.getElementById('parseSearchLine')?.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') goToLine('parse');
    });

    // Merge Search Events
    const mergeSearchKey = document.getElementById('mergeSearchKey');
    const mergeSearchMeaning = document.getElementById('mergeSearchMeaning');
    if (mergeSearchKey) {
        mergeSearchKey.addEventListener('input', function () {
            if (this.value.length >= 2 || mergeSearchMeaning.value.length >= 2) {
                if (typeof searchInMerge === "function") searchInMerge();
            } else if (!this.value && !mergeSearchMeaning.value) {
                document.getElementById('mergeSearchResults').style.display = 'none';
            }
        });
    }
    if (mergeSearchMeaning) {
        mergeSearchMeaning.addEventListener('input', function () {
            if (this.value.length >= 2 || mergeSearchKey.value.length >= 2) {
                if (typeof searchInMerge === "function") searchInMerge();
            } else if (!this.value && !mergeSearchKey.value) {
                document.getElementById('mergeSearchResults').style.display = 'none';
            }
        });
    }
    document.getElementById('mergeSearchLine')?.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') goToLine('merge');
    });

    // Filter Search Events (if exist in DOM)
    const filterSearchKey = document.getElementById('filterSearchKey');
    const filterSearchMeaning = document.getElementById('filterSearchMeaning');
    if (filterSearchKey) {
        filterSearchKey.addEventListener('input', function () {
            if (this.value.length >= 2 || filterSearchMeaning.value.length >= 2) {
                if (typeof searchInfilter === "function") searchInfilter();
            } else if (!this.value && !filterSearchMeaning.value) {
                document.getElementById('filterSearchResults').style.display = 'none';
            }
        });
    }
    if (filterSearchMeaning) {
        filterSearchMeaning.addEventListener('input', function () {
            if (this.value.length >= 2 || filterSearchKey.value.length >= 2) {
                if (typeof searchInfilter === "function") searchInfilter();
            } else if (!this.value && !filterSearchKey.value) {
                document.getElementById('filterSearchResults').style.display = 'none';
            }
        });
    }
    document.getElementById('filterSearchLine')?.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') goToLine('filter');
    });

});