# PHOTobooth Native - Project Overview

## 1. Mục tiêu dự án

PHOTobooth Native là hệ thống photobooth cho khách du lịch, cho phép:
- chụp ảnh bằng camera thật
- áp frame theo địa điểm
- lưu và trả ảnh qua QR/link
- gắn ảnh vào hành trình check-in kiểu passport
- triển khai được trên cả Web App và Kiosk / Raspberry Pi

Mục tiêu của giai đoạn đầu là chứng minh được toàn bộ photo flow end-to-end trên Web App, sau đó mở rộng sang kiosk bằng cách tái sử dụng backend và API.

## 2. Phạm vi MVP

### User flow chính
1. Người dùng chọn địa điểm
2. Hệ thống tạo photo session
3. Mở camera và chụp ảnh
4. Xem preview, chụp lại nếu cần
5. Chọn frame/template
6. Upload ảnh
7. Server xử lý và lưu ảnh
8. Trả QR hoặc link tải ảnh
9. Gắn ảnh vào passport hành trình

### Admin flow chính
1. Đăng nhập admin
2. Quản lý địa điểm
3. Quản lý frame/template
4. Xem photo session và ảnh đã tạo
5. Xem thống kê lượt chụp cơ bản

## 3. Kiến trúc tổng quan

Hệ thống gồm 3 phần:

### Client Web App
- chạy trên điện thoại, tablet và browser
- phục vụ user flow chính và demo MVP

### Client Kiosk / Raspberry Pi
- dùng cho booth chụp ảnh tại điểm du lịch
- tập trung vào capture, upload, QR và in ảnh

### Backend Server
- dùng chung cho cả Web App và Kiosk
- quản lý user, location, frame, photo session, photo asset và passport

Định hướng kiến trúc:
- 1 backend dùng chung
- 2 client khác nhau
- Web App là hướng triển khai đầu tiên
- Kiosk là bước mở rộng sau khi API đã ổn định

## 4. Năng lực cốt lõi của hệ thống

- Camera capture: mở camera, preview, countdown, chụp lại
- Photo processing: crop, resize, nén, áp frame, thêm logo/timestamp
- Photo delivery: trả ảnh qua QR/link và lưu vào session gallery
- Journey / Passport: check-in theo location và gắn stamp cho user
- Admin management: CRUD location, CRUD frame và xem thống kê cơ bản

## 5. Chiến lược triển khai

### Giai đoạn 1
Ưu tiên Web App để chốt:
- flow chụp ảnh thật
- xử lý ảnh
- upload và trả ảnh
- passport hành trình

### Giai đoạn 2
Mở rộng sang Kiosk / Raspberry Pi bằng cách:
- tái sử dụng backend
- tái sử dụng API
- chỉ thay lớp client capture/output

## 6. Tài liệu chi tiết liên quan

- `roadmap.md`: milestone, ưu tiên triển khai, rủi ro và kế hoạch thực hiện
- `api-spec.md`: đặc tả API draft cho MVP
- `database-design.md`: thiết kế database và các bảng dữ liệu chính
