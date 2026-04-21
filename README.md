# ToolVietPhrase

Công cụ web tĩnh để xử lý, phân tích và hợp nhất file "Việt Phrase" (định dạng `KEY=meaning1/meaning2/...`).

## Tính năng chính
- Phân tích file/chuỗi vào thành dictionary và hiển thị thống kê (`Tổng từ khóa`, `Tổng nghĩa`, `TB nghĩa/từ`) — xem [`parseFile()`](scripts/common.js) và [`parseToDict()`](scripts/common.js).  
- Hợp nhất hai file (file chính + file phụ) với nhiều tuỳ chọn hợp nhất (chỉ phụ, phụ + chính, chỉ chính, chính + phụ) — xem [`mergeFiles()`](scripts/common.js) và [`mergeDataByOption()`](scripts/common.js).  
- Lọc nghĩa theo điều kiện (ví dụ: chỉ giữ nghĩa có dạng Title Case, không chứa số/ký tự đặc biệt) — xem [`filterFile()`](scripts/common.js) và [`filterToDict()`](scripts/common.js).  
- Tìm kiếm và điều hướng kết quả (theo từ khóa, theo nghĩa, theo số dòng), highlight kết quả và hỗ trợ chỉnh sửa trước khi tải xuống.  
- Tải kết quả về file .txt (`downloadFile`) với tên chứa timestamp — xem [`downloadFile()`](scripts/common.js).

## Các file quan trọng
- Giao diện: [index.html](index.html)  
- Kiểu dáng: [css/style.css](css/style.css)  
- Logic chính (JS): [scripts/common.js](scripts/common.js) — chứa các hàm: [`parseFile()`](scripts/common.js), [`mergeFiles()`](scripts/common.js), [`filterFile()`](scripts/common.js), [`parseToDict()`](scripts/common.js), [`mergeDataByOption()`](scripts/common.js), [`filterToDict()`](scripts/common.js), [`downloadFile()`](scripts/common.js)  

## Cách chạy
Dự án là 1 trang tĩnh. Mở trực tiếp `index.html` trong trình duyệt hoặc chạy server tĩnh để tránh hạn chế CORS:
```sh
# trong thư mục dự án
python -m http.server 8000
# rồi mở http://localhost:8000/index.html