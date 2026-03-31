# PHOTobooth Native - API Spec

## 1. Phạm vi tài liệu

Tài liệu này tách từ `project_overview.md` và mô tả API draft ban đầu cho MVP.

Phiên bản hiện tại:
- version: `v1`
- base path: `/api/v1`
- mục tiêu: đủ dùng cho Web App trước, sau đó Kiosk tái sử dụng

## 2. Quy ước chung

### 2.1. Authentication
- endpoint public: `auth/login`, `auth/register`, `locations`, `locations/:id`
- endpoint admin: CRUD `locations`, CRUD `frame-templates`, thống kê
- endpoint user: `photo-sessions`, `photos`, `passport`

Khuyến nghị:
- dùng JWT access token
- truyền token qua header `Authorization: Bearer <token>`

### 2.2. Response format

Response thành công:

```json
{
  "data": {},
  "meta": {},
  "error": null
}
```

Response lỗi:

```json
{
  "data": null,
  "meta": {},
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request payload is invalid"
  }
}
```

### 2.3. Resource chính
- `User`
- `Location`
- `FrameTemplate`
- `PhotoSession`
- `PhotoAsset`
- `PassportStamp`

## 3. Auth

### `POST /api/v1/auth/register`

Mục đích:
- tạo tài khoản người dùng mới

Request body:

```json
{
  "fullName": "Nguyen Van A",
  "email": "user@example.com",
  "password": "secret123"
}
```

Response `201`:

```json
{
  "data": {
    "user": {
      "id": "usr_001",
      "fullName": "Nguyen Van A",
      "email": "user@example.com",
      "role": "user"
    },
    "accessToken": "jwt-token"
  },
  "meta": {},
  "error": null
}
```

### `POST /api/v1/auth/login`

Mục đích:
- đăng nhập user hoặc admin

Request body:

```json
{
  "email": "admin@example.com",
  "password": "secret123"
}
```

Response `200`:

```json
{
  "data": {
    "user": {
      "id": "usr_admin_001",
      "fullName": "Admin",
      "email": "admin@example.com",
      "role": "admin"
    },
    "accessToken": "jwt-token"
  },
  "meta": {},
  "error": null
}
```

## 4. Locations

### `GET /api/v1/locations`

Mục đích:
- lấy danh sách địa điểm để người dùng chọn trước khi chụp

Query gợi ý:
- `status=active`
- `search=<keyword>`

Response `200`:

```json
{
  "data": [
    {
      "id": "loc_001",
      "name": "Hoi An Ancient Town",
      "slug": "hoi-an-ancient-town",
      "description": "Location for Hoi An campaign",
      "thumbnailUrl": "https://cdn.example.com/locations/hoi-an.jpg",
      "status": "active"
    }
  ],
  "meta": {},
  "error": null
}
```

### `GET /api/v1/locations/:id`

Mục đích:
- lấy chi tiết một địa điểm và danh sách frame có thể áp dụng

### `POST /api/v1/locations`

Phân quyền:
- admin

Request body:

```json
{
  "name": "Hoi An Ancient Town",
  "slug": "hoi-an-ancient-town",
  "description": "Location for Hoi An campaign",
  "thumbnailUrl": "https://cdn.example.com/locations/hoi-an.jpg",
  "status": "active"
}
```

### `PUT /api/v1/locations/:id`

Phân quyền:
- admin

Mục đích:
- cập nhật metadata địa điểm

### `DELETE /api/v1/locations/:id`

Phân quyền:
- admin

Mục đích:
- xoá mềm hoặc vô hiệu hoá địa điểm

## 5. Frame Templates

### `GET /api/v1/frame-templates`

Query gợi ý:
- `locationId=<id>`
- `type=single|strip`
- `isActive=true`

### `POST /api/v1/frame-templates`

Phân quyền:
- admin

Request body:

```json
{
  "name": "Hoi An Frame 01",
  "locationId": "loc_001",
  "imageUrl": "https://cdn.example.com/frames/hoi-an-01.png",
  "type": "single",
  "isActive": true
}
```

### `PUT /api/v1/frame-templates/:id`

Phân quyền:
- admin

### `DELETE /api/v1/frame-templates/:id`

Phân quyền:
- admin

## 6. Photo Sessions

### `POST /api/v1/photo-sessions`

Mục đích:
- tạo phiên chụp mới trước khi mở camera hoặc upload ảnh

Request body:

```json
{
  "locationId": "loc_001",
  "deviceType": "web"
}
```

Response `201`:

```json
{
  "data": {
    "id": "ses_001",
    "userId": "usr_001",
    "locationId": "loc_001",
    "deviceType": "web",
    "status": "created",
    "createdAt": "2026-03-31T09:00:00Z"
  },
  "meta": {},
  "error": null
}
```

### `GET /api/v1/photo-sessions/:id`

Mục đích:
- lấy chi tiết phiên chụp cùng ảnh trong session

### `PATCH /api/v1/photo-sessions/:id/status`

Mục đích:
- cập nhật trạng thái session theo tiến trình capture hoặc xử lý

Request body:

```json
{
  "status": "processed"
}
```

Giá trị trạng thái gợi ý:
- `created`
- `captured`
- `uploaded`
- `processed`
- `delivered`
- `failed`

## 7. Photos

### `POST /api/v1/photos/upload`

Mục đích:
- upload ảnh gốc theo session

Content type:
- `multipart/form-data`

Field gợi ý:
- `sessionId`
- `file`

Response `201`:

```json
{
  "data": {
    "id": "pho_001",
    "sessionId": "ses_001",
    "originalUrl": "https://cdn.example.com/photos/original/pho_001.jpg"
  },
  "meta": {},
  "error": null
}
```

### `POST /api/v1/photos/process`

Mục đích:
- xử lý ảnh sau upload
- resize, crop, nén
- áp frame/template
- thêm logo hoặc timestamp nếu cần

Request body:

```json
{
  "photoId": "pho_001",
  "frameTemplateId": "frm_001",
  "options": {
    "addTimestamp": true,
    "addLocationLogo": true
  }
}
```

Response `200`:

```json
{
  "data": {
    "id": "pho_001",
    "processedUrl": "https://cdn.example.com/photos/processed/pho_001.jpg",
    "previewUrl": "https://cdn.example.com/photos/preview/pho_001.jpg"
  },
  "meta": {},
  "error": null
}
```

### `GET /api/v1/photos/:id`

Mục đích:
- lấy chi tiết ảnh, link ảnh và thông tin session liên quan

### `GET /api/v1/photos/:id/qr`

Mục đích:
- trả QR code hoặc URL tải ảnh cuối cùng

Response `200`:

```json
{
  "data": {
    "photoId": "pho_001",
    "downloadUrl": "https://app.example.com/download/pho_001",
    "qrCodeUrl": "https://cdn.example.com/qr/pho_001.png"
  },
  "meta": {},
  "error": null
}
```

## 8. Passport

### `GET /api/v1/passport/me`

Mục đích:
- lấy thông tin passport của user hiện tại
- tổng số stamp đã đạt
- danh sách location đã check-in

### `GET /api/v1/passport/stamps`

Mục đích:
- lấy danh sách stamp và ảnh tương ứng

### `POST /api/v1/passport/check-in`

Mục đích:
- gắn stamp vào user sau khi hoàn tất photo flow tại một location

Request body:

```json
{
  "locationId": "loc_001",
  "photoId": "pho_001"
}
```

Response `201`:

```json
{
  "data": {
    "id": "pst_001",
    "userId": "usr_001",
    "locationId": "loc_001",
    "photoId": "pho_001",
    "earnedAt": "2026-03-31T09:10:00Z"
  },
  "meta": {},
  "error": null
}
```

## 9. Error code gợi ý

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `UPLOAD_FAILED`
- `PHOTO_PROCESSING_FAILED`
- `SESSION_INVALID_STATE`

## 10. Ghi chú cho giai đoạn sau

Các endpoint có thể bổ sung sau khi MVP ổn định:
- refresh token
- thống kê admin
- danh sách photo session cho admin
- quản lý upload từ kiosk
- in ảnh hoặc queue in tại booth
