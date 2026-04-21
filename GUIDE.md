# 🎯 Tài Liệu Hướng Dẫn Kỹ Thuật (Developer Guide) - ToolVietPhrase

Tài liệu này cung cấp cái nhìn tổng quan toàn diện về cấu trúc, quy tắc, luồng làm việc và các định hướng phát triển của dự án **ToolVietPhrase**. Phù hợp cho lập trình viên, người đóng góp mã nguồn (contributors), hoặc AI agent thao tác trên codebase.

---

## 1. 🏗️ Kiến Trúc & Công Nghệ

**ToolVietPhrase** là một **Static Web Application** (Ứng dụng web tĩnh) xử lý dữ liệu hoàn toàn ở phía client (trình duyệt).
- **Core Stack**: HTML5, Vanilla JavaScript, Vanilla CSS.
- **Dependency**: Không sử dụng framework frontend ngoài (như React, Vue) hay thư viện build phức tạp. Mục đích là giữ cho file cực kỳ mỏng nhẹ và dễ deploy thẳng dưới dạng file độc lập.
- **Data constraint**: Dựa vào định dạng Text đặc trưng của dữ liệu VietPhrase: `KEY=nghĩa 1/nghĩa 2/...`
- **File Structure**:
  - `index.html`: Giao diện trang chính của app, chia thành các phần (`tool-section`) có thể thu gọn (collapse).
  - `scripts/common.js`: Chứa toàn bộ các tiện ích xử lý logic thao tác DOM, API FileReader tải tệp, xử lý logic Parse / Merge / Lọc dữ liệu.
  - `css/style.css`: Lưu trữ biến CSS (Custom properties), hệ thống lưới bố cục và quy tắc hiển thị UI Tooling.

---

## 2. 📋 Quy Tắc Phát Triển (Coding Rules)

- **Modularity (Tính module)**: Cố gắng giữ logic tĩnh về DOM trong `<script>` tách biệt tại `common.js`. Tránh Inline Javascript vào `index.html` quá nhiều ngoài các thuộc tính DOM events (`onclick=`).
- **Data Integrity (Toàn vẹn Dữ liệu)**: Bất cứ thao tác nào thay đổi file Việt Phrase đều phải bảo toàn cấu trúc chuỗi (`KEY=...`). Không làm vỡ định dạng phân tách mặc định (`/`, `=`).
- **Memory & Performance**:
  - Do làm việc qua `FileReader API` với text files có kích thước lên đến hàng triệu dòng, cần sử dụng cấu trúc `Set` và `Object/Dictionary` (thời gian truy xuất tính toán `O(1)`) để tối ưu thời gian CPU. Tránh sử dụng Array `.filter()` lồng ghép ở các logic vòng lặp lớn để không gây tắc nghẽn giao diện (`O(n^2)`). 
- **Quy Tắc Đặt Tên (Naming Convention)**:
  - HTML ID, Class: Sử dụng semantic rõ nghĩa (Ví dụ: `parseInput`, `mergeSearchLine`, `.search-btn`).
  - JS Function, Variables: Qui ước đặt tên theo `camelCase` (Ví dụ: `downloadMergeResult`, `displayParseResults`).

---

## 3. 🔄 Các Workflows Xử Lý Cốt Lõi

Hệ thống cung cấp 3 bộ công cụ chính hoạt động độc lập:

### 3.1. Phân Tích Dữ Liệu (File Parser Workflow)
Nằm tại nhóm hàm xử lý `parseFile()`
- **Input**: Nhận file `.txt` từ máy hoặc dữ liệu văn bản paste thủ công.
- **Tiến trình**: Gọi `readFileContent()` -> Lấy nội dung chuỗi Text -> Đưa vào `parseToDict()`. Tách từ khóa và các nghĩa độc lập. Loại bỏ các nghĩa trùng lặp bên trong một từ khóa bằng hàm tập hợp `Set`.
- **Output**: Biểu diễn qua các ô số liệu thống kê trực quan (Tổng từ khóa, tổng nghĩa, tỷ lệ...), đồng thời liệt kê danh sách các dòng preview trên khung edit (`contenteditable`). 
- **Bonus Feature**: Có công cụ tìm kiếm cục bộ (🔍 theo từ khóa, dòng, theo nghĩa). Tính năng cuộn thẳng đến dòng (Go to Line) và xuất file (Export Text).

### 3.2. Hợp Nhất File (File Merger Workflow)
Nằm tại nhóm hàm xử lý `mergeFiles()`
- **Input**: Đón nhận 2 luồng File song song: **File Chính** và **File Phụ**.
- **Tiến trình**:
  - Chuyển 2 dữ liệu thô đầu vào thành Object Keyword Dictionary.
  - Vận hành module quy tắc `mergeDataByOption()` dựa trên 4 tuỳ chọn thuật toán: 
    1. **Nghĩa phụ**: Cắt bỏ nghĩa chính, lấy nghĩa theo File Phụ.
    2. **Nghĩa phụ + chính**: Nghĩa Phụ chèn lên trước, Nghĩa Chính nối phía sau.
    3. **Nghĩa chính**: Bỏ qua phụ, lấy nghĩa theo File Chính.
    4. **Nghĩa chính + phụ**: Nghĩa Chính giữ nguyên, Nghĩa Phụ được bổ sung theo sau.
- **Output**: Đẩy DOM hiển thị tại `displayMergeResults()`. Textarea của luồng này sẽ đánh highlight thẻ tag thông qua listener event (`detectChanges()`) trên các giá trị đã tự tay người dùng chỉnh sửa thêm bớt. Tải xuống file.

### 3.3. Bộ Lọc Tên riêng (Name Filter Workflow)
Nằm tại nhóm hàm xử lý `filterFile()`
- **Input**: Tệp văn bản hoặc text tự nhập.
- **Tiến trình**: Sử dụng pipeline xử lý `filterToDict()`. Vắt lọc giữ lại toàn bộ đối tượng từ vựng thỏa mãn điều kiện nghiêm ngặt: có từ bắt đầu bằng chữ in hoa cấu trúc dạng Tiêu Đề theo `isTitleCase()` và tuyệt đối không bao hàm chữ số hay các ký tự đặc biệt lộn xộn `hasNumberOrSpecial()`.
- **Output**: Trả ra bộ từ vựng tinh gọn chuyên làm từ điển Name riêng (Tên ngữ cảnh đặc biệt).

---

## 4. 🛠️ Kỹ Năng Yêu Cầu Dành Cho Developers

Các lập trình viên muốn tham gia, custom hoặc fix bug cho dự án cần đảm bảo:
1. **HTML5 File API / Local Blob Storage**: Nắm vững phương pháp mô phỏng lưu file text xuống máy hệ thống bằng đối tượng `Blob()` và tạo object URL qua `URL.createObjectURL()`.
2. **Kỹ năng Javascript ES6+**: 
   - Quản lý bất đồng bộ Async/Await.
   - Thao tác chuyển hóa `Array / Object`, và khử trùng lặp dữ liệu chuỗi dùng `Set()`.
3. **Regex (Regular Expression)**: Đọc hiểu được Regex Pattern, đặc biệt là cờ `unicode /u/` trong chức năng lọc tên có ký tự chữ việt, hoặc unicode đa dải.
4. **Vanilla DOM API / Editable Handling**: Quản lý tốt logic thuộc tính `contenteditable`, và các method giao diện kéo tự động như DOM Element `scrollIntoView()`.

---

## 5. 🚀 Lộ Trình Phát Triển & Các Nhóm Tác Vụ Mở Rộng

Dưới đây là phân bổ các tính năng tiềm năng cũng như nợ kỹ thuật (Tech Debts) cần cải tiến thêm:

- **[A] Nhóm Hiệu Suất / Performance**:
  - Chuyển thao tác parse regex khối dữ liệu khổng lồ đẩy ngầm xử lý lên Web Workers (`worker.js`) nhằm tránh ứng dụng treo block luồng giao diện khi phân tích các file hàng triệu dòng (>50MB).
  - Tích hợp **Virtual Scrolling** (Render ảo theo viewport) cho danh sách kết quả `<span>` dài, giúp trình duyệt không sập khi số Node trong DOM > 100,000.
- **[B] Nhóm Trải Nghiệm / UI/UX Improvement**:
  - Cung cấp tính năng **Color Theme Toggle (Dark Mode)** lưu thiết lập cache vào `LocalStorage`.
  - Đưa vào thư viện biểu diễn đồ thị `chart.js` siêu nhỏ để minh hoạ % dữ liệu hợp nhất. 
- **[C] Nhóm Nâng Cấp Tính Năng / Feature Upgrades**:
  - **Custom Regex Filter Input**: Cho phép người sử dụng tự gõ tuỳ chỉnh logic Regex (thông qua UI text input) trong luồng Filter, không code cứng hàm `isTitleCase()` nữa.
  - Bổ sung **Advanced Diff Viewer**, chức năng xem chia cột Before/After khi merge File giúp quan sát chi tiết từng thành phần đã bị thay thế hoặc sáp nhập.
  - Trình phân phát định dạng mới khác `.txt` ví dụ `csv`.

---
*Tài liệu nội bộ dự án bảo toàn và nâng cấp ToolVietPhrase.*
