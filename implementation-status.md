# Implementation Status

Updated: 2026-04-04

## 1. Da Lam Duoc

- Da tao `commit-plan.md` de chia thay doi hien tai thanh tung cum commit de commit sach hon.
- Da them bo cau lenh commit ngay trong tung section commit cua `commit-plan.md`.
- Da tao `working-rules.md` de chot quy uoc: truoc moi task phai doc cac file `.md` lien quan, va sau moi task phai cap nhat lai tai lieu phu hop.
- Da dung xong monorepo TypeScript voi `apps/web`, `apps/api`, `apps/photo-worker`, `packages/db`, `packages/shared`.
- Da co Prisma schema, migration, seed va PostgreSQL local chay duoc.
- Da co flow web-first co ban:
  - dang nhap / dang ky
  - chon location
  - capture anh tren browser
  - chon frame
  - upload va queue xu ly
  - xem result va check-in passport
- Da co admin pages cho login, locations, frames, sessions.
- Da them frame bundle rieng cho Da Nang va flow chup nhieu anh.
- Da co preview chon anh de ghep vao frame.
- Da co worker xu ly anh voi `sharp`.
- Da chuyen QR sang trang tai cong khai tren web.
- Da co public download page voi 3 nut tai:
  - `All captured photos` -> ZIP
  - `Framed photo` -> JPG
  - `Animated frame` -> MP4
- Da upload `source bundle ZIP` tu web de worker co du du lieu tao file tai ve sau nay.
- Da mo rong `PhotoAsset` voi:
  - `publicShareToken`
  - `sourceBundleKey`
  - `originalsArchiveKey`
  - `animatedFrameKey`
- Da tao migration `0002_public_download_assets`.
- Da cau hinh LAN de test bang dien thoai:
  - web nghe `0.0.0.0`
  - api nghe `0.0.0.0`
  - `allowedDevOrigins` cho Next dev
  - URL public dang tro theo IP LAN hien tai

## 2. Da Verify

- `corepack pnpm --filter @photobooth/shared build`
- `corepack pnpm --filter @photobooth/db build`
- `corepack pnpm --filter @photobooth/api build`
- `corepack pnpm --filter @photobooth/photo-worker build`
- `corepack pnpm --filter @photobooth/web build`
- `corepack pnpm db:migrate`
- QR/download public route da tra du lieu dung qua LAN.
- Session moi nhat da co du:
  - framed JPG
  - originals ZIP
  - animated MP4

## 3. Chua On / Can Polish

- Test tren dien thoai bang `next dev` van de gay cam giac loading quay mai vi HMR. Muon test that thi nen chay web o che do production.
- `WEB_PUBLIC_URL`, `API_PUBLIC_URL`, `NEXT_PUBLIC_API_BASE_URL` dang tro toi IP LAN hien tai `192.168.1.78`. Neu doi Wi-Fi hoac doi IP thi phai cap nhat lai.
- Animated MP4 hien uu tien tinh on dinh de xuat file, nen dang scale clip vao o frame theo cach thuc dung duoc truoc. Ve mat hinh anh van con dat cho polish them de dep hon.
- Anh/session cu tao truoc khi co `publicShareToken` va `sourceBundleKey` se khong co full public download flow moi. Can chup session moi hoac reprocess co chu dich.
- Trong repo hien van con nhieu thay doi lon chua commit trong web/admin/UI, can review mot lan nua truoc khi push chinh thuc.

## 4. Chua Lam Xong

- Chua co bo `start:web`, `start:api`, `start:worker` chuan cho production smoke test.
- Chua co test tu dong end-to-end cho flow:
  - capture
  - upload
  - worker
  - QR
  - public mobile downloads
- Chua cleanup cac asset/thu muc trung lap giua `public/` va `apps/web/public/`.
- Chua co co che het han / revoke / bao mat hon cho public download token.
- Chua hoan thien phan kiosk / Raspberry Pi theo roadmap.

## 5. Goi Y Commit Message

`feat: add qr-based public mobile downloads with zip jpg and mp4 outputs`

## 6. Working Rule

- File quy uoc lam viec hien tai: `working-rules.md`
- File chia nhom commit hien tai: `commit-plan.md`
