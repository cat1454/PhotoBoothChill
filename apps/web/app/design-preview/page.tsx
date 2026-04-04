import Link from "next/link";

import styles from "./preview.module.css";

const navItems = [
  { id: "home", label: "Home / Auth" },
  { id: "capture", label: "Capture" },
  { id: "preview", label: "Preview" },
  { id: "result", label: "Result" },
  { id: "dashboard", label: "Admin Dashboard" },
  { id: "crud", label: "Admin CRUD" }
];

const locationCards = [
  {
    name: "Da Nang City",
    subtitle: "6-shot collage with guided auto capture",
    status: "Live",
    accent: "Primary"
  },
  {
    name: "Hoi An Ancient Town",
    subtitle: "Single frame experience for quick delivery",
    status: "Ready",
    accent: "Soft"
  },
  {
    name: "Hue Imperial City",
    subtitle: "Travel souvenir format with passport reward",
    status: "Draft",
    accent: "Soft"
  }
];

const selectedPhotos = [
  { label: "Photo 1", order: 1, tone: "cool" },
  { label: "Photo 2", order: 2, tone: "bright" },
  { label: "Photo 3", order: 3, tone: "calm" },
  { label: "Photo 4", tone: "calm" },
  { label: "Photo 5", tone: "bright" },
  { label: "Photo 6", tone: "cool" }
];

const sessionRows = [
  { guest: "Minh Anh", location: "Da Nang City", status: "Processed", time: "14:32" },
  { guest: "Lan Vy", location: "Hoi An Ancient Town", status: "Queued", time: "14:18" },
  { guest: "Gia Huy", location: "Hue Imperial City", status: "Failed", time: "13:59" }
];

const locationRows = [
  { name: "Da Nang City", status: "Active", frames: "2", updated: "2 mins ago" },
  { name: "Hoi An Ancient Town", status: "Active", frames: "1", updated: "20 mins ago" },
  { name: "Hue Imperial City", status: "Draft", frames: "1", updated: "1 hour ago" }
];

function Section({
  id,
  label,
  title,
  description,
  children
}: {
  id: string;
  label: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section} id={id}>
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.sectionLabel}>{label}</span>
          <h2>{title}</h2>
        </div>
        <p>{description}</p>
      </div>
      <div className={styles.screenFrame}>{children}</div>
    </section>
  );
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className={styles.metricCard}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function PhotoTile({ label, order, tone }: { label: string; order?: number; tone: string }) {
  const selected = typeof order === "number";

  return (
    <button className={`${styles.photoTile} ${selected ? styles.photoTileSelected : ""}`} type="button">
      <div className={`${styles.photoMock} ${styles[`tone${tone[0].toUpperCase()}${tone.slice(1)}`]}`}>
        {order ? <span className={styles.photoOrder}>{order}</span> : null}
        {selected ? <span className={styles.photoCheck}>âœ“</span> : null}
      </div>
      <div className={styles.photoMeta}>
        <strong>{label}</strong>
        {selected ? <span className={styles.photoPicked}>ÄÃ£ chá»n</span> : null}
      </div>
    </button>
  );
}

function AdminSidebar() {
  return (
    <aside className={styles.adminSidebar}>
      <div className={styles.brandBlock}>
        <div className={styles.brandBadge}>PB</div>
        <div>
          <strong>Photobooth Console</strong>
          <span>Blue / white admin shell</span>
        </div>
      </div>
      <nav className={styles.sidebarNav}>
        <a className={styles.sidebarLinkActive} href="#dashboard">
          Dashboard
        </a>
        <a className={styles.sidebarLink} href="#crud">
          Locations
        </a>
        <a className={styles.sidebarLink} href="#crud">
          Frames
        </a>
        <a className={styles.sidebarLink} href="#crud">
          Sessions
        </a>
        <a className={styles.sidebarLink} href="#crud">
          Settings
        </a>
      </nav>
      <div className={styles.sidebarFoot}>
        <span>Admin</span>
        <strong>admin@photobooth.local</strong>
      </div>
    </aside>
  );
}

export default function DesignPreviewPage() {
  return (
    <main className={styles.page}>
      <div className={styles.backdrop} />
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.heroEyebrow}>Design Preview Route</span>
            <h1>Photobooth UI mockup in blue and white</h1>
            <p>
              This page is a static showcase for visual review only. It does not call the API and does not change the
              live user flow.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryAction} href="/">
                Back to app
              </Link>
              <a className={styles.secondaryAction} href="#home">
                Jump to screens
              </a>
            </div>
          </div>
          <div className={styles.heroPanel}>
            <div className={styles.heroPanelTop}>
              <span className={styles.heroPanelBadge}>Palette</span>
              <span className={styles.heroPanelNote}>Clean modern</span>
            </div>
            <div className={styles.swatches}>
              <div className={styles.swatchPrimary} />
              <div className={styles.swatchSoft} />
              <div className={styles.swatchWhite} />
              <div className={styles.swatchInk} />
            </div>
            <ul className={styles.heroChecklist}>
              <li>Sans typography</li>
              <li>Card-based layout</li>
              <li>Desktop space used better</li>
              <li>Shared user and admin language</li>
            </ul>
          </div>
        </header>

        <nav className={styles.sectionNav}>
          {navItems.map((item) => (
            <a className={styles.sectionChip} href={`#${item.id}`} key={item.id}>
              {item.label}
            </a>
          ))}
        </nav>

        <Section
          id="home"
          label="User screen"
          title="Home / Auth + location selection"
          description="The home screen uses a two-column split: a concise auth panel on the left and a larger, richer location grid on the right."
        >
          <div className={styles.homeLayout}>
            <div className={styles.authPanel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelEyebrow}>Welcome back</span>
                <h3>Start a session</h3>
              </div>
              <div className={styles.segmented}>
                <button className={styles.segmentActive} type="button">
                  Login
                </button>
                <button className={styles.segment} type="button">
                  Register
                </button>
              </div>
              <div className={styles.fieldStack}>
                <label className={styles.field}>
                  <span>Email</span>
                  <input defaultValue="admin@photobooth.local" readOnly />
                </label>
                <label className={styles.field}>
                  <span>Password</span>
                  <input defaultValue="Admin123!" readOnly type="password" />
                </label>
              </div>
              <div className={styles.inlineMeta}>
                <span className={styles.metaBadge}>Admin seed</span>
                <span className={styles.metaText}>Fast access for staff demo</span>
              </div>
              <button className={styles.primaryBlock} type="button">
                Continue to locations
              </button>
            </div>

            <div className={styles.locationsPanel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelEyebrow}>Destination picker</span>
                <h3>Choose a photobooth route</h3>
              </div>
              <div className={styles.locationGrid}>
                {locationCards.map((item) => (
                  <article className={styles.locationCard} key={item.name}>
                    <div className={`${styles.locationHero} ${item.accent === "Primary" ? styles.locationHeroPrimary : styles.locationHeroSoft}`}>
                      <span>{item.status}</span>
                    </div>
                    <div className={styles.locationBody}>
                      <strong>{item.name}</strong>
                      <p>{item.subtitle}</p>
                      <button className={styles.secondaryInline} type="button">
                        Open flow
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="capture"
          label="User screen"
          title="Capture"
          description="The capture screen gives the camera stage most of the width, with compact status and auto-capture controls parked beside it."
        >
          <div className={styles.captureLayout}>
            <div className={styles.cameraStage}>
              <div className={styles.stageTopbar}>
                <span className={styles.liveDot}>Live</span>
                <span>Shot 2 of 6</span>
                <span>Auto capture in 03s</span>
              </div>
              <div className={styles.cameraViewport}>
                <div className={styles.cameraGlow} />
                <div className={styles.frameGuide}>
                  <span>Frame guide</span>
                  <strong>Matched to transparent window ratio</strong>
                </div>
              </div>
              <div className={styles.captureStrip}>
                {[1, 2, 3, 4, 5, 6].map((shot) => (
                  <div className={styles.captureThumb} key={shot}>
                    <span>{shot}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.captureSidebar}>
              <MetricCard label="Frame" value="Da Nang 01" note="6-shot collage" />
              <MetricCard label="Timer" value="7 sec" note="Ends with still capture" />
              <MetricCard label="Status" value="Auto" note="Pause / resume available" />
              <div className={styles.infoCard}>
                <strong>Capture controls</strong>
                <p>Short explanatory copy sits here instead of long helper text blocks.</p>
                <div className={styles.buttonRow}>
                  <button className={styles.primaryBlock} type="button">
                    Pause auto
                  </button>
                  <button className={styles.ghostBlock} type="button">
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="preview"
          label="User screen"
          title="Preview / photo selection"
          description="Preview becomes a souvenir-first workspace: the final card leads the screen, while photo selection stays fast and low-friction."
        >
          <div className={styles.selectionScene}>
            <div className={styles.selectionIntro}>
              <div>
                <h3>Chọn 3 ảnh bạn thích nhất</h3>
                <p>Ảnh sẽ được ghép vào khung lưu niệm Đà Nẵng.</p>
              </div>
              <div className={styles.selectionCount}>Đã chọn 3/3 ảnh</div>
            </div>

            <div className={styles.previewLayout}>
              <div className={styles.previewStage}>
                <div className={styles.souvenirHeader}>
                  <div>
                    <span className={styles.souvenirEyebrow}>Xem trước thành phẩm</span>
                    <h4>Khung lưu niệm Đà Nẵng</h4>
                  </div>
                  <div className={styles.souvenirMeta}>
                    <span className={styles.souvenirChip}>Đà Nẵng</span>
                    <span className={styles.souvenirChip}>3 ảnh</span>
                  </div>
                </div>
                <div className={styles.frameSurface}>
                  <div className={styles.framePreview}>
                    <img alt="Da Nang frame preview" className={styles.frameImage} src="/frames/da-nang-frame-01/frame.png" />
                    <div className={`${styles.slotHint} ${styles.slotHintOne}`}>
                      <span>1</span>
                    </div>
                    <div className={`${styles.slotHint} ${styles.slotHintTwo}`}>
                      <span>2</span>
                    </div>
                    <div className={`${styles.slotHint} ${styles.slotHintThree}`}>
                      <span>3</span>
                    </div>
                  </div>
                </div>
                <div className={styles.previewNote}>
                  <span>3 ảnh đã sẵn sàng</span>
                  <p>Chạm vào ảnh bên phải để thay đổi vị trí trong khung.</p>
                </div>
              </div>

              <div className={styles.photoGridPanel}>
                <div className={styles.selectionPanelHeader}>
                  <div>
                    <strong>Ảnh đã chụp</strong>
                    <span>Chạm để chọn hoặc bỏ chọn</span>
                  </div>
                  <span className={styles.selectionCountSoft}>3 đã chọn</span>
                </div>
                <div className={styles.photoGrid}>
                  {selectedPhotos.map((photo) => (
                    <PhotoTile key={photo.label} label={photo.label} order={photo.order} tone={photo.tone} />
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.selectionFooter}>
              <span className={styles.selectionReady}>Đã chọn: 1 • 3 • 2</span>
              <div className={styles.buttonRow}>
                <button className={styles.ghostBlock} type="button">
                  Chọn lại
                </button>
                <button className={styles.primaryBlock} type="button">
                  Tiếp tục tạo ảnh
                </button>
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="result"
          label="User screen"
          title="Result / delivery"
          description="The result screen is rebalanced into two equal, higher-contrast cards: processed output on the left and QR delivery actions on the right."
        >
          <div className={styles.resultLayout}>
            <div className={styles.resultCard}>
              <div className={styles.resultHeader}>
                <div>
                  <span className={styles.statusPill}>Processed</span>
                  <h3>Final souvenir</h3>
                </div>
                <span className={styles.metaText}>Updated 14:35</span>
              </div>
              <img alt="Processed frame result" className={styles.resultImage} src="/frames/da-nang-frame-01/frame.png" />
              <div className={styles.resultActions}>
                <button className={styles.primaryBlock} type="button">
                  Download image
                </button>
                <button className={styles.ghostBlock} type="button">
                  Open full preview
                </button>
              </div>
            </div>

            <div className={styles.deliveryCard}>
              <div className={styles.panelHeader}>
                <span className={styles.panelEyebrow}>Delivery</span>
                <h3>QR and passport actions</h3>
              </div>
              <div className={styles.qrMock}>
                {Array.from({ length: 49 }).map((_, index) => (
                  <span className={index % 2 === 0 || index % 5 === 0 ? styles.qrOn : styles.qrOff} key={index} />
                ))}
              </div>
              <div className={styles.infoList}>
                <div>
                  <strong>Link expiry</strong>
                  <span>24 hours</span>
                </div>
                <div>
                  <strong>Passport</strong>
                  <span>Eligible for check-in</span>
                </div>
              </div>
              <button className={styles.primaryBlock} type="button">
                Add to passport
              </button>
            </div>
          </div>
        </Section>

        <Section
          id="dashboard"
          label="Admin screen"
          title="Admin dashboard"
          description="Admin gets a lighter console structure: slim sidebar, top metrics, recent sessions, and quick action cards."
        >
          <div className={styles.adminLayout}>
            <AdminSidebar />
            <div className={styles.adminMain}>
              <div className={styles.adminTopbar}>
                <div>
                  <span className={styles.panelEyebrow}>Overview</span>
                  <h3>Operations dashboard</h3>
                </div>
                <button className={styles.primaryBlock} type="button">
                  Create location
                </button>
              </div>
              <div className={styles.adminMetrics}>
                <MetricCard label="Sessions today" value="128" note="+14% vs yesterday" />
                <MetricCard label="Queued jobs" value="06" note="Worker healthy" />
                <MetricCard label="Passport check-ins" value="41" note="Peak around 14:00" />
                <MetricCard label="Active frames" value="04" note="1 draft pending" />
              </div>
              <div className={styles.dashboardSplit}>
                <div className={styles.tableCard}>
                  <div className={styles.panelHeaderCompact}>
                    <strong>Recent sessions</strong>
                    <span>Live activity snapshot</span>
                  </div>
                  <div className={styles.sessionList}>
                    {sessionRows.map((row) => (
                      <div className={styles.sessionRow} key={`${row.guest}-${row.time}`}>
                        <div>
                          <strong>{row.guest}</strong>
                          <span>{row.location}</span>
                        </div>
                        <span className={styles.statusTag}>{row.status}</span>
                        <span className={styles.sessionTime}>{row.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={styles.quickActions}>
                  <div className={styles.infoCard}>
                    <strong>Quick actions</strong>
                    <p>Promote the most common admin tasks so the dashboard feels useful, not decorative.</p>
                    <div className={styles.quickActionList}>
                      <button className={styles.ghostBlock} type="button">
                        Upload frame asset
                      </button>
                      <button className={styles.ghostBlock} type="button">
                        Review failed jobs
                      </button>
                      <button className={styles.ghostBlock} type="button">
                        Export daily report
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="crud"
          label="Admin screen"
          title="Admin CRUD shell"
          description="Locations, frames, and sessions share one management shell with navigation on the left, filters on top, and a form/table split on the right."
        >
          <div className={styles.adminLayout}>
            <AdminSidebar />
            <div className={styles.adminMain}>
              <div className={styles.crudTabs}>
                <button className={styles.tabActive} type="button">
                  Locations
                </button>
                <button className={styles.tab} type="button">
                  Frames
                </button>
                <button className={styles.tab} type="button">
                  Sessions
                </button>
              </div>
              <div className={styles.crudWorkspace}>
                <div className={styles.formCard}>
                  <div className={styles.panelHeaderCompact}>
                    <strong>Create or edit</strong>
                    <span>Compact form layout with clearer grouping</span>
                  </div>
                  <div className={styles.fieldStack}>
                    <label className={styles.field}>
                      <span>Location name</span>
                      <input defaultValue="Da Nang City" readOnly />
                    </label>
                    <label className={styles.field}>
                      <span>Status</span>
                      <input defaultValue="active" readOnly />
                    </label>
                    <label className={styles.field}>
                      <span>Description</span>
                      <textarea defaultValue="6-shot frame experience with auto capture and passport reward." readOnly />
                    </label>
                  </div>
                  <div className={styles.buttonRow}>
                    <button className={styles.primaryBlock} type="button">
                      Save changes
                    </button>
                    <button className={styles.ghostBlock} type="button">
                      Deactivate
                    </button>
                  </div>
                </div>

                <div className={styles.tableCard}>
                  <div className={styles.panelHeaderCompact}>
                    <strong>Locations list</strong>
                    <span>Readable rows with quick status scan</span>
                  </div>
                  <div className={styles.tableHead}>
                    <span>Name</span>
                    <span>Status</span>
                    <span>Frames</span>
                    <span>Updated</span>
                  </div>
                  <div className={styles.tableBody}>
                    {locationRows.map((row) => (
                      <div className={styles.tableRow} key={row.name}>
                        <strong>{row.name}</strong>
                        <span>{row.status}</span>
                        <span>{row.frames}</span>
                        <span>{row.updated}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </main>
  );
}