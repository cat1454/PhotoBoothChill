# Commit Plan

Updated: 2026-04-04

## 1. Muc Tieu

File nay gom cac thay doi trong working tree hien tai thanh tung cum commit hop ly.

Luu y:
- Co mot so file dang chua ca logic va UI trong cung mot file.
- Co mot so file can `git add -p` neu muon lich su commit sach hon.

## 2. Thu Tu Commit De Xuat

### Commit 1 - Docs va working rules

Message goi y:

`docs: add working rules status and commit plan`

Files:
- `working-rules.md`
- `implementation-status.md`
- `commit-plan.md`

Commands:

```powershell
git add working-rules.md implementation-status.md commit-plan.md
git commit -m "docs: add working rules status and commit plan"
```

### Commit 2 - Data model va public download API

Message goi y:

`feat(api): add public download assets and share token endpoints`

Files:
- `packages/shared/src/index.ts`
- `packages/db/prisma/schema.prisma`
- `packages/db/prisma/migrations/0002_public_download_assets/migration.sql`
- `apps/api/src/app.module.ts`
- `apps/api/src/common/serializers.ts`
- `apps/api/src/photos/photos.module.ts`
- `apps/api/src/storage/local-storage.service.ts`
- `apps/api/src/public/public.module.ts`

Ghi chu:
- Commit nay la nen tang cho `publicShareToken`, `sourceBundleKey`, `originalsArchiveKey`, `animatedFrameKey`.

Commands:

```powershell
git add packages/shared/src/index.ts packages/db/prisma/schema.prisma packages/db/prisma/migrations/0002_public_download_assets/migration.sql apps/api/src/app.module.ts apps/api/src/common/serializers.ts apps/api/src/photos/photos.module.ts apps/api/src/storage/local-storage.service.ts apps/api/src/public/public.module.ts
git commit -m "feat(api): add public download assets and share token endpoints"
```

### Commit 3 - Dependencies cho source bundle va worker video

Message goi y:

`chore(deps): add source bundle and ffmpeg dependencies`

Files:
- `apps/photo-worker/package.json`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`

File can tach hunk:
- `apps/web/package.json`

Chi stage phan:
- them dependency `fflate`

Khong stage o commit nay:
- thay doi script `dev` de bind `0.0.0.0`

Commands:

```powershell
git add apps/photo-worker/package.json pnpm-workspace.yaml pnpm-lock.yaml
git add -p apps/web/package.json
git commit -m "chore(deps): add source bundle and ffmpeg dependencies"
```

### Commit 4 - Web photo flow, frame flow va public download page

Message goi y:

`feat(web): add multi-shot frame flow and public download pages`

Files:
- `apps/web/src/lib/capture.ts`
- `apps/web/src/lib/frame-layout.ts`
- `apps/web/src/lib/source-bundle.ts`
- `apps/web/src/lib/souvenir-package.ts`
- `apps/web/app/capture/page.tsx`
- `apps/web/app/preview/page.tsx`
- `apps/web/app/result/[photoId]/page.tsx`
- `apps/web/app/download/[token]/page.tsx`
- `packages/db/prisma/seed.ts`
- `apps/web/public/frames/da-nang-frame-01.png`
- `apps/web/public/frames/hoi-an-frame-01.png`
- `apps/web/public/frames/hue-frame-01.png`
- `apps/web/public/frames/da-nang-frame-01/frame.png`
- `apps/web/public/frames/da-nang-frame-01/manifest.json`
- `public/frames/da-nang-frame-01.png`
- `public/frames/hoi-an-frame-01.png`
- `public/frames/hue-frame-01.png`

File can stage cung commit nay:
- `apps/web/package.json`

Chi stage phan:
- them dependency `fflate`

Ghi chu:
- Commit nay la phan logic user flow moi:
  - capture bundle
  - chon anh
  - source bundle upload
  - result page moi
  - public download page
- Neu muon lich su sach hon nua, co the stage `preview/page.tsx` va `result/[photoId]/page.tsx` theo hunk.

Commands:

```powershell
git add apps/web/src/lib/capture.ts apps/web/src/lib/frame-layout.ts apps/web/src/lib/source-bundle.ts apps/web/src/lib/souvenir-package.ts apps/web/app/capture/page.tsx apps/web/app/preview/page.tsx apps/web/app/result/[photoId]/page.tsx apps/web/app/download/[token]/page.tsx packages/db/prisma/seed.ts apps/web/public/frames/da-nang-frame-01.png apps/web/public/frames/hoi-an-frame-01.png apps/web/public/frames/hue-frame-01.png apps/web/public/frames/da-nang-frame-01/frame.png apps/web/public/frames/da-nang-frame-01/manifest.json public/frames/da-nang-frame-01.png public/frames/hoi-an-frame-01.png public/frames/hue-frame-01.png
git add -p apps/web/package.json
git commit -m "feat(web): add multi-shot frame flow and public download pages"
```

### Commit 5 - UI preview mau va rollout giao dien xanh trang

Message goi y:

`feat(web): roll out blue-white souvenir ui across app`

Files:
- `apps/web/app/design-preview/page.tsx`
- `apps/web/app/design-preview/preview.module.css`
- `apps/web/app/globals.css`
- `apps/web/app/page.tsx`
- `apps/web/app/passport/page.tsx`
- `apps/web/app/admin/layout.tsx`
- `apps/web/app/admin/page.tsx`
- `apps/web/app/admin/login/page.tsx`
- `apps/web/app/admin/locations/page.tsx`
- `apps/web/app/admin/frames/page.tsx`
- `apps/web/app/admin/sessions/page.tsx`

Ghi chu:
- `apps/web/app/preview/page.tsx` va `apps/web/app/result/[photoId]/page.tsx` da bi tron ca logic va UI.
- Neu muon commit UI tach rieng that sach, phai dung `git add -p` cho 2 file do.
- Neu khong can qua sach, giu 2 file do o Commit 4 la thuc dung hon.

Commands:

```powershell
git add apps/web/app/design-preview/page.tsx apps/web/app/design-preview/preview.module.css apps/web/app/globals.css apps/web/app/page.tsx apps/web/app/passport/page.tsx apps/web/app/admin/layout.tsx apps/web/app/admin/page.tsx apps/web/app/admin/login/page.tsx apps/web/app/admin/locations/page.tsx apps/web/app/admin/frames/page.tsx apps/web/app/admin/sessions/page.tsx
git commit -m "feat(web): roll out blue-white souvenir ui across app"
```

### Commit 6 - Mobile / LAN dev support

Message goi y:

`chore(dev): enable lan testing for mobile devices`

Files:
- `.gitignore`
- `apps/api/src/main.ts`
- `apps/web/next.config.ts`

File can tach hunk:
- `apps/web/package.json`

Chi stage phan:
- script `dev` doi thanh `next dev -H 0.0.0.0 -p 3000`

Ghi chu:
- Commit nay chi nen gom thay doi de test bang dien thoai:
  - bind host LAN
  - `allowedDevOrigins`
  - ignore `*.tsbuildinfo`

Commands:

```powershell
git add .gitignore apps/api/src/main.ts apps/web/next.config.ts
git add -p apps/web/package.json
git commit -m "chore(dev): enable lan testing for mobile devices"
```

## 3. Cach Lam Nhanh Neu Khong Muon Tach Qua Sau

Neu muon nhanh va van hop ly, co the gop thanh 4 commit:

1. `docs: add working rules status and commit plan`
2. `feat(api): add public download assets and share token endpoints`
3. `feat(worker): add source bundle processing and animated frame outputs`
4. `feat(web): add multi-shot frame flow public downloads and ui rollout`

## 4. File De Y Vi Dang Tron Nhieu Loai Thay Doi

- `apps/web/package.json`
  - vua co dependency moi
  - vua co LAN dev host
- `apps/web/app/preview/page.tsx`
  - vua co logic source bundle/public download
  - vua co UI moi
- `apps/web/app/result/[photoId]/page.tsx`
  - vua co logic public download
  - vua co UI moi

## 5. Goi Y Stage Theo Tung Cum

Neu muon stage sach, uu tien dung:

```powershell
git add -p apps/web/package.json
git add -p apps/web/app/preview/page.tsx
git add -p apps/web/app/result/[photoId]/page.tsx
```

Sau do moi `git commit` theo dung thu tu o tren.

## 6. Cach nhanh 4 commit

```powershell
git add working-rules.md implementation-status.md commit-plan.md
git commit -m "docs: add working rules status and commit plan"

git add packages/shared/src/index.ts packages/db/prisma/schema.prisma packages/db/prisma/migrations/0002_public_download_assets/migration.sql apps/api/src/app.module.ts apps/api/src/common/serializers.ts apps/api/src/photos/photos.module.ts apps/api/src/storage/local-storage.service.ts apps/api/src/public/public.module.ts apps/photo-worker/package.json pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "feat(api): add public download assets and worker download dependencies"

git add apps/web/src/lib/capture.ts apps/web/src/lib/frame-layout.ts apps/web/src/lib/source-bundle.ts apps/web/src/lib/souvenir-package.ts apps/web/app/capture/page.tsx apps/web/app/preview/page.tsx apps/web/app/result/[photoId]/page.tsx apps/web/app/download/[token]/page.tsx packages/db/prisma/seed.ts apps/web/public/frames/da-nang-frame-01.png apps/web/public/frames/hoi-an-frame-01.png apps/web/public/frames/hue-frame-01.png apps/web/public/frames/da-nang-frame-01/frame.png apps/web/public/frames/da-nang-frame-01/manifest.json public/frames/da-nang-frame-01.png public/frames/hoi-an-frame-01.png public/frames/hue-frame-01.png apps/photo-worker/src/workers/photo-process.worker.ts apps/web/package.json
git commit -m "feat(web): add multi-shot capture public downloads and animated frame flow"

git add .gitignore apps/api/src/main.ts apps/web/next.config.ts apps/web/app/design-preview/page.tsx apps/web/app/design-preview/preview.module.css apps/web/app/globals.css apps/web/app/page.tsx apps/web/app/passport/page.tsx apps/web/app/admin/layout.tsx apps/web/app/admin/page.tsx apps/web/app/admin/login/page.tsx apps/web/app/admin/locations/page.tsx apps/web/app/admin/frames/page.tsx apps/web/app/admin/sessions/page.tsx
git commit -m "feat(web): roll out souvenir ui and mobile lan dev support"
```

## 7. Ghi Chu Thuc Te

- Sau moi commit, nen chay `git status --short` de chac chan khong stage nham phan cua commit sau.
- Neu `apps/web/package.json` stage sai hunk, dung:

```powershell
git restore --staged apps/web/package.json
git add -p apps/web/package.json
```

- Neu muon an toan nhat, dung cach 6 commit.
