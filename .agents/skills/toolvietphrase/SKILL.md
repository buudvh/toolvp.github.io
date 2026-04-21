---
name: toolvietphrase
description: Hướng dẫn kỹ thuật và luồng công việc cho dự án ToolVietPhrase. Dùng skill này khi cần tuân thủ các quy tắc lập trình, sửa lỗi logic, định hướng phát triển hay cần hiểu biết về kiến trúc của thao tác code đối với dữ liệu dự án ToolVietPhrase.
---

# Kỹ Năng: Giao tiếp & Thao Tác Code Dự Án ToolVietPhrase

Kỹ năng này bao gồm các quy tắc lõi khi chỉnh sửa mã nguồn cho dự án ToolVietPhrase. 

## Yêu cầu cốt lõi (Core Rules)
- **Kiến trúc web tĩnh**: Chỉ sử dụng HTML, JS (Vanilla), CSS (Vanilla), tuyệt đối KHÔNG sử dụng Framework.
- **Tính toàn vẹn Dữ liệu**: Định dạng gốc VietPhrase luôn phải giữ trạng thái `KEY=nghĩa 1/nghĩa 2/...`. Không được làm mất quy cách phân tách bằng dấu `=` và `/`. 
- **Tối ưu Vòng Lặp**: Phải sử dụng Data Dictionary (Object), hoặc tập hợp `Set` để lookup, cấm sử dụng các phép lọc lặp đi lặp lại nhiều lần trên mảng (như `.filter` lồng nhau) do lượng dữ liệu text vào có thể lên đến hàng triệu dòng.

## Tài liệu tham khảo kĩ thuật đầy đủ
Vui lòng tham chiếu trực tiếp đến file Hướng Dẫn Kỹ Thuật (Nằm trong thư mục root):
👉 **[`GUIDE.md`](../../../GUIDE.md)**

File trên sẽ cung cấp toàn diện về luồng các Tool (Phân tích, Hợp nhất, Bộ Lọc) và các đầu việc bảo trì tương lai.  
Hãy luôn tuân thủ nghiêm ngặt `GUIDE.md` trước và trong thời gian thực hiện thao tác codebase của ToolVietPhrase.
