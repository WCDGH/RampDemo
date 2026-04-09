import { useState } from "react";

// ── RAMP DESIGN TOKENS ────────────────────────────────────────────────────────
const R = {
  green:       "#00D16C",
  greenLight:  "#E6FAF1",
  greenDark:   "#00A855",
  black:       "#0D0D0D",
  gray900:     "#111827",
  gray700:     "#374151",
  gray500:     "#6B7280",
  gray300:     "#D1D5DB",
  gray200:     "#E5E7EB",
  gray100:     "#F3F4F6",
  gray50:      "#F9FAFB",
  white:       "#FFFFFF",
  blue:        "#2563EB",
  blueLight:   "#EFF6FF",
  amber:       "#D97706",
  amberLight:  "#FFFBEB",
  red:         "#DC2626",
  redLight:    "#FEF2F2",
  purple:      "#7C3AED",
  purpleLight: "#F5F3FF",
};

const COA = [
  { id: "6000", name: "Cost of Goods Sold",              type: "COGS"      },
  { id: "6100", name: "Software & SaaS Subscriptions",   type: "OpEx"      },
  { id: "6200", name: "Professional Services",           type: "OpEx"      },
  { id: "6300", name: "Marketing & Advertising",         type: "OpEx"      },
  { id: "6400", name: "Travel & Entertainment",          type: "OpEx"      },
  { id: "6500", name: "Contractor & Freelancer Payments",type: "OpEx"      },
  { id: "6600", name: "Infrastructure & Cloud Services", type: "OpEx"      },
  { id: "6700", name: "Foreign Vendor Payments",         type: "OpEx"      },
  { id: "2100", name: "Accounts Payable - USDC",         type: "Liability" },
  { id: "1500", name: "Digital Assets - USDC",           type: "Asset"     },
];

const TXS = [
  { id:"TXN-001", vendor:"Andina Cloud Solutions",  country:"Colombia",       amount:12500, desc:"Q2 infrastructure services - Bogotá datacenter",  network:"Base",     hash:"0x4a7f...c92b", date:"2026-04-07", savings:50  },
  { id:"TXN-002", vendor:"TalentMX Staffing",       country:"Mexico",         amount:8200,  desc:"March contractor payments - engineering team",     network:"Base",     hash:"0x9c3e...f14d", date:"2026-04-06", savings:296 },
  { id:"TXN-003", vendor:"LegalMind Partners",      country:"United States",  amount:4750,  desc:"IP licensing agreement review and filing",         network:"Ethereum", hash:"0x2b8a...d77e", date:"2026-04-05", savings:25  },
  { id:"TXN-004", vendor:"Veloce Digital LTDA",     country:"Brazil",         amount:6800,  desc:"Paid media management - LATAM campaigns Q2",       network:"Base",     hash:"0x7d2c...a33f", date:"2026-04-04", savings:254 },
];

const MOCK_RESULTS = {
  "TXN-001": {
    debit_account_id:"6600", debit_account_name:"Infrastructure & Cloud Services",
    credit_account_id:"2100", credit_account_name:"Accounts Payable - USDC",
    department:"Engineering", confidence:94, confidence_label:"High",
    reasoning:"Vendor name and description both reference cloud datacenter infrastructure services in Bogotá. The phrase 'Q2 infrastructure services' combined with a Colombian tech vendor maps directly to account 6600. No ambiguity in transaction description.",
    memo_field:"USDC | Andina Cloud | 0x4a7f...c92b | 2026-04-07",
    review_required:false, review_reason:null,
    netsuite_object_type:"Journal Entry", fx_savings_dimension:"$50",
  },
  "TXN-002": {
    debit_account_id:"6500", debit_account_name:"Contractor & Freelancer Payments",
    credit_account_id:"2100", credit_account_name:"Accounts Payable - USDC",
    department:"Engineering", confidence:97, confidence_label:"High",
    reasoning:"TalentMX Staffing is a Mexican staffing agency and the description explicitly states 'contractor payments - engineering team'. Unambiguous match to account 6500. Vendor type, country, and description all perfectly aligned.",
    memo_field:"USDC | TalentMX Staffing | 0x9c3e...f14d | 2026-04-06",
    review_required:false, review_reason:null,
    netsuite_object_type:"Journal Entry", fx_savings_dimension:"$296",
  },
  "TXN-003": {
    debit_account_id:"6200", debit_account_name:"Professional Services",
    credit_account_id:"2100", credit_account_name:"Accounts Payable - USDC",
    department:"Legal", confidence:88, confidence_label:"High",
    reasoning:"LegalMind Partners is a US legal firm. Description references IP licensing review and filing — a clear legal professional services engagement. Minor confidence reduction because 'LegalMind' could theoretically be a SaaS product; description resolves this.",
    memo_field:"USDC | LegalMind Partners | 0x2b8a...d77e | 2026-04-05",
    review_required:false, review_reason:null,
    netsuite_object_type:"Journal Entry", fx_savings_dimension:"$25",
  },
  "TXN-004": {
    debit_account_id:"6300", debit_account_name:"Marketing & Advertising",
    credit_account_id:"2100", credit_account_name:"Accounts Payable - USDC",
    department:"Marketing", confidence:71, confidence_label:"Medium",
    reasoning:"Veloce Digital LTDA is a Brazilian digital agency. 'Paid media management' maps to Marketing & Advertising. Medium confidence because digital agency invoices can span Marketing (6300) or Professional Services (6200) — invoice line items needed to confirm split.",
    memo_field:"USDC | Veloce Digital | 0x7d2c...a33f | 2026-04-04",
    review_required:true, review_reason:"Digital agency fees may span Marketing (6300) or Professional Services (6200). Awaiting line-item breakdown to confirm correct GL split.",
    netsuite_object_type:"Journal Entry", fx_savings_dimension:"$254",
  },
};

// ── SHARED COMPONENTS ─────────────────────────────────────────────────────────
function Badge({ children, color = "green" }) {
  const map = {
    green:  { bg: R.greenLight,  text: R.greenDark  },
    blue:   { bg: R.blueLight,   text: R.blue       },
    amber:  { bg: R.amberLight,  text: R.amber      },
    red:    { bg: R.redLight,    text: R.red        },
    purple: { bg: R.purpleLight, text: R.purple     },
    gray:   { bg: R.gray100,     text: R.gray700    },
  };
  const s = map[color] || map.green;
  return (
    <span style={{ background: s.bg, color: s.text, borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap", display: "inline-block" }}>
      {children}
    </span>
  );
}

function Card({ children, style = {}, accent = false }) {
  return (
    <div style={{ background: R.white, border: "1px solid " + (accent ? R.green : R.gray200), borderRadius: 12, padding: 24, boxShadow: accent ? "0 0 0 3px " + R.greenLight : "0 1px 4px rgba(0,0,0,0.06)", ...style }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: R.gray500, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>{children}</div>;
}

function StatCard({ label, value, sub, color = R.green }) {
  return (
    <div style={{ background: R.gray50, border: "1px solid " + R.gray200, borderRadius: 10, padding: "14px 18px", flex: 1, minWidth: 130 }}>
      <div style={{ fontSize: 11, color: R.gray500, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: "monospace", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: R.gray500, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: R.gray200, margin: "20px 0" }} />;
}

// ── PANEL 1: THE PROBLEM ──────────────────────────────────────────────────────
function Panel1() {
  const totalSaved = TXS.reduce((s, t) => s + t.savings, 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Persona card */}
      <Card accent>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#2563EB,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🌎</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: R.black }}>GlobalOps Inc.</span>
              <Badge color="blue">NetSuite OneWorld</Badge>
              <Badge color="purple">Enterprise</Badge>
            </div>
            <div style={{ fontSize: 14, color: R.gray500, lineHeight: 1.6 }}>
              US-based SaaS company · 3 subsidiaries in Mexico, Colombia &amp; Brazil · $32M ARR · Finance team of 6 · ~$400K/yr in cross-border vendor &amp; contractor payments
            </div>
          </div>
        </div>
      </Card>

      {/* Pain points */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px,1fr))", gap: 12 }}>
        {[
          { icon: "⏳", label: "Settlement Time", value: "5+ days", sub: "Per international wire",              color: R.red,   bg: R.redLight   },
          { icon: "💸", label: "Wire Fee / Tx",   value: "$50+",    sub: "Plus 1–3% FX spread",                color: R.amber, bg: R.amberLight },
          { icon: "📋", label: "Manual GL Work",  value: "~3 hrs",  sub: "Added per month-end close",          color: R.amber, bg: R.amberLight },
          { icon: "🏦", label: "Multi-Entity",    value: "Blocked", sub: "Stablecoin unavailable to subsidiaries", color: R.red, bg: R.redLight },
        ].map(p => (
          <div key={p.label} style={{ background: p.bg, border: "1px solid " + p.color + "30", borderRadius: 10, padding: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 20 }}>{p.icon}</span>
            <div>
              <div style={{ fontSize: 11, color: R.gray500, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{p.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: p.color, fontFamily: "monospace" }}>{p.value}</div>
              <div style={{ fontSize: 12, color: R.gray500 }}>{p.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction table */}
      <Card>
        <SectionLabel>Recent Cross-Border Transactions · This Week</SectionLabel>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid " + R.gray200 }}>
                {["Vendor","Country","USDC Amount","Wire Would Cost","Saved","Settlement"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: R.gray500, fontWeight: 600, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TXS.map((t, i) => (
                <tr key={t.id} style={{ borderBottom: "1px solid " + R.gray100, background: i % 2 === 0 ? R.white : R.gray50 }}>
                  <td style={{ padding: "12px", fontWeight: 600, color: R.black }}>{t.vendor}</td>
                  <td style={{ padding: "12px", color: R.gray500 }}>{t.country}</td>
                  <td style={{ padding: "12px", fontFamily: "monospace", fontWeight: 700, color: R.green }}>${t.amount.toLocaleString()}</td>
                  <td style={{ padding: "12px", fontFamily: "monospace", color: R.red }}>${(t.amount + t.savings).toLocaleString()}</td>
                  <td style={{ padding: "12px" }}><Badge color="green">+${t.savings}</Badge></td>
                  <td style={{ padding: "12px" }}><Badge color="blue">~12 sec</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Divider />
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <StatCard label="Saved This Week"    value={"$" + totalSaved}                    sub="vs. traditional wires"      />
          <StatCard label="Projected Annual"   value={"$" + (totalSaved * 13).toLocaleString()} sub="at current payment volume" />
          <StatCard label="Avg Settlement"     value="12 sec"                               sub="vs. 5+ business days"      color={R.blue} />
        </div>
      </Card>
    </div>
  );
}

// ── PANEL 2: RAMP TODAY ───────────────────────────────────────────────────────
function Panel2() {
  const [step, setStep] = useState(0);
  const steps = [
    { title:"Fund Stablecoin Account", icon:"💰", statusLabel:"Live", statusColor:"green", detail:"GlobalOps deposits USD via ACH into Ramp's Stablecoin Account. Ramp auto-converts to USDC. Can also deposit USDC directly from an external wallet across Base, Ethereum, or Solana.", path:"Cash & Treasury → New → Stablecoin Account" },
    { title:"Pay Vendor in USDC",      icon:"📤", statusLabel:"Live", statusColor:"green", detail:"GlobalOps initiates a vendor bill. Sets invoice currency to USDC and selects the Stablecoin Account as the funding source. Payment settles on-chain in ~12 seconds. No wire fee.", path:"Bill Pay → Invoice Currency: USDC → Pay from: Stablecoin Account" },
    { title:"NetSuite Sync",           icon:"🔄", statusLabel:"Partial — Manual GL mapping required", statusColor:"amber", detail:"USDC transactions sync to NetSuite, but require manual GL account mapping under Sync Settings. Unlike USD card transactions, stablecoin payments don't auto-code. Finance team assigns GL accounts manually each close.", path:"Accounting → Settings → Sync Settings → Treasury" },
    { title:"Multi-Entity Support",    icon:"🏢", statusLabel:"Gap — Primary entity only", statusColor:"red",   detail:"GlobalOps has 3 subsidiaries in NetSuite OneWorld. Stablecoin Accounts are restricted to the primary US entity. Mexican and Colombian subsidiaries cannot transact in USDC — the biggest gap for cross-border workflows.", path:"Cash & Treasury → Stablecoin Account [Primary entity only]" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <SectionLabel>Ramp Stablecoin Flow · Current State</SectionLabel>

        {/* Step tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid " + R.gray200, overflowX: "auto" }}>
          {steps.map((s, i) => (
            <button key={i} onClick={() => setStep(i)} style={{ background: "none", border: "none", borderBottom: "2px solid " + (step === i ? R.green : "transparent"), padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: step === i ? 700 : 500, color: step === i ? R.black : R.gray500, whiteSpace: "nowrap", transition: "all 0.15s", fontFamily: "inherit" }}>
              {s.icon} {s.title}
            </button>
          ))}
        </div>

        {/* Step detail */}
        <div style={{ background: R.gray50, border: "1px solid " + R.gray200, borderRadius: 10, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 26 }}>{steps[step].icon}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: R.black, marginBottom: 4 }}>{steps[step].title}</div>
              <Badge color={steps[step].statusColor}>{steps[step].statusLabel}</Badge>
            </div>
          </div>
          <p style={{ fontSize: 14, color: R.gray700, lineHeight: 1.7, margin: "0 0 14px 0" }}>{steps[step].detail}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: R.gray500, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Ramp UI path:</span>
            <code style={{ fontSize: 12, background: R.white, color: R.green, padding: "3px 10px", borderRadius: 6, border: "1px solid " + R.gray200, fontWeight: 600 }}>{steps[step].path}</code>
          </div>
        </div>
      </Card>

      <Card>
        <SectionLabel>Product Gaps Identified in Discovery</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { gap:"AI GL Auto-Coding for USDC",       detail:"Card transactions auto-code via Ramp's AI. Stablecoin payments require manual mapping every close." },
            { gap:"Multi-Entity Stablecoin Accounts",  detail:"Primary entity only. NetSuite OneWorld subsidiaries cannot hold or transact USDC through Ramp." },
            { gap:"FX Savings Reporting in NetSuite",  detail:"No GL dimension capturing 'amount saved vs. wire' — savings are invisible to management reporting." },
            { gap:"Vendor USDC Enrollment Flow",       detail:"No self-serve portal for vendors to opt into receiving USDC payments, slowing adoption." },
          ].map(g => (
            <div key={g.gap} style={{ display: "flex", gap: 12, padding: "12px 14px", background: R.redLight, borderRadius: 8, border: "1px solid #FCA5A520", alignItems: "flex-start" }}>
              <span style={{ color: R.red, fontSize: 15, marginTop: 1, flexShrink: 0 }}>✕</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: R.black }}>{g.gap}</div>
                <div style={{ fontSize: 13, color: R.gray500 }}>{g.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── PANEL 3: AI GL DEMO ───────────────────────────────────────────────────────
function Panel3() {
  const [selectedTx, setSelectedTx] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);

  const runGL = (tx) => {
    setSelectedTx(tx);
    setLoading(true);
    setResult(null);
    setTimeout(() => { setResult(MOCK_RESULTS[tx.id]); setLoading(false); }, 1800);
  };

  const confColor = (c) => c >= 80 ? "green" : c >= 60 ? "amber" : "red";
  const confHex   = (c) => c >= 80 ? R.green : c >= 60 ? R.amber : R.red;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Agent explainer */}
      <Card accent>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: R.greenLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🤖</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: R.black, marginBottom: 4 }}>AI GL Classification Agent</div>
            <div style={{ fontSize: 14, color: R.gray500, lineHeight: 1.6, maxWidth: 620 }}>
              Proposed addition to Ramp's existing AP AI agent pipeline. Reads USDC transaction metadata, cross-references the customer's live NetSuite Chart of Accounts, and returns a structured journal entry recommendation with confidence scoring. Low-confidence results route to the existing exception review queue — no new UI required.
            </div>
          </div>
        </div>
      </Card>

      {/* Transaction picker */}
      <Card>
        <SectionLabel>Step 1 — Select a USDC transaction to classify</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {TXS.map(tx => (
            <button key={tx.id} onClick={() => runGL(tx)} disabled={loading}
              style={{ background: selectedTx && selectedTx.id === tx.id ? R.greenLight : R.gray50, border: "1px solid " + (selectedTx && selectedTx.id === tx.id ? R.green : R.gray200), borderRadius: 10, padding: "14px 16px", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left", transition: "all 0.15s", width: "100%", opacity: loading ? 0.6 : 1 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: R.greenLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>💳</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: R.black }}>{tx.vendor}</div>
                <div style={{ fontSize: 12, color: R.gray500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.desc}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: R.green, fontFamily: "monospace" }}>${tx.amount.toLocaleString()} USDC</div>
                <div style={{ fontSize: 11, color: R.gray500 }}>{tx.country} · {tx.network}</div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Loading */}
      {loading && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid " + R.gray200, borderTop: "3px solid " + R.green, animation: "ramp-spin 0.8s linear infinite", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: R.black }}>AI GL Agent running...</div>
              <div style={{ fontSize: 12, color: R.gray500 }}>Reading NetSuite COA · Analyzing vendor context · Generating recommendation</div>
            </div>
          </div>
          <style>{"@keyframes ramp-spin { to { transform: rotate(360deg); } }"}</style>
        </Card>
      )}

      {/* Result */}
      {result && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Confidence header */}
          <Card accent={result.confidence >= 80}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              {/* Donut */}
              <div style={{ position: "relative", width: 60, height: 60, flexShrink: 0 }}>
                <svg width="60" height="60" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="24" fill="none" stroke={R.gray200} strokeWidth="6" />
                  <circle cx="30" cy="30" r="24" fill="none" stroke={confHex(result.confidence)} strokeWidth="6"
                    strokeDasharray={`${result.confidence * 1.508} 150.8`}
                    strokeLinecap="round" transform="rotate(-90 30 30)" />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: confHex(result.confidence) }}>
                  {result.confidence}%
                </div>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: R.black }}>GL Coding Recommendation</span>
                  <Badge color={confColor(result.confidence)}>{result.confidence_label} Confidence</Badge>
                </div>
                <div style={{ fontSize: 13, color: R.gray500 }}>
                  {result.review_required
                    ? "⚠ Routed to review queue — " + result.review_reason
                    : "✓ Ready to auto-post to NetSuite"}
                </div>
              </div>
            </div>
          </Card>

          {/* Journal entry */}
          <Card>
            <SectionLabel>NetSuite Journal Entry · {result.netsuite_object_type}</SectionLabel>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid " + R.gray200 }}>
                    {["Type","Account ID","Account Name","Debit","Credit"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: R.gray500, fontWeight: 600, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid " + R.gray100, background: R.redLight + "60" }}>
                    <td style={{ padding: 12 }}><Badge color="red">DEBIT</Badge></td>
                    <td style={{ padding: 12, fontFamily: "monospace", color: R.black, fontWeight: 600 }}>{result.debit_account_id}</td>
                    <td style={{ padding: 12, color: R.black, fontWeight: 600 }}>{result.debit_account_name}</td>
                    <td style={{ padding: 12, fontFamily: "monospace", fontWeight: 700, color: R.red }}>${selectedTx && selectedTx.amount.toLocaleString()}</td>
                    <td style={{ padding: 12, color: R.gray300 }}>—</td>
                  </tr>
                  <tr style={{ background: R.greenLight + "60" }}>
                    <td style={{ padding: 12 }}><Badge color="green">CREDIT</Badge></td>
                    <td style={{ padding: 12, fontFamily: "monospace", color: R.black, fontWeight: 600 }}>{result.credit_account_id}</td>
                    <td style={{ padding: 12, color: R.black, fontWeight: 600 }}>{result.credit_account_name}</td>
                    <td style={{ padding: 12, color: R.gray300 }}>—</td>
                    <td style={{ padding: 12, fontFamily: "monospace", fontWeight: 700, color: R.green }}>${selectedTx && selectedTx.amount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Divider />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { label: "Department",           value: result.department         },
                { label: "FX Savings Dimension", value: result.fx_savings_dimension },
                { label: "Memo Field",           value: result.memo_field, mono: true },
              ].map(d => (
                <div key={d.label} style={{ flex: 1, minWidth: 150, background: R.gray50, border: "1px solid " + R.gray200, borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 10, color: R.gray500, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{d.label}</div>
                  <div style={{ fontSize: 12, color: R.black, fontFamily: d.mono ? "monospace" : "inherit", fontWeight: 500 }}>{d.value}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Reasoning */}
          <Card>
            <SectionLabel>Agent Reasoning</SectionLabel>
            <div style={{ fontSize: 14, color: R.gray700, lineHeight: 1.7, padding: "12px 16px", background: R.gray50, borderRadius: 8, borderLeft: "3px solid " + R.green }}>
              {result.reasoning}
            </div>
          </Card>

          {/* Pipeline */}
          <Card>
            <SectionLabel>What Happens Next</SectionLabel>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 0, flexWrap: "nowrap", overflowX: "auto" }}>
              {[
                { icon:"🤖", label:"AI Agent",     detail:"Codes transaction",              done:true,                      warn:false                   },
                { icon:"📋", label:result.review_required?"Review Queue":"Auto-Post", detail:result.review_required?"Flagged for human review":"Skips queue", done:true, warn:result.review_required },
                { icon:"🔄", label:"NetSuite Sync",detail:"Journal Entry posted",           done:!result.review_required,   warn:false                   },
                { icon:"📊", label:"Reporting",    detail:"FX savings captured",            done:!result.review_required,   warn:false                   },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 110 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1, padding: "0 6px" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: s.done ? (s.warn ? R.amberLight : R.greenLight) : R.gray100, border: "1px solid " + (s.done ? (s.warn ? R.amber : R.green) : R.gray200), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: s.done ? R.black : R.gray400, textAlign: "center" }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: R.gray500, textAlign: "center", lineHeight: 1.3 }}>{s.detail}</div>
                  </div>
                  {i < 3 && <div style={{ width: 24, height: 2, background: s.done && !s.warn ? R.green : R.gray200, flexShrink: 0, margin: "0 2px", marginBottom: 28 }} />}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── PANEL 4: ROADMAP ──────────────────────────────────────────────────────────
function Panel4() {
  const [open, setOpen] = useState(null);
  const proposals = [
    {
      id:"P1", icon:"🤖", title:"AI GL Classification Agent",     tag:"AI / Automation",   tagColor:"green",
      effort:"Medium", impact:"High",
      problem:"USDC payments skip Ramp's AI auto-coding pipeline entirely. Finance teams at customers like GlobalOps spend 3+ hours per month-end manually assigning GL accounts to stablecoin payments — erasing some of the efficiency gains Ramp is supposed to deliver.",
      solution:"Extend Ramp's existing AP AI agent pipeline with a 5th agent: the USDC GL Classifier. Reads transaction metadata and synced NetSuite COA, returns a structured journal entry with confidence score. High-confidence transactions auto-post; low-confidence route to the existing review queue. No new UI required.",
      infra:["Plugs into existing Transaction Enrichment API — USDC added as new transaction type","Reads COA from existing NetSuite sync — no new data pipeline needed","Posts to existing review queue when confidence < 75%","Adds 'USDC Payment' class to NetSuite journal entry object type"],
    },
    {
      id:"P2", icon:"🏢", title:"Multi-Entity Stablecoin Accounts", tag:"Product Expansion", tagColor:"purple",
      effort:"High", impact:"Very High",
      problem:"Stablecoin Accounts are restricted to primary entities only. Every NetSuite OneWorld enterprise customer — Ramp's highest-value segment — is blocked from using stablecoins for subsidiary payments, which is exactly the highest-pain cross-border use case.",
      solution:"Extend the Stablecoin Account model to support entity-level wallets mapped to NetSuite subsidiaries. Each subsidiary gets its own USDC wallet, AP account, and currency mapping. Approval workflows apply at the subsidiary level — mirroring how multi-entity card programs already work in Ramp today.",
      infra:["Maps to existing NetSuite OneWorld entity architecture Ramp already supports","Reuses multi-entity card program framework already in production","Adds subsidiary-scoped wallet custody model","Enables entity-level FX conversion and on-chain settlement"],
    },
    {
      id:"P3", icon:"📊", title:"FX Savings Reporting Dimension",  tag:"Analytics",         tagColor:"blue",
      effort:"Low", impact:"High",
      problem:"CFOs need to quantify stablecoin ROI inside their ERP to justify adoption internally. Today there is no way to report on wire fees avoided or FX spread saved in NetSuite. The savings are real but invisible — making it hard for champions to build the business case.",
      solution:"Add a custom NetSuite dimension — USDC_FX_SAVINGS — auto-populated on every stablecoin journal entry at sync time. Value = wire fee baseline ($50) + FX spread % − actual USDC cost. Finance teams can report on cumulative savings by vendor, subsidiary, and period natively in NetSuite.",
      infra:["Custom segment via NetSuite RESTlet (already authorized in current integration)","Calculated field on journal entry line, populated at Ramp sync time","Ramp dashboard tile using existing analytics component framework","Exportable to CFO reporting suite with no additional build work"],
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <SectionLabel>SC Roadmap Proposals</SectionLabel>
        <div style={{ fontSize: 14, color: R.gray700, lineHeight: 1.6 }}>
          Three prioritized enhancements that extend Ramp's existing stablecoin infrastructure into enterprise NetSuite workflows — identified through customer discovery with GlobalOps Inc.
        </div>
      </Card>

      {proposals.map(p => (
        <Card key={p.id}>
          <button onClick={() => setOpen(open === p.id ? null : p.id)} style={{ background:"none", border:"none", cursor:"pointer", width:"100%", textAlign:"left", padding:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
              <div style={{ width:44, height:44, borderRadius:10, background: p.tagColor === "green" ? R.greenLight : p.tagColor === "purple" ? R.purpleLight : R.blueLight, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{p.icon}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
                  <span style={{ fontSize:15, fontWeight:700, color:R.black }}>{p.title}</span>
                  <Badge color={p.tagColor}>{p.tag}</Badge>
                  <Badge color="gray">Effort: {p.effort}</Badge>
                  <Badge color="green">Impact: {p.impact}</Badge>
                </div>
                <div style={{ fontSize:13, color:R.gray500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.problem.slice(0, 100)}...</div>
              </div>
              <span style={{ color:R.green, fontSize:16, flexShrink:0, fontWeight:700 }}>{open === p.id ? "▲" : "▼"}</span>
            </div>
          </button>

          {open === p.id && (
            <div style={{ marginTop:20, paddingTop:20, borderTop:"1px solid " + R.gray200 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:R.red, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6 }}>The Problem</div>
                  <div style={{ fontSize:13, color:R.gray700, lineHeight:1.7 }}>{p.problem}</div>
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:R.green, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6 }}>The Solution</div>
                  <div style={{ fontSize:13, color:R.gray700, lineHeight:1.7 }}>{p.solution}</div>
                </div>
              </div>
              <div style={{ fontSize:11, fontWeight:700, color:R.blue, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>How It Plugs Into Existing Infrastructure</div>
              {p.infra.map((item, i) => (
                <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:6 }}>
                  <span style={{ color:R.green, fontWeight:700, flexShrink:0, marginTop:1 }}>→</span>
                  <span style={{ fontSize:13, color:R.black }}>{item}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState(0);
  const tabs = [
    { label:"1. The Problem",  icon:"⚡", panel:<Panel1 /> },
    { label:"2. Ramp Today",   icon:"📦", panel:<Panel2 /> },
    { label:"3. AI GL Demo",   icon:"🤖", panel:<Panel3 /> },
    { label:"4. What I'd Build", icon:"🚀", panel:<Panel4 /> },
  ];

  return (
    <div style={{ minHeight:"100vh", background:R.gray50, fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color:R.black }}>

      {/* Top nav */}
      <div style={{ background:R.white, borderBottom:"1px solid " + R.gray200, padding:"0 24px", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap", padding:"14px 0 0" }}>

          {/* Logo lockup */}
          <div style={{ display:"flex", alignItems:"center", gap: 8 }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="28" height="28" rx="6" fill="#00D16C"/>
              <path d="M7 8h8c2.8 0 5 2.2 5 5s-2.2 5-5 5h-3l4 5H13l-4-5H9v5H7V8zm2 2v6h6c1.7 0 3-1.3 3-3s-1.3-3-3-3H9z" fill="white"/>
            </svg>
            <span style={{ fontSize:15, fontWeight:700, color:R.black, letterSpacing:"-0.01em" }}>Ramp</span>
            <span style={{ fontSize:12, color:R.gray300, margin:"0 4px" }}>|</span>
            <span style={{ fontSize:13, color:R.gray500, fontWeight:500 }}>Stablecoin Intelligence Hub</span>
          </div>

          <div style={{ marginLeft:"auto", display:"flex", gap:8, flexWrap:"wrap", paddingBottom:14 }}>
            <Badge color="green">USDC Payments</Badge>
            <Badge color="blue">NetSuite OneWorld</Badge>
            <Badge color="purple">AI GL Coding</Badge>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display:"flex", gap:0, overflowX:"auto" }}>
          {tabs.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{ background:"none", border:"none", borderBottom:"2px solid " + (tab === i ? R.green : "transparent"), color: tab === i ? R.black : R.gray500, fontFamily:"inherit", fontSize:13, fontWeight: tab === i ? 700 : 500, padding:"12px 20px", cursor:"pointer", whiteSpace:"nowrap", transition:"all 0.15s" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:920, margin:"0 auto", padding:"28px 20px 60px" }}>
        {tabs[tab].panel}
      </div>

      {/* Footer */}
      <div style={{ borderTop:"1px solid " + R.gray200, background:R.white, padding:"14px 24px", textAlign:"center", fontSize:12, color:R.gray500 }}>
        Built for Ramp Enterprise SC Interview · GlobalOps Inc. is fictional · Reflects real Ramp + NetSuite integration capabilities
      </div>
    </div>
  );
}
