import { useState, useEffect } from "react";

/* ── Design Tokens (Morningscore-inspired warm palette) ── */
const t = {
  bg: "#FAFBFD",
  surface: "#FFFFFF",
  surfaceAlt: "#F4F1FE",
  border: "#E8E5F0",
  borderLight: "#F0EDF8",
  brand: "#6C3CE0",
  brandDark: "#4A1FB8",
  brandLight: "#EDE7FB",
  brandGlow: "rgba(108,60,224,0.08)",
  accent: "#FF6B35",
  accentLight: "#FFF0EA",
  green: "#0FAA6C",
  greenLight: "#E8F8F0",
  yellow: "#E5A100",
  yellowLight: "#FFF8E6",
  red: "#E5334B",
  redLight: "#FDE8EB",
  text: "#1A1335",
  textSec: "#5C5775",
  textMuted: "#9B95AD",
  shadow: "0 1px 3px rgba(26,19,53,0.06), 0 1px 2px rgba(26,19,53,0.04)",
  shadowLg: "0 10px 40px rgba(26,19,53,0.08), 0 2px 8px rgba(26,19,53,0.04)",
  shadowBrand: "0 4px 20px rgba(108,60,224,0.2)",
  radius: 12,
  radiusSm: 8,
};

const font = `'Pretendard', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif`;

/* ── Shared Components ── */
const ScoreCircle = ({ score, size = 100, strokeW = 7, label }) => {
  const r = (size - strokeW * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score, 100) / 100;
  const color = score >= 75 ? t.green : score >= 50 ? t.yellow : score >= 30 ? t.accent : t.red;
  const bgColor = score >= 75 ? t.greenLight : score >= 50 ? t.yellowLight : score >= 30 ? t.accentLight : t.redLight;
  return (
    <div style={{ textAlign: "center", position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill={bgColor} stroke={t.borderLight} strokeWidth={strokeW} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeW}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
        <div style={{ fontSize: size * 0.28, fontWeight: 800, color: t.text, lineHeight: 1 }}>{score}</div>
        {size > 60 && <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>/ 100</div>}
      </div>
      {label && <div style={{ fontSize: 12, fontWeight: 600, color: t.textSec, marginTop: 8 }}>{label}</div>}
    </div>
  );
};

const Card = ({ children, style, hover, onClick }) => (
  <div onClick={onClick} style={{
    background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.radius,
    padding: 20, boxShadow: t.shadow, transition: "all 0.25s ease",
    cursor: onClick ? "pointer" : "default", ...style,
  }}>{children}</div>
);

const Tag = ({ text, color = t.brand, bg }) => (
  <span style={{
    fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 100,
    background: bg || `${color}14`, color, letterSpacing: 0.2, display: "inline-block",
  }}>{text}</span>
);

const Bar = ({ value, max = 100, color = t.brand, h = 6 }) => (
  <div style={{ background: t.borderLight, borderRadius: h, height: h, width: "100%" }}>
    <div style={{ width: `${(value/max)*100}%`, height: "100%", background: color, borderRadius: h, transition: "width 1s ease" }} />
  </div>
);

const Btn = ({ children, primary, ghost, small, onClick, style }) => (
  <button onClick={onClick} style={{
    background: primary ? t.brand : ghost ? "transparent" : t.surface,
    color: primary ? "#fff" : t.text,
    border: primary ? "none" : ghost ? "none" : `1px solid ${t.border}`,
    padding: small ? "7px 16px" : "11px 24px",
    borderRadius: t.radiusSm, fontSize: small ? 13 : 14, fontWeight: 600,
    cursor: "pointer", transition: "all 0.2s", fontFamily: font,
    boxShadow: primary ? t.shadowBrand : "none",
    ...style,
  }}>{children}</button>
);

/* ── Sidebar ── */
const Sidebar = ({ active, onNavigate }) => {
  const items = [
    { id: 4, icon: "◉", label: "대시보드" },
    { id: 5, icon: "◎", label: "상세 분석" },
    { id: 6, icon: "⚡", label: "액션 아이템" },
    { id: 7, icon: "⊞", label: "경쟁사 비교" },
    { id: 8, icon: "◫", label: "리포트" },
  ];
  return (
    <div style={{ width: 220, borderRight: `1px solid ${t.border}`, background: t.surface, padding: "20px 14px", flexShrink: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, padding: "0 8px" }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${t.brand}, ${t.accent})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 900 }}>M</div>
        <span style={{ fontSize: 16, fontWeight: 800, color: t.text }}>Findably</span>
      </div>
      {items.map(m => (
        <div key={m.id} onClick={() => onNavigate(m.id)} style={{
          display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: t.radiusSm,
          background: active === m.id ? t.brandLight : "transparent",
          color: active === m.id ? t.brand : t.textSec,
          fontSize: 14, fontWeight: active === m.id ? 700 : 500, cursor: "pointer",
          marginBottom: 2, transition: "all 0.15s",
        }}>
          <span style={{ fontSize: 16, opacity: 0.7 }}>{m.icon}</span>{m.label}
        </div>
      ))}
      <div style={{ flex: 1 }} />
      <Card style={{ padding: 14, background: t.surfaceAlt, border: "none", marginTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: t.brand, marginBottom: 4 }}>Free 플랜</div>
        <div style={{ fontSize: 11, color: t.textMuted, lineHeight: 1.5, marginBottom: 8 }}>Pro로 업그레이드하면 Schema 자동 생성을 이용할 수 있어요</div>
        <Btn primary small style={{ width: "100%", fontSize: 12 }}>업그레이드</Btn>
      </Card>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   SCREEN 0 — Landing Page
   ═══════════════════════════════════════════════════════ */
const LandingPage = ({ onNext }) => (
  <div style={{ minHeight: "100%" }}>
    {/* Navbar */}
    <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${t.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${t.brand}, ${t.accent})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15 }}>M</div>
        <span style={{ fontSize: 17, fontWeight: 800, color: t.text }}>Findably</span>
      </div>
      <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
        {["기능", "가격", "블로그", "성공 사례"].map(l => (
          <span key={l} style={{ fontSize: 14, color: t.textSec, cursor: "pointer", fontWeight: 500 }}>{l}</span>
        ))}
        <Btn small>로그인</Btn>
        <Btn primary small>무료 시작</Btn>
      </div>
    </nav>

    {/* Hero — Asymmetric layout */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center", padding: "64px 0 48px" }}>
      <div>
        <Tag text="SEO + GEO 올인원" color={t.brand} />
        <h1 style={{ fontSize: 40, fontWeight: 900, color: t.text, margin: "16px 0 14px", lineHeight: 1.2, letterSpacing: -0.5 }}>
          스타트업의 마케팅,<br />
          <span style={{ color: t.brand }}>AI가 대신</span> 해드립니다
        </h1>
        <p style={{ fontSize: 17, color: t.textSec, lineHeight: 1.7, margin: "0 0 28px", maxWidth: 420 }}>
          URL만 입력하면 30초 안에 마케팅 진단 리포트를 받아보세요.
          SEO 문제 발견부터 GEO 최적화 실행까지 자동으로.
        </p>

        {/* URL Input */}
        <div style={{
          display: "flex", background: t.surface, border: `2px solid ${t.brand}`,
          borderRadius: t.radius, padding: 5, boxShadow: t.shadowBrand, maxWidth: 460,
        }}>
          <input
            placeholder="https://your-startup.com"
            style={{ flex: 1, border: "none", outline: "none", padding: "12px 16px", fontSize: 15, color: t.text, fontFamily: font, background: "transparent" }}
          />
          <button onClick={onNext} style={{
            background: `linear-gradient(135deg, ${t.brand}, ${t.brandDark})`,
            color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px",
            fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
          }}>무료 진단 →</button>
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
          {["가입 불필요", "30초 내 결과", "완전 무료"].map(t2 => (
            <span key={t2} style={{ fontSize: 12, color: t.textMuted, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: t.green, fontSize: 14 }}>✓</span>{t2}
            </span>
          ))}
        </div>
      </div>

      {/* Hero Visual — Mini Dashboard Preview */}
      <div style={{ position: "relative" }}>
        <Card style={{ padding: 24, boxShadow: t.shadowLg, transform: "rotate(1deg)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: t.textMuted }}>마케팅 건강 점수</div>
              <div style={{ fontSize: 11, color: t.green, fontWeight: 600 }}>+12점 이번 달 ↑</div>
            </div>
            <ScoreCircle score={67} size={72} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {[
              { label: "SEO", score: 72, color: t.green },
              { label: "GEO", score: 45, color: t.accent },
              { label: "콘텐츠", score: 58, color: t.yellow },
            ].map(c => (
              <div key={c.label} style={{ textAlign: "center", padding: "10px 0", background: t.bg, borderRadius: t.radiusSm }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: c.color }}>{c.score}</div>
                <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>{c.label}</div>
              </div>
            ))}
          </div>
        </Card>
        {/* Floating card */}
        <Card style={{ position: "absolute", bottom: -20, left: -30, padding: "10px 14px", boxShadow: t.shadowLg, display: "flex", alignItems: "center", gap: 8, transform: "rotate(-2deg)" }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: t.greenLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✓</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: t.text }}>Schema 자동 적용</div>
            <div style={{ fontSize: 10, color: t.green }}>GEO 점수 +8점 달성!</div>
          </div>
        </Card>
      </div>
    </div>

    {/* How it works — 3 steps */}
    <div style={{ padding: "48px 0", borderTop: `1px solid ${t.border}` }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <Tag text="3단계로 끝" color={t.accent} />
        <h2 style={{ fontSize: 28, fontWeight: 800, color: t.text, marginTop: 12 }}>이렇게 간단합니다</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
        {[
          { step: "01", title: "URL 입력", desc: "웹사이트 주소만 입력하세요. 가입도 필요 없습니다.", color: t.brand },
          { step: "02", title: "AI가 진단", desc: "40+ 항목을 자동 분석하고 점수와 개선점을 알려드립니다.", color: t.accent },
          { step: "03", title: "자동 실행", desc: "Schema Markup 자동 생성, 메타태그 최적화안까지 한 번에.", color: t.green },
        ].map((s, i) => (
          <Card key={i} style={{ padding: 28, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -8, right: -4, fontSize: 72, fontWeight: 900, color: `${s.color}0A`, lineHeight: 1 }}>{s.step}</div>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}14`, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, marginBottom: 14 }}>{s.step}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: t.text, marginBottom: 8 }}>{s.title}</div>
            <div style={{ fontSize: 14, color: t.textSec, lineHeight: 1.6 }}>{s.desc}</div>
          </Card>
        ))}
      </div>
    </div>

    {/* Social proof */}
    <div style={{ background: t.surfaceAlt, borderRadius: t.radius, padding: "28px 36px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
      {[
        { num: "1,200+", label: "진단 완료" },
        { num: "평균 +32점", label: "점수 상승" },
        { num: "4.8 / 5", label: "만족도" },
        { num: "73%", label: "재방문율" },
      ].map((s, i) => (
        <div key={i} style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: t.brand }}>{s.num}</div>
          <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>{s.label}</div>
        </div>
      ))}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════
   SCREEN 1-2 — Onboarding
   ═══════════════════════════════════════════════════════ */
const Onboarding = ({ step, onNext }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100%", padding: "40px 0" }}>
    <div style={{ maxWidth: 500, width: "100%" }}>
      {/* Progress */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {[1,2,3].map(s => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? t.brand : t.borderLight, transition: "background 0.3s" }} />
        ))}
      </div>
      <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 28 }}>Step {step} / 3</div>

      <h2 style={{ fontSize: 26, fontWeight: 800, color: t.text, marginBottom: 6 }}>
        {step === 1 ? "기본 정보를 알려주세요" : "마케팅 현황은 어떤가요?"}
      </h2>
      <p style={{ fontSize: 14, color: t.textSec, marginBottom: 28 }}>
        {step === 1 ? "1분이면 충분합니다. AI가 맞춤 진단을 준비합니다." : "현재 상황을 알면 더 정확한 인사이트를 드릴 수 있어요."}
      </p>

      <Card style={{ padding: 24 }}>
        {step === 1 ? (
          <>
            {[
              { label: "회사명", ph: "예: 파인더블리" },
              { label: "웹사이트 URL", ph: "https://your-startup.com" },
            ].map((f, i) => (
              <div key={i} style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: t.text, display: "block", marginBottom: 6 }}>{f.label}</label>
                <input placeholder={f.ph} style={{
                  width: "100%", boxSizing: "border-box", background: t.bg, border: `1px solid ${t.border}`,
                  borderRadius: t.radiusSm, padding: "11px 14px", fontSize: 14, color: t.text, outline: "none", fontFamily: font,
                }} />
              </div>
            ))}
            <label style={{ fontSize: 13, fontWeight: 600, color: t.text, display: "block", marginBottom: 6 }}>업종</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["B2B SaaS", "D2C 커머스", "전문 서비스", "교육/EdTech", "기타"].map((o, i) => (
                <div key={i} style={{
                  padding: "8px 16px", borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  border: `1.5px solid ${i === 0 ? t.brand : t.border}`,
                  background: i === 0 ? t.brandLight : t.surface,
                  color: i === 0 ? t.brand : t.textSec,
                }}>{o}</div>
              ))}
            </div>
          </>
        ) : (
          <>
            <label style={{ fontSize: 13, fontWeight: 600, color: t.text, display: "block", marginBottom: 8 }}>현재 마케팅 활동 (복수 선택)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
              {["SEO", "블로그", "SNS", "유료광고", "이메일", "PR", "안 하고 있음"].map((o, i) => (
                <div key={i} style={{
                  padding: "8px 16px", borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  border: `1.5px solid ${i === 6 ? t.accent : t.border}`,
                  background: i === 6 ? t.accentLight : t.surface,
                  color: i === 6 ? t.accent : t.textSec,
                }}>{o}</div>
              ))}
            </div>
            <label style={{ fontSize: 13, fontWeight: 600, color: t.text, display: "block", marginBottom: 8 }}>월 마케팅 예산</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {["0원", "~50만", "~100만", "100만+"].map((o, i) => (
                <div key={i} style={{
                  padding: "10px 0", borderRadius: t.radiusSm, fontSize: 13, fontWeight: 600,
                  textAlign: "center", cursor: "pointer",
                  border: `1.5px solid ${i === 0 ? t.brand : t.border}`,
                  background: i === 0 ? t.brandLight : t.surface,
                  color: i === 0 ? t.brand : t.textSec,
                }}>{o}</div>
              ))}
            </div>
          </>
        )}
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <Btn ghost>{step > 1 ? "← 이전" : ""}</Btn>
        <Btn primary onClick={onNext}>{step === 2 ? "분석 시작 →" : "다음 →"}</Btn>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════
   SCREEN 3 — Analyzing
   ═══════════════════════════════════════════════════════ */
const Analyzing = ({ onNext }) => {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setPct(p => {
      if (p >= 100) { clearInterval(iv); setTimeout(onNext, 500); return 100; }
      return p + 1.5;
    }), 60);
    return () => clearInterval(iv);
  }, []);
  const steps = [
    "사이트 구조 크롤링", "메타 데이터 분석", "Schema Markup 점검",
    "페이지 속도 측정", "GEO 준비도 평가", "AI 인사이트 생성",
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100%" }}>
      <div style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: t.brandLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid ${t.brand}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: t.text, marginBottom: 6 }}>분석이 진행 중입니다</h2>
        <p style={{ fontSize: 14, color: t.textMuted, marginBottom: 24 }}>약 30초면 완료됩니다</p>

        <div style={{ background: t.borderLight, borderRadius: 8, height: 10, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${t.brand}, ${t.accent})`, borderRadius: 8, transition: "width 0.3s" }} />
        </div>

        <Card style={{ textAlign: "left" }}>
          {steps.map((s, i) => {
            const done = pct > (i + 1) * 16;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: i < 5 ? `1px solid ${t.borderLight}` : "none" }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
                  background: done ? t.greenLight : t.bg, color: done ? t.green : t.textMuted,
                }}>{done ? "✓" : (i + 1)}</div>
                <span style={{ fontSize: 13, color: done ? t.text : t.textMuted, fontWeight: done ? 600 : 400 }}>{s}</span>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   SCREEN 4 — Dashboard
   ═══════════════════════════════════════════════════════ */
const Dashboard = ({ nav }) => (
  <div style={{ display: "flex", minHeight: "100%" }}>
    <Sidebar active={4} onNavigate={nav} />
    <div style={{ flex: 1, padding: 28, overflow: "auto", background: t.bg }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: t.text, margin: 0 }}>마케팅 대시보드</h1>
          <p style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>example-startup.com · 분석 완료: 2분 전</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn small>↻ 재분석</Btn>
          <Btn small primary>PDF 다운로드</Btn>
        </div>
      </div>

      {/* Score Hero */}
      <Card style={{ marginBottom: 20, padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex" }}>
          <div style={{ padding: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRight: `1px solid ${t.border}`, width: 180 }}>
            <ScoreCircle score={47} size={130} />
          </div>
          <div style={{ flex: 1, padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Tag text="주의 필요" color={t.accent} />
              <span style={{ fontSize: 12, color: t.green, fontWeight: 600 }}>지난주 대비 +3점 ↑</span>
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: t.text, margin: "0 0 8px" }}>온라인에서 발견되기 어려운 상태입니다</p>
            <p style={{ fontSize: 13, color: t.textSec, lineHeight: 1.6, margin: 0 }}>
              구조화 데이터(Schema)가 없어 AI 검색엔진이 사이트를 이해하기 어렵습니다. GEO 최적화를 시작하면 가장 큰 변화를 기대할 수 있습니다.
            </p>
          </div>
        </div>
      </Card>

      {/* 5 Category Scores */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "SEO 기초", score: 58, delta: "+2" },
          { label: "콘텐츠", score: 42, delta: "+5" },
          { label: "GEO 준비도", score: 28, delta: "+1" },
          { label: "온라인 존재감", score: 55, delta: "0" },
          { label: "전환 최적화", score: 52, delta: "+4" },
        ].map((c, i) => (
          <Card key={i} style={{ textAlign: "center", padding: 16 }}>
            <ScoreCircle score={c.score} size={56} strokeW={5} />
            <div style={{ fontSize: 12, fontWeight: 700, color: t.textSec, marginTop: 10 }}>{c.label}</div>
            <div style={{ fontSize: 11, color: c.delta !== "0" ? t.green : t.textMuted, marginTop: 2 }}>
              {c.delta !== "0" ? `${c.delta}점 ↑` : "—"}
            </div>
          </Card>
        ))}
      </div>

      {/* Two Column */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Quick Wins */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: t.text }}>Quick Win</span>
            <Tag text="3개" color={t.green} />
          </div>
          {[
            { task: "FAQ Schema 추가", impact: "+5", time: "10분", auto: true },
            { task: "Meta Description 수정", impact: "+3", time: "5분", auto: true },
            { task: "AI 봇 접근 허용", impact: "+4", time: "5분", auto: false },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: `1px solid ${t.borderLight}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${t.border}` }} />
                <span style={{ fontSize: 13, color: t.text, fontWeight: 500 }}>{item.task}</span>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <Tag text={`+${item.impact}점`} color={t.green} />
                {item.auto && <Btn small primary style={{ padding: "4px 10px", fontSize: 11 }}>자동생성</Btn>}
              </div>
            </div>
          ))}
        </Card>

        {/* AI Insight */}
        <Card style={{ borderLeft: `4px solid ${t.brand}`, background: t.brandGlow }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: t.brand, marginBottom: 14 }}>AI 인사이트</div>
          <div style={{ fontSize: 13, color: t.textSec, lineHeight: 1.8 }}>
            <p style={{ margin: "0 0 10px" }}><strong style={{ color: t.text }}>가장 큰 기회:</strong> Schema Markup 적용 시 GEO 점수가 28→45점으로 상승 가능합니다.</p>
            <p style={{ margin: "0 0 10px" }}><strong style={{ color: t.text }}>경쟁사 갭:</strong> 경쟁사 A의 Schema 적용률은 80%, ChatGPT에서 3회 중 2회 인용됩니다.</p>
            <p style={{ margin: 0 }}><strong style={{ color: t.text }}>추천 액션:</strong> 오늘 FAQ Schema 추가부터 시작하세요. 10분이면 됩니다.</p>
          </div>
        </Card>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════
   SCREEN 6 — Action Items
   ═══════════════════════════════════════════════════════ */
const ActionItems = ({ nav }) => (
  <div style={{ display: "flex", minHeight: "100%" }}>
    <Sidebar active={6} onNavigate={nav} />
    <div style={{ flex: 1, padding: 28, overflow: "auto", background: t.bg }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: t.text, margin: 0 }}>액션 아이템</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Tag text="Quick Win 5" color={t.red} />
          <Tag text="계획 필요 8" color={t.yellow} />
          <Tag text="완료 3" color={t.green} />
        </div>
      </div>

      {/* Quick Win Section */}
      <div style={{ fontSize: 13, fontWeight: 700, color: t.accent, marginBottom: 10 }}>즉시 실행 (Quick Win)</div>
      {[
        { task: "FAQ Schema Markup 추가", cat: "GEO", impact: 5, time: "10분", auto: true },
        { task: "홈페이지 Meta Description 개선", cat: "SEO", impact: 3, time: "5분", auto: true },
        { task: "robots.txt AI 봇 허용 설정", cat: "GEO", impact: 4, time: "5분", auto: false },
        { task: "이미지 3개 ALT 태그 보완", cat: "SEO", impact: 2, time: "10분", auto: true },
      ].map((item, i) => (
        <Card key={i} style={{ marginBottom: 8, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${t.border}`, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{item.task}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <Tag text={item.cat} color={t.textMuted} />
                  <span style={{ fontSize: 11, color: t.textMuted }}>⏱ {item.time}</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Tag text={`+${item.impact}점`} color={t.green} />
              {item.auto && <Btn small primary style={{ fontSize: 12 }}>자동 생성</Btn>}
            </div>
          </div>
        </Card>
      ))}

      {/* Auto-generated Schema Preview */}
      <Card style={{ marginTop: 20, borderLeft: `4px solid ${t.brand}` }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 12 }}>Schema Markup 자동 생성 결과</div>
        <div style={{
          background: "#1A1335", borderRadius: t.radiusSm, padding: 16,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 12,
          color: "#A78BFA", lineHeight: 1.8, overflow: "auto",
        }}>
          <span style={{ color: "#6EE7B7" }}>{`{`}</span>{"\n"}
          {"  "}<span style={{ color: "#93C5FD" }}>"@context"</span>: <span style={{ color: "#FCA5A5" }}>"https://schema.org"</span>,{"\n"}
          {"  "}<span style={{ color: "#93C5FD" }}>"@type"</span>: <span style={{ color: "#FCA5A5" }}>"FAQPage"</span>,{"\n"}
          {"  "}<span style={{ color: "#93C5FD" }}>"mainEntity"</span>: [<span style={{ color: "#6EE7B7" }}>{`{`}</span>{"\n"}
          {"    "}<span style={{ color: "#93C5FD" }}>"@type"</span>: <span style={{ color: "#FCA5A5" }}>"Question"</span>,{"\n"}
          {"    "}<span style={{ color: "#93C5FD" }}>"name"</span>: <span style={{ color: "#FCA5A5" }}>"서비스 주요 기능은?"</span>{"\n"}
          {"  "}<span style={{ color: "#6EE7B7" }}>{`}`}</span>]{"\n"}
          <span style={{ color: "#6EE7B7" }}>{`}`}</span>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <Btn small primary>코드 복사</Btn>
          <Btn small>개발자에게 보내기</Btn>
          <Btn small>적용 가이드</Btn>
        </div>
      </Card>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════
   SCREEN 7 — Competitor
   ═══════════════════════════════════════════════════════ */
const Competitor = ({ nav }) => (
  <div style={{ display: "flex", minHeight: "100%" }}>
    <Sidebar active={7} onNavigate={nav} />
    <div style={{ flex: 1, padding: 28, overflow: "auto", background: t.bg }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: t.text, marginBottom: 24 }}>경쟁사 비교</h2>

      <Card style={{ marginBottom: 20, padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {[
            { name: "내 사이트", score: 47, highlight: true },
            { name: "경쟁사 A", score: 72 },
            { name: "경쟁사 B", score: 65 },
            { name: "경쟁사 C", score: 38 },
          ].map((c, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <ScoreCircle score={c.score} size={80} strokeW={6} />
              <div style={{ fontSize: 13, fontWeight: 700, color: c.highlight ? t.brand : t.textSec, marginTop: 10 }}>{c.name}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${t.border}` }}>
              {["카테고리", "내 사이트", "경쟁사 A", "경쟁사 B", "격차"].map((h, i) => (
                <th key={i} style={{ padding: "10px 8px", color: t.textMuted, fontWeight: 700, textAlign: i === 0 ? "left" : "center", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { cat: "SEO 기초", me: 58, a: 75, b: 68 },
              { cat: "콘텐츠", me: 42, a: 70, b: 60 },
              { cat: "GEO 준비도", me: 28, a: 78, b: 55 },
              { cat: "존재감", me: 55, a: 65, b: 70 },
              { cat: "전환", me: 52, a: 68, b: 62 },
            ].map((r, i) => {
              const gap = r.me - r.a;
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${t.borderLight}` }}>
                  <td style={{ padding: "12px 8px", fontWeight: 600, color: t.text }}>{r.cat}</td>
                  <td style={{ textAlign: "center", fontWeight: 800, color: t.brand }}>{r.me}</td>
                  <td style={{ textAlign: "center", fontWeight: 700, color: t.green }}>{r.a}</td>
                  <td style={{ textAlign: "center", fontWeight: 700, color: t.yellow }}>{r.b}</td>
                  <td style={{ textAlign: "center" }}><Tag text={`${gap}점`} color={Math.abs(gap) > 20 ? t.red : t.yellow} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ marginTop: 16, padding: 14, background: t.brandGlow, borderRadius: t.radiusSm, fontSize: 13, color: t.brand, lineHeight: 1.6 }}>
          <strong>최대 격차: GEO 준비도 (-50점)</strong> — 경쟁사 A는 Schema 80% 적용, ChatGPT에서 주요 키워드 질문 시 2/3 확률로 인용됩니다.
        </div>
      </Card>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════
   SCREEN 8 — Report
   ═══════════════════════════════════════════════════════ */
const Report = ({ nav }) => (
  <div style={{ display: "flex", minHeight: "100%" }}>
    <Sidebar active={8} onNavigate={nav} />
    <div style={{ flex: 1, padding: 28, overflow: "auto", background: t.bg }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: t.text, margin: 0 }}>주간 리포트</h2>
        <span style={{ fontSize: 13, color: t.textMuted }}>2026.03.03 — 03.10</span>
      </div>

      {/* Score Trend */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 16 }}>점수 추이 (8주)</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120 }}>
          {[32,35,38,38,40,42,44,47].map((s, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: i === 7 ? 800 : 400, color: i === 7 ? t.brand : t.textMuted }}>{s}</span>
              <div style={{
                width: "100%", borderRadius: 4, minHeight: 6,
                height: `${s * 1.1}%`,
                background: i === 7 ? `linear-gradient(180deg, ${t.brand}, ${t.brandDark})` : t.brandLight,
              }} />
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: t.green }}>+15</span>
          <span style={{ fontSize: 13, color: t.textSec, marginLeft: 8 }}>8주간 점수 상승</span>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 12 }}>이번 주 달성</div>
          {["FAQ Schema 3페이지 적용", "Meta Description 5개 수정", "블로그 1개 GEO 리라이팅"].map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", fontSize: 13, color: t.textSec }}>
              <span style={{ color: t.green, fontWeight: 700 }}>✓</span>{a}
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 12 }}>다음 주 추천</div>
          {["Product Schema 5개 상품 적용", "About 페이지 E-E-A-T 강화", "경쟁사 C 블로그 시리즈 대응"].map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", fontSize: 13, color: t.textSec }}>
              <span style={{ color: t.brand }}>→</span>{a}
            </div>
          ))}
        </Card>
      </div>

      {/* AI Citation */}
      <Card style={{ borderLeft: `4px solid ${t.brand}` }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 14 }}>AI 검색 인용 현황</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { name: "ChatGPT", cited: false },
            { name: "Gemini", cited: false },
            { name: "Perplexity", cited: true },
          ].map((p, i) => (
            <div key={i} style={{ textAlign: "center", padding: 16, background: p.cited ? t.greenLight : t.bg, borderRadius: t.radiusSm, border: `1px solid ${p.cited ? t.green : t.border}` }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 6 }}>{p.name}</div>
              <Tag text={p.cited ? "인용됨 ✓" : "미인용"} color={p.cited ? t.green : t.red} />
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13, color: t.green, fontWeight: 600, marginTop: 14, lineHeight: 1.6 }}>
          🎉 Perplexity에서 첫 인용 달성! Schema 적용 1주일 만의 성과입니다.
        </p>
      </Card>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════
   Main App
   ═══════════════════════════════════════════════════════ */
const screens = ["랜딩", "온보딩 1", "온보딩 2", "분석 중", "대시보드", "상세분석", "액션아이템", "경쟁사", "리포트"];

export default function App() {
  const [s, setS] = useState(0);
  const nav = (id) => setS(id);

  return (
    <div style={{ fontFamily: font, background: s >= 4 ? t.bg : t.surface, minHeight: "100vh", display: "flex", flexDirection: "column", color: t.text }}>
      <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.min.css" rel="stylesheet" />

      {/* Screen tabs */}
      <div style={{ background: t.surface, borderBottom: `1px solid ${t.border}`, padding: "5px 12px", display: "flex", gap: 2, overflowX: "auto", flexShrink: 0 }}>
        {screens.map((name, i) => (
          <button key={i} onClick={() => setS(i)} style={{
            background: s === i ? t.brand : "transparent", color: s === i ? "#fff" : t.textMuted,
            border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: font, whiteSpace: "nowrap",
          }}>{name}</button>
        ))}
      </div>

      <div style={{ flex: 1, padding: s >= 4 ? 0 : "0 40px", maxWidth: s >= 4 ? "none" : 960, margin: s >= 4 ? 0 : "0 auto", width: "100%", overflow: "auto" }}>
        {s === 0 && <LandingPage onNext={() => setS(1)} />}
        {s === 1 && <Onboarding step={1} onNext={() => setS(2)} />}
        {s === 2 && <Onboarding step={2} onNext={() => setS(3)} />}
        {s === 3 && <Analyzing onNext={() => setS(4)} />}
        {s === 4 && <Dashboard nav={nav} />}
        {s === 5 && <Dashboard nav={nav} />}
        {s === 6 && <ActionItems nav={nav} />}
        {s === 7 && <Competitor nav={nav} />}
        {s === 8 && <Report nav={nav} />}
      </div>
    </div>
  );
}
