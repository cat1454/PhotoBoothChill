# PHOTobooth Native - Database Design

## 1. Phạm vi thiết kế

Tài liệu này tách từ `project_overview.md` và mô tả thiết kế database ban đầu cho MVP.

Mục tiêu:
- lưu được user, địa điểm, frame, phiên chụp, ảnh và stamp
- hỗ trợ chung cho Web App và Kiosk
- dễ mở rộng thêm thống kê, thiết bị kiosk và history về sau

Khuyến nghị chung:
- dùng PostgreSQL cho MVP
- dùng `uuid` cho khóa chính
- đặt tên bảng theo `snake_case`
- dùng `timestamptz` cho thời gian

## 2. Sơ đồ quan hệ nghiệp vụ

- Một `user` có nhiều `photo_sessions`
- Một `location` có nhiều `frame_templates`
- Một `location` có nhiều `photo_sessions`
- Một `photo_session` có nhiều `photo_assets`
- Một `user` có nhiều `passport_stamps`
- Một `location` có nhiều `passport_stamps`
- Một `photo_asset` có thể gắn với một `passport_stamp`

## 3. Danh sách bảng MVP

### 3.1. `users`

Mục đích:
- lưu tài khoản người dùng và admin

| Cột | Kiểu dữ liệu | Ràng buộc | Ghi chú |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | mã người dùng |
| `full_name` | `varchar(150)` | not null | tên hiển thị |
| `email` | `varchar(255)` | not null, unique | email đăng nhập |
| `password_hash` | `text` | not null | hash mật khẩu |
| `role` | `varchar(20)` | not null | `user` hoặc `admin` |
| `created_at` | `timestamptz` | not null | thời điểm tạo |
| `updated_at` | `timestamptz` | not null | thời điểm cập nhật |

Index khuyến nghị:
- unique index cho `email`
- index cho `role`

### 3.2. `locations`

Mục đích:
- lưu điểm du lịch hoặc campaign nơi người dùng check-in/chụp ảnh

| Cột | Kiểu dữ liệu | Ràng buộc | Ghi chú |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | mã địa điểm |
| `name` | `varchar(150)` | not null | tên địa điểm |
| `slug` | `varchar(180)` | not null, unique | slug hiển thị/url |
| `description` | `text` | null | mô tả địa điểm |
| `thumbnail_url` | `text` | null | ảnh đại diện |
| `status` | `varchar(20)` | not null | `draft`, `active`, `inactive` |
| `created_at` | `timestamptz` | not null | thời điểm tạo |
| `updated_at` | `timestamptz` | not null | thời điểm cập nhật |

Index khuyến nghị:
- unique index cho `slug`
- index cho `status`

### 3.3. `frame_templates`

Mục đích:
- lưu frame/template để áp lên ảnh theo location

| Cột | Kiểu dữ liệu | Ràng buộc | Ghi chú |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | mã frame |
| `name` | `varchar(150)` | not null | tên frame |
| `location_id` | `uuid` | FK -> `locations.id` | location sở hữu frame |
| `image_url` | `text` | not null | file frame PNG/WebP |
| `type` | `varchar(30)` | not null | `single`, `strip`, `collage` |
| `is_active` | `boolean` | not null default `true` | frame đang sử dụng |
| `created_at` | `timestamptz` | not null | thời điểm tạo |
| `updated_at` | `timestamptz` | not null | thời điểm cập nhật |

Index khuyến nghị:
- index cho `location_id`
- composite index cho `location_id, is_active`

### 3.4. `photo_sessions`

Mục đích:
- lưu vòng đời của một phiên chụp ảnh

| Cột | Kiểu dữ liệu | Ràng buộc | Ghi chú |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | mã phiên chụp |
| `user_id` | `uuid` | FK -> `users.id` | user khởi tạo |
| `location_id` | `uuid` | FK -> `locations.id` | location đã chọn |
| `device_type` | `varchar(20)` | not null | `web`, `kiosk`, `raspberry_pi` |
| `status` | `varchar(20)` | not null | `created`, `captured`, `uploaded`, `processed`, `delivered`, `failed` |
| `created_at` | `timestamptz` | not null | thời điểm tạo |
| `updated_at` | `timestamptz` | not null | thời điểm cập nhật |

Index khuyến nghị:
- index cho `user_id`
- index cho `location_id`
- index cho `status`
- composite index cho `created_at, status`

### 3.5. `photo_assets`

Mục đích:
- lưu metadata các file ảnh gốc, preview, processed và QR

| Cột | Kiểu dữ liệu | Ràng buộc | Ghi chú |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | mã ảnh |
| `session_id` | `uuid` | FK -> `photo_sessions.id` | session chứa ảnh |
| `original_url` | `text` | null | ảnh gốc sau upload |
| `processed_url` | `text` | null | ảnh đã áp frame |
| `preview_url` | `text` | null | ảnh preview |
| `qr_code_url` | `text` | null | ảnh QR hoặc link tới QR |
| `created_at` | `timestamptz` | not null | thời điểm tạo |
| `updated_at` | `timestamptz` | not null | thời điểm cập nhật |

Index khuyến nghị:
- index cho `session_id`

Ghi chú:
- nếu một session có nhiều lần chụp lại, có thể có nhiều `photo_assets`
- có thể bổ sung `selected_frame_template_id` ở giai đoạn sau nếu muốn audit rõ ảnh dùng frame nào

### 3.6. `passport_stamps`

Mục đích:
- lưu dấu check-in mà user nhận được theo location

| Cột | Kiểu dữ liệu | Ràng buộc | Ghi chú |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | mã stamp |
| `user_id` | `uuid` | FK -> `users.id` | người nhận stamp |
| `location_id` | `uuid` | FK -> `locations.id` | địa điểm tương ứng |
| `photo_id` | `uuid` | FK -> `photo_assets.id` | ảnh đại diện cho stamp |
| `earned_at` | `timestamptz` | not null | thời điểm đạt stamp |

Index khuyến nghị:
- index cho `user_id`
- index cho `location_id`
- unique index cho `user_id, location_id` nếu mỗi user chỉ được một stamp trên một location

## 4. Enum gợi ý

### `users.role`
- `user`
- `admin`

### `locations.status`
- `draft`
- `active`
- `inactive`

### `frame_templates.type`
- `single`
- `strip`
- `collage`

### `photo_sessions.device_type`
- `web`
- `kiosk`
- `raspberry_pi`

### `photo_sessions.status`
- `created`
- `captured`
- `uploaded`
- `processed`
- `delivered`
- `failed`

## 5. Quy tắc dữ liệu quan trọng

- Một `photo_session` phải gắn với đúng một `location`
- Một `photo_asset` phải thuộc về một `photo_session`
- Một `passport_stamp` nên chỉ được tạo sau khi ảnh đã xử lý xong
- Không nên xoá cứng `locations` hoặc `frame_templates` nếu đã có dữ liệu lịch sử liên quan

## 6. Khuyến nghị migration đầu tiên

Thứ tự tạo bảng:
1. `users`
2. `locations`
3. `frame_templates`
4. `photo_sessions`
5. `photo_assets`
6. `passport_stamps`

Thứ tự này đủ để thiết lập khóa ngoại mà không cần vòng phụ thuộc.

## 7. Khuyến nghị mở rộng sau MVP

Có thể bổ sung thêm các bảng sau khi hệ thống ổn định:
- `admin_audit_logs` để lưu thao tác quản trị
- `devices` để quản lý kiosk/booth cụ thể
- `print_jobs` để theo dõi hàng đợi in ảnh
- `photo_processing_jobs` nếu tách xử lý ảnh sang background worker
