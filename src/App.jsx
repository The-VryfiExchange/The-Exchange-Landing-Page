import { useEffect, useState, useRef, useCallback } from "react";
import { usePostHog, PostHogCaptureOnViewed } from "@posthog/react";

const ROTATING_WORDS = ["searching", "paying", "being rejected", "applying"];
const TYPE_SPEED = 120;
const PAUSE_AFTER_TYPE = 1000;
const STRIKE_DURATION = 400;
const PAUSE_AFTER_STRIKE = 200;
const LOOP_DELAY = 5000;

const TABS = [
  { id: "exchange", label: "The Exchange", sub: "the renter-first marketplace" },
  { id: "operators", label: "VryfID Platform", sub: "for landlords, brokers & PMs" },
  { id: "vault", label: "VryfID Vault", sub: "for renters" },
];

/* ---------------- Rotating word hook + component ---------------- */
function useRotatingWord() {
  const [wordIndex, setWordIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [phase, setPhase] = useState("typing");
  const timerRef = useRef(null);

  const isLastWord = wordIndex === ROTATING_WORDS.length - 1;
  const currentWord = ROTATING_WORDS[wordIndex];
  const displayedText = currentWord.slice(0, charCount);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    clear();
    if (phase === "typing") {
      if (charCount < currentWord.length) {
        timerRef.current = setTimeout(() => setCharCount((c) => c + 1), TYPE_SPEED);
      } else {
        if (isLastWord) {
          timerRef.current = setTimeout(() => {
            setCharCount(0);
            setWordIndex(0);
            setPhase("typing");
          }, LOOP_DELAY);
          return;
        }
        timerRef.current = setTimeout(() => setPhase("pausing"), PAUSE_AFTER_TYPE);
      }
    } else if (phase === "pausing") {
      timerRef.current = setTimeout(() => setPhase("striking"), 0);
    } else if (phase === "striking") {
      timerRef.current = setTimeout(() => setPhase("clearing"), STRIKE_DURATION + PAUSE_AFTER_STRIKE);
    } else if (phase === "clearing") {
      setCharCount(0);
      setWordIndex((i) => i + 1);
      setPhase("typing");
    }
    return clear;
  }, [phase, charCount, currentWord, isLastWord, clear]);

  return { displayedText, phase, isLastWord };
}

function RotatingWord() {
  const { displayedText, phase, isLastWord } = useRotatingWord();
  const struck = phase === "striking" || phase === "clearing";
  return (
    <span className="rotating-word-wrapper">
      <span className={`rotating-word${struck ? " struck" : ""}`}>{displayedText}</span>
      {!(isLastWord && displayedText.length === ROTATING_WORDS[ROTATING_WORDS.length - 1].length) && (
        <span className="typing-cursor">|</span>
      )}
    </span>
  );
}

/* ---------------- Scroll reveal ---------------- */
function ScrollReveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`scroll-reveal ${visible ? "visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ---------------- Stakeholder switcher ---------------- */
const STAKEHOLDERS = [
  {
    id: "renter",
    label: "Renter",
    headline: "Apply once. Get found forever.",
    points: [
      "Get verified one time - ID, income, history, references.",
      "Stop paying $50 application fees just to be ghosted.",
      "Properties that actually fit you reach out to you.",
      "You decide who gets your application - not the other way around.",
    ],
    tag: "Game-changer for renters",
    color: "coral",
  },
  {
    id: "pm",
    label: "Property Manager",
    headline: "Lease faster with a pipeline of pre-qualified tenants.",
    points: [
      "Receive verified tenants whose budget, timing & criteria match the unit.",
      "Cut screening hours per unit - verification is already done.",
      "Reduce vacancy with warm matches the day a unit opens.",
      "Surface from the noise of mass-blast applications.",
    ],
    tag: "Game-changer for PMs",
    color: "mint",
  },
  {
    id: "broker",
    label: "Broker",
    headline: "Match real renters to real homes in minutes.",
    points: [
      "Skip back-and-forth document collection - it's pre-verified.",
      "Show owners qualified renters first, not a stack of paperwork.",
      "Close placements faster, with less compliance risk.",
      "Build a verified rolodex of renters who actually move.",
    ],
    tag: "Game-changer for brokers",
    color: "gold",
  },
  {
    id: "landlord",
    label: "Landlord",
    headline: "Choose the right tenant - without the guesswork.",
    points: [
      "Every applicant arrives identity & income verified.",
      "Filter by fit: budget, move-in date, lease length, household.",
      "Lower your risk of fraud, broken leases, and bad debt.",
      "Skip the fees of third-party tenant screeners.",
    ],
    tag: "Game-changer for landlords",
    color: "coral",
  },
];

function StakeholderSwitcher({ posthog }) {
  const [active, setActive] = useState("renter");
  const current = STAKEHOLDERS.find((s) => s.id === active);
  return (
    <div className="stakeholder">
      <div className="stakeholder-tabs" role="tablist">
        {STAKEHOLDERS.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={active === s.id}
            className={`stakeholder-tab${active === s.id ? " active" : ""}`}
            onClick={() => {
              setActive(s.id);
              posthog?.capture("stakeholder_tab_clicked", { stakeholder: s.id });
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div key={current.id} className="stakeholder-panel">
        <span className={`stakeholder-tag ${current.color}`}>{current.tag}</span>
        <h3 className="stakeholder-headline">{current.headline}</h3>
        <ul className="stakeholder-points">
          {current.points.map((p, i) => (
            <li key={i}><span className="check">✓</span>{p}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------------- Topbar with tab nav ---------------- */
function TopBar({ activeTab, setActiveTab, onCta }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <img src="/vryfid-logo.jpg" alt="VryfID" className="topbar-logo" />
        <div>
          <div className="topbar-brand">VryfID</div>
          <div className="topbar-sub">{TABS.find((t) => t.id === activeTab)?.sub}</div>
        </div>
      </div>

      <nav className="tabnav" role="tablist" aria-label="Sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={activeTab === t.id}
            className={`tabnav-btn${activeTab === t.id ? " active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <button className="button button--header" onClick={onCta}>Join waitlist</button>
    </header>
  );
}

/* ---------------- Reusable feature card ---------------- */
function FeatureCard({ icon, title, body, accent = "" }) {
  return (
    <div className={`feature-card ${accent}`}>
      <div className="feature-icon">{icon}</div>
      <div className="feature-title">{title}</div>
      <div className="feature-body">{body}</div>
    </div>
  );
}

/* ---------------- Dashboard mock (operators tab) ---------------- */
function DashboardMock() {
  return (
    <div className="dashboard-mock" aria-hidden="true">
      <div className="dashboard-bar">
        <span className="dashboard-dot red" />
        <span className="dashboard-dot yellow" />
        <span className="dashboard-dot green" />
        <span className="dashboard-title">VryfID - Operator Dashboard</span>
      </div>
      <div className="dashboard-body">
        <div className="dashboard-stats">
          <div className="stat">
            <span className="stat-label">Active applications</span>
            <span className="stat-value">24</span>
          </div>
          <div className="stat">
            <span className="stat-label">Verified this week</span>
            <span className="stat-value">142</span>
          </div>
          <div className="stat">
            <span className="stat-label">Avg time to verify</span>
            <span className="stat-value">18<span className="stat-unit">s</span></span>
          </div>
        </div>
        <div className="dashboard-table">
          <div className="dashboard-row dashboard-row--head">
            <span>Applicant</span><span>ID</span><span>Income</span><span>History</span><span>Fit</span>
          </div>
          {[
            { name: "Sarah K.",  id: "ok", income: "ok",  history: "ok",  fit: 97 },
            { name: "Marcus T.", id: "ok", income: "pend", history: "ok", fit: 88 },
            { name: "Jane D.",   id: "ok", income: "ok",  history: "ok",  fit: 94 },
            { name: "Liam R.",   id: "ok", income: "ok",  history: "pend", fit: 79 },
          ].map((r) => (
            <div className="dashboard-row" key={r.name}>
              <span className="dash-name">{r.name}</span>
              <span className={`badge ${r.id}`}>{r.id === "ok" ? "Verified" : "Pending"}</span>
              <span className={`badge ${r.income}`}>{r.income === "ok" ? "Verified" : "Pending"}</span>
              <span className={`badge ${r.history}`}>{r.history === "ok" ? "Verified" : "Pending"}</span>
              <span className="fit-score"><span className="fit-bar" style={{ width: `${r.fit}%` }} /><span>{r.fit}</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Vault mock (renters tab) ---------------- */
function VaultMock() {
  const docs = [
    { name: "Government ID", status: "Verified" },
    { name: "Proof of Income", status: "Verified" },
    { name: "Rental History", status: "Verified" },
    { name: "References", status: "Verified" },
    { name: "Pet Records", status: "Optional" },
  ];
  return (
    <div className="vault-mock" aria-hidden="true">
      <div className="vault-head">
        <div>
          <div className="vault-eyebrow">Your VryfID Vault</div>
          <div className="vault-name">Jordan Rivera</div>
        </div>
        <div className="vault-status">
          <span className="vault-dot" />
          <span>Verified & ready</span>
        </div>
      </div>
      <div className="vault-docs">
        {docs.map((d) => (
          <div key={d.name} className="vault-doc">
            <span className="vault-doc-icon">📄</span>
            <span className="vault-doc-name">{d.name}</span>
            <span className={`vault-doc-status ${d.status === "Verified" ? "ok" : "muted"}`}>{d.status}</span>
          </div>
        ))}
      </div>
      <button className="vault-share" disabled>Share with The Exchange →</button>
    </div>
  );
}

/* ---------------- VIEWS ---------------- */

function ExchangeView({ posthog, onJoinClick }) {
  return (
    <>
      <PostHogCaptureOnViewed name="hero_section_viewed" properties={{ section: "hero" }}>
        <section className="hero">
          <div className="supply-cards">
            <div className="supply-card supply-card--light">
              <span className="supply-label">Live Supply</span>
              <span className="supply-number">25,000</span>
              <span className="supply-city">units in NYC + NJ</span>
            </div>
            <div className="supply-card supply-card--dark">
              <span className="supply-label">Live Supply</span>
              <span className="supply-number">620</span>
              <span className="supply-city">units in Atlanta</span>
            </div>
          </div>

          <div className="pill">A renter-first home search experience: coming soon</div>
          <h1>
            Stop endlessly
            <span className="rotating-line"><RotatingWord />.</span>
            <span className="accent">Let the perfect home find you.</span>
          </h1>
          <p className="lead">First 1,000 renters get free access at launch.</p>

          <div
            id="getWaitlistContainer"
            data-waitlist_id="32776"
            data-widget_type="WIDGET_1"
            style={{ maxWidth: "600px", margin: "0 auto" }}
          />

          <div className="waitlist-meta">
            <p>Next reveal at 5,000 signups. Referrers get it 48 hours early.</p>
            <p>Launching in NYC, Atlanta, New Jersey. Sign up wherever you are, we&apos;ll bring The Exchange to you.</p>
          </div>
        </section>
      </PostHogCaptureOnViewed>

      {/* Problem */}
      <ScrollReveal>
        <section className="section section--problem">
          <span className="eyebrow coral">The problem</span>
          <h2 className="section-title">Listing sites weren&apos;t built to find you a home. They were built to keep you searching.</h2>
          <div className="problem-grid">
            <FeatureCard
              icon="⏱"
              title="Endless searching"
              body="You scroll listings for weeks. By the time you click apply, half are already gone."
            />
            <FeatureCard
              icon="$"
              title="Fees that stack up"
              body="$50 here, $75 there. You pay for the privilege of being ignored - over and over."
            />
            <FeatureCard
              icon="✗"
              title="Silent rejections"
              body="No reply. No reason. No idea if your income, history, or pet was the problem."
            />
            <FeatureCard
              icon="📋"
              title="Same paperwork. Again."
              body="Re-uploading the same IDs, paystubs, and references for every single listing."
            />
          </div>
        </section>
      </ScrollReveal>

      {/* The shift */}
      <ScrollReveal>
        <section className="shift-section">
          <p className="eyebrow mint">The shift</p>
          <h2 className="shift-title">
            The VryfiExchange flips the process: landlords receive verified, qualified tenants first, then connect with the right ones to fill the property.
          </h2>
        </section>
      </ScrollReveal>

      {/* Solution / What it is */}
      <ScrollReveal>
        <section className="section section--solution">
          <span className="eyebrow gold">What is The Exchange</span>
          <h2 className="section-title">A marketplace where the home finds you.</h2>
          <p className="section-lead">
            Get verified once through VryfID. Tell us what you're looking for.
            Then sit back while real, qualified properties show up in your inbox -
            curated to your budget, your timing, your life. You approve who gets a real conversation.
          </p>
          <div className="solution-cards">
            <FeatureCard
              icon="🪪"
              title="Verified once"
              body="ID, income, history, references - verified through VryfID and yours to keep."
            />
            <FeatureCard
              icon="🎯"
              title="Matched on fit"
              body="Budget, move-in date, household, location - surfaced before either side wastes time."
            />
            <FeatureCard
              icon="📬"
              title="Inbound, not outbound"
              body="Properties reach out to you. You approve the ones worth a tour."
            />
          </div>
        </section>
      </ScrollReveal>

      {/* Stakeholder switcher */}
      <ScrollReveal>
        <section className="section section--stakeholders">
          <span className="eyebrow coral">A game-changer for everyone in the deal</span>
          <h2 className="section-title">One marketplace. Four big wins.</h2>
          <p className="section-lead">
            The Exchange isn't just better for renters - it's better for the people on the other side of the lease, too.
          </p>
          <StakeholderSwitcher posthog={posthog} />
        </section>
      </ScrollReveal>

      {/* How it works */}
      <ScrollReveal>
        <section className="section section--steps">
          <span className="eyebrow mint">How it works</span>
          <h2 className="section-title">Four steps from waitlist to keys.</h2>
          <ol className="steps">
            <li>
              <span className="step-num">01</span>
              <div>
                <div className="step-title">Get on the list</div>
                <div className="step-body">Join the waitlist. First 1,000 renters get verified free at launch.</div>
              </div>
            </li>
            <li>
              <span className="step-num">02</span>
              <div>
                <div className="step-title">Get verified once</div>
                <div className="step-body">Identity, income, history, references - handled in minutes inside VryfID.</div>
              </div>
            </li>
            <li>
              <span className="step-num">03</span>
              <div>
                <div className="step-title">Get matched, not ghosted</div>
                <div className="step-body">Real properties that fit your criteria reach out. You decide who gets a tour.</div>
              </div>
            </li>
            <li>
              <span className="step-num">04</span>
              <div>
                <div className="step-title">Get the keys</div>
                <div className="step-body">Sign with a landlord who already wants you. Move in faster, with less stress.</div>
              </div>
            </li>
          </ol>
        </section>
      </ScrollReveal>

      {/* CTA */}
      <ScrollReveal>
        <div className="cta-wrapper">
          <section className="cta-section">
            <h2 className="cta-title">
              Renters sign up. Get verified once.
              <span className="accent"> Apartments will come to you. Then, you, the renter, approves the best ones.</span>
            </h2>
            <p className="cta-sub">
              No more endless searching. No more repeating yourself. No more wondering if a place is even worth the effort.
            </p>
            <button className="button" onClick={onJoinClick}>Join the waitlist →</button>
          </section>
        </div>
      </ScrollReveal>

      {/* Founders */}
      <ScrollReveal>
        <section className="founders">
          <div className="eyebrow">Meet our founders</div>
          <h2>Brothers building a better way to find a home.</h2>
          <div className="founders-copy">
            <p>
              Aiden was trying to find an apartment last summer. He sent application after application, paid fees,
              and still watched the place he wanted go to someone else in hours. Gabe went through the same
              thing soon after. Same city. Same broken process. Same paperwork sent over and over again.
            </p>
            <p>
              We&apos;re brothers, and we&apos;re building The VryfiExchange so renters can get verified once, actually be
              matched on fit, and stop starting from zero every time they want a real shot at a home.
            </p>
          </div>

          <div className="founder-grid">
            <div className="founder-card">
              <img className="founder-avatar" src="/founders/gabe-einhorn.png" alt="Gabe Einhorn" />
              <div>
                <div className="founder-name">Gabe Einhorn</div>
                <div className="founder-role">Co-Founder, VryfID</div>
                <a
                  className="founder-meta"
                  href="https://linkedin.com/in/gabe-einhorn-55b74822b"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => posthog?.capture("founder_linkedin_clicked", { founder_name: "Gabe Einhorn" })}
                >
                  LinkedIn ↗
                </a>
              </div>
            </div>

            <div className="founder-card">
              <img className="founder-avatar" src="/founders/aiden-einhorn.png" alt="Aiden Einhorn" />
              <div>
                <div className="founder-name">Aiden Einhorn</div>
                <div className="founder-role">Co-Founder, VryfID</div>
                <a
                  className="founder-meta"
                  href="https://linkedin.com/in/aiden-einhorn-370095292"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => posthog?.capture("founder_linkedin_clicked", { founder_name: "Aiden Einhorn" })}
                >
                  LinkedIn ↗
                </a>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </>
  );
}

function OperatorsView({ onJoinClick }) {
  return (
    <>
      <section className="hero hero--secondary">
        <div className="pill">VryfID Platform - for landlords, brokers & PMs</div>
        <h1 className="hero-h1-secondary">
          Verify renters up front.
          <span className="accent"> Kill fraud before it costs you a unit.</span>
        </h1>
        <p className="lead">
          One operator dashboard for identity, income, history, and fit - plus direct access to a
          verified renter pipeline through The Exchange.
        </p>
        <div className="hero-ctas">
          <button className="button" onClick={onJoinClick}>Request early access</button>
        </div>
      </section>

      <ScrollReveal>
        <section className="section section--problem">
          <span className="eyebrow coral">Why this matters</span>
          <h2 className="section-title">Rental fraud isn&apos;t a fringe risk anymore.</h2>
          <div className="stat-row">
            <div className="big-stat">
              <span className="big-stat-num">1 in 8</span>
              <span className="big-stat-label">Rental applications contain falsified information</span>
            </div>
            <div className="big-stat">
              <span className="big-stat-num">$10K+</span>
              <span className="big-stat-label">Average loss per fraudulent lease (rent, damages, eviction)</span>
            </div>
            <div className="big-stat">
              <span className="big-stat-num">3–6 wks</span>
              <span className="big-stat-label">Lost to manual screening before a unit is filled</span>
            </div>
          </div>
          <p className="section-lead small">
            Fake paystubs, AI-edited IDs, identity stitches - the bar for fraud has dropped. VryfID raises the bar back.
          </p>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="section section--dashboard">
          <div className="dashboard-layout">
            <div>
              <span className="eyebrow mint">The operator dashboard</span>
              <h2 className="section-title">Run every application from one place.</h2>
              <ul className="check-list">
                <li><span className="check">✓</span>Verify identity and income, run background checks, and pull credit reports.</li>
                <li><span className="check">✓</span>Everything in one dashboard - no more tab-juggling between vendors.</li>
                <li><span className="check">✓</span>Skip the PDF review. Get the real, structured data behind every applicant.</li>
                <li><span className="check">✓</span>Send, track, and close applications without a chain of emails.</li>
              </ul>
            </div>
            <DashboardMock />
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="section section--solution">
          <span className="eyebrow gold">Plus: a verified renter pipeline that drives NOI</span>
          <h2 className="section-title">Your dashboard is your door into The Exchange.</h2>
          <p className="section-lead">
            Operators on VryfID get direct access to The Exchange - a marketplace of renters
            matched on fit (budget, move-in date, household, lease length) and qualification (verified
            income-to-rent, credit score, background). All sourced, matched, and ranked by AI agents.
            The result: millions in NOI you're currently leaving on the table.
          </p>
          <div className="solution-cards">
            <FeatureCard
              icon="🛡"
              title="Higher occupancy"
              body="Fill units that sit vacant by matching them with verified, qualified renters who are ready to move. Every day a unit sits empty is lost rent."
            />
            <FeatureCard
              icon="⚡"
              title="Faster turns"
              body="Cut days-on-market by matching warm renters the moment a unit opens. Faster fills recover rent that would otherwise disappear."
            />
            <FeatureCard
              icon="💸"
              title="Lower operating costs"
              body="Spend less on advertising, leasing labor, and concessions. One platform replaces a stack of vendors and manual work."
            />
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <div className="cta-wrapper">
          <section className="cta-section">
            <h2 className="cta-title">
              Every vacant day is lost rent. Every bad tenant is lost NOI.
              <span className="accent"> The Exchange kills both.</span>
            </h2>
            <p className="cta-sub">Be one of the first operators inside the platform at launch.</p>
            <button className="button" onClick={onJoinClick}>Request early access →</button>
          </section>
        </div>
      </ScrollReveal>
    </>
  );
}

function VaultView({ onJoinClick }) {
  return (
    <>
      <section className="hero hero--secondary">
        <div className="pill">VryfID Vault - for renters</div>
        <h1 className="hero-h1-secondary">
          Get rental-ready before you even start.
          <span className="accent"> One vault. Every document. Verified.</span>
        </h1>
        <p className="lead">
          A secure home for your ID, paystubs, references, and rental history - verified once and ready
          to share the second the right place appears.
        </p>
        <div className="hero-ctas">
          <button className="button" onClick={onJoinClick}>Reserve your vault</button>
        </div>
      </section>

      <ScrollReveal>
        <section className="section section--dashboard">
          <div className="dashboard-layout dashboard-layout--reverse">
            <VaultMock />
            <div>
              <span className="eyebrow mint">Your verified self, in one place</span>
              <h2 className="section-title">Stop hunting for paperwork at 11pm.</h2>
              <ul className="check-list">
                <li><span className="check">✓</span>Upload once - ID, proof of income, rental history, references.</li>
                <li><span className="check">✓</span>Verified by VryfID, so landlords trust it instantly.</li>
                <li><span className="check">✓</span>Share with one tap - full packet or just what they asked for.</li>
                <li><span className="check">✓</span>Always yours. You control who sees what, and for how long.</li>
                <li><span className="check">✓</span>Re-verify automatically when something changes (new job, raise, move).</li>
              </ul>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="section section--solution">
          <span className="eyebrow gold">And here&apos;s the kicker</span>
          <h2 className="section-title">Your vault is your ticket into The Exchange.</h2>
          <p className="section-lead">
            Once you&apos;re verified in the Vault, you&apos;re eligible to appear in The Exchange - where landlords
            and property managers come looking for renters like you. Get prepared, get matched, get home.
          </p>
          <div className="solution-cards">
            <FeatureCard
              icon="🔒"
              title="Private by default"
              body="Your data is encrypted and shared only with the people you approve."
            />
            <FeatureCard
              icon="⚡"
              title="Apply in seconds"
              body="Skip the upload-and-pray dance. One tap and your verified packet is in their hands."
            />
            <FeatureCard
              icon="🚪"
              title="Front of the line"
              body="A verified vault unlocks The Exchange - where the homes find you."
            />
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <div className="cta-wrapper">
          <section className="cta-section">
            <h2 className="cta-title">
              Be ready before the listing goes up.
              <span className="accent"> Then let it find you.</span>
            </h2>
            <p className="cta-sub">First 1,000 renters get verified free at launch.</p>
            <button className="button" onClick={onJoinClick}>Join the waitlist →</button>
          </section>
        </div>
      </ScrollReveal>
    </>
  );
}

/* ---------------- App ---------------- */
export default function App() {
  const posthog = usePostHog();
  const [activeTab, setActiveTab] = useState("exchange");

  // Load getwaitlist widget (only need it on Exchange tab, but loading once is fine)
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://prod-waitlist-widget.s3.us-east-2.amazonaws.com/getwaitlist.min.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://prod-waitlist-widget.s3.us-east-2.amazonaws.com/getwaitlist.min.js";
    document.body.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []);

  // Capture email + redirect
  const signupEmailRef = useRef(null);
  useEffect(() => {
    const interval = setInterval(() => {
      const container = document.getElementById("getWaitlistContainer");
      if (!container) return;
      const emailInput = container.querySelector('input[type="email"]');
      if (emailInput?.value) signupEmailRef.current = emailInput.value;
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function redirectToVibes(email) {
      const params = new URLSearchParams({ ref: "exchange" });
      if (email) params.set("email", email);
      window.location.href = `https://vryfidvibes.com?${params.toString()}`;
    }
    function handleWaitlistSuccess(event) {
      const email = event.detail?.email || signupEmailRef.current || "";
      posthog?.capture("waitlist_signup_completed", { waitlist_id: "32776", email });
      if (email) posthog?.identify(email, { email });
      setTimeout(() => redirectToVibes(email), 1500);
    }
    document.addEventListener("getWaitlistSuccess", handleWaitlistSuccess);
    const observer = new MutationObserver(() => {
      const container = document.getElementById("getWaitlistContainer");
      if (!container) return;
      const text = container.innerText || "";
      if (text.toLowerCase().includes("you're on the list") || text.toLowerCase().includes("thank") || text.toLowerCase().includes("success")) {
        observer.disconnect();
        const email = signupEmailRef.current || "";
        setTimeout(() => redirectToVibes(email), 2000);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => {
      document.removeEventListener("getWaitlistSuccess", handleWaitlistSuccess);
      observer.disconnect();
    };
  }, [posthog]);

  const goToWaitlist = useCallback(() => {
    setActiveTab("exchange");
    setTimeout(() => {
      document.getElementById("getWaitlistContainer")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
    posthog?.capture("join_waitlist_clicked", { from_tab: activeTab });
  }, [activeTab, posthog]);

  const handleTabChange = (id) => {
    setActiveTab(id);
    posthog?.capture("tab_changed", { tab: id });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="page">
      <div className="glow" />
      <div className="shell">
        <TopBar activeTab={activeTab} setActiveTab={handleTabChange} onCta={goToWaitlist} />

        <main key={activeTab} className="tab-content">
          {activeTab === "exchange" && <ExchangeView posthog={posthog} onJoinClick={goToWaitlist} />}
          {activeTab === "operators" && <OperatorsView onJoinClick={goToWaitlist} />}
          {activeTab === "vault" && <VaultView onJoinClick={goToWaitlist} />}
        </main>

        <footer className="footer">
          <div className="footer-left">
            <img src="/vryfid-logo.jpg" alt="VryfID" className="footer-logo" />
            <span>© {new Date().getFullYear()} VryfID. Built by brothers.</span>
          </div>
          <div className="footer-right">
            <button className="footer-link" onClick={() => handleTabChange("exchange")}>The Exchange</button>
            <button className="footer-link" onClick={() => handleTabChange("operators")}>For Operators</button>
            <button className="footer-link" onClick={() => handleTabChange("vault")}>For Renters</button>
          </div>
        </footer>
      </div>
    </div>
  );
}
