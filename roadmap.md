# PHOTobooth Native - Roadmap

## 1. Mục tiêu triển khai

Roadmap này tách từ `project_overview.md` để dùng như tài liệu thực thi ban đầu cho MVP của hệ thống PHOTobooth Native.

Mục tiêu chính:
- chứng minh được flow chụp ảnh thực bằng camera
- xử lý ảnh và áp frame theo địa điểm
- upload ảnh lên server và trả ảnh qua QR/link
- ghi nhận hành trình check-in kiểu passport
- xây backend dùng chung cho cả Web App và Kiosk

Định hướng triển khai:
- giai đoạn 1 ưu tiên **Web App** để chốt user flow và backend
- giai đoạn 2 mở rộng sang **Kiosk / Raspberry Pi** bằng cách tái sử dụng backend và API

## 2. Phạm vi MVP

### 2.1. User flow cần hoàn thành
1. Người dùng chọn địa điểm
2. Hệ thống tạo photo session
3. Mở camera và chụp ảnh
4. Xem preview và chụp lại nếu cần
5. Chọn frame/template
6. Upload ảnh
7. Server xử lý và lưu ảnh
8. Trả QR hoặc link tải ảnh
9. Gắn ảnh vào passport hành trình

### 2.2. Admin flow cần hoàn thành
1. Admin đăng nhập
2. CRUD địa điểm
3. CRUD frame/template
4. Xem danh sách photo session
5. Xem ảnh đã tạo
6. Xem thống kê lượt chụp cơ bản

### 2.3. Điều kiện hoàn thành MVP
- Web App chạy được trên mobile, tablet và desktop browser
- Backend có API tối thiểu cho auth, location, frame, photo session, photo upload, passport
- Database lưu được người dùng, địa điểm, phiên chụp, ảnh và stamp
- Ảnh sau xử lý có thể tải qua QR/link
- Admin có màn hình quản trị tối thiểu cho location và frame

## 3. Milestone triển khai

### Milestone 1 - Setup nền tảng

Mục tiêu:
- tạo cấu trúc repo cho frontend, backend và kiosk client
- cấu hình database
- cấu hình upload ảnh
- dựng auth cơ bản

Đầu ra mong đợi:
- frontend web khởi động được
- backend chạy được và kết nối database thành công
- có cấu trúc thư mục thống nhất
- có môi trường lưu ảnh local hoặc object storage cho dev

### Milestone 2 - Chụp ảnh cơ bản

Mục tiêu:
- mở camera thiết bị
- hiển thị preview camera
- chụp ảnh
- hỗ trợ countdown và chụp lại

Đầu ra mong đợi:
- người dùng có thể hoàn tất bước capture trên Web App
- tạo được ảnh gốc để chuyển sang bước xử lý

### Milestone 3 - Upload và xử lý ảnh

Mục tiêu:
- resize và nén ảnh
- upload ảnh gốc
- tạo ảnh đã áp frame/template
- sinh preview và link tải

Đầu ra mong đợi:
- photo session có ảnh gốc, ảnh preview và ảnh processed
- hệ thống trả về QR/link cho người dùng

### Milestone 4 - Passport hành trình

Mục tiêu:
- cho phép chọn địa điểm trước khi chụp
- check-in theo location
- gắn stamp vào tài khoản người dùng
- hiển thị lịch sử ảnh theo địa điểm

Đầu ra mong đợi:
- mỗi ảnh processed có thể gắn với location
- người dùng xem được danh sách stamp đã đạt

### Milestone 5 - Admin dashboard

Mục tiêu:
- CRUD location
- CRUD frame/template
- xem photo session
- xem ảnh đã tạo
- xem thống kê lượt chụp cơ bản

Đầu ra mong đợi:
- admin vận hành được dữ liệu nền của hệ thống
- có dashboard đủ để demo quản trị

### Milestone 6 - Kiosk / Raspberry Pi

Mục tiêu:
- dựng chế độ kiosk
- tích hợp camera thiết bị booth
- upload từ kiosk lên backend chung
- trả QR hoặc in ảnh

Đầu ra mong đợi:
- có client kiosk tối thiểu dùng lại backend/API hiện có
- chứng minh được kiến trúc 1 backend, 2 client

## 4. Thứ tự ưu tiên thực hiện ngay

### Frontend
- dựng route tổng thể
- dựng page chọn địa điểm
- dựng page camera
- dựng page preview
- dựng page kết quả QR

### Backend
- dựng auth cơ bản
- dựng API location
- dựng API photo session
- dựng API upload ảnh

### Database
- tạo bảng `users`
- tạo bảng `locations`
- tạo bảng `frame_templates`
- tạo bảng `photo_sessions`
- tạo bảng `photo_assets`
- tạo bảng `passport_stamps`

## 5. Rủi ro chính và cách giảm thiểu

### Web App
- phụ thuộc vào browser và quyền camera
- khó tích hợp phần cứng ngoại vi như máy in
- lưu local/session không ổn định bằng kiosk app

Cách giảm thiểu:
- test sớm trên mobile browser thật
- giữ xử lý ảnh nặng ở backend
- chưa tích hợp phần cứng ngoại vi trong MVP

### Kiosk / Raspberry Pi
- cấu hình camera và driver phức tạp hơn
- phát sinh rủi ro phần cứng
- tốn thời gian nếu làm quá sớm

Cách giảm thiểu:
- chốt toàn bộ flow trên Web App trước
- chỉ làm kiosk khi API backend đã ổn định
- tái sử dụng tối đa logic session, upload và delivery

## 6. Chiến lược thực hiện đề xuất

### Giai đoạn 1 - Web App first

Ưu tiên chứng minh 5 điểm:
- chụp ảnh thật
- xử lý ảnh
- upload ảnh
- nhận ảnh
- passport hành trình

### Giai đoạn 2 - Kiosk extension

Mở rộng sang kiosk bằng cách:
- tái sử dụng backend hiện có
- tái sử dụng API hiện có
- chỉ thay lớp client capture/output

## 7. Kết quả kiến trúc mong muốn

Hệ thống được triển khai theo hướng:
- 1 backend dùng chung
- 2 client khác nhau
- Web App làm client phổ thông
- Kiosk / Raspberry Pi làm client tại booth
