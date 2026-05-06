import { useEffect, useState, useRef, useCallback } from "react";
import { usePostHog, PostHogCaptureOnViewed } from "@posthog/react";

const ROTATING_WORDS = ["searching", "paying", "being rejected", "applying"];
const TYPE_SPEED = 120;
const PAUSE_AFTER_TYPE = 1000;
const STRIKE_DURATION = 400;
const PAUSE_AFTER_STRIKE = 200;
const LOOP_DELAY = 5000;

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
      <span className={`rotating-word${struck ? " struck" : ""}`}>
        {displayedText}
      </span>
      {!(isLastWord && displayedText.length === ROTATING_WORDS[ROTATING_WORDS.length - 1].length) && (
        <span className="typing-cursor">|</span>
      )}
    </span>
  );
}

function ScrollReveal({ children, className = "" }) {
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
    <div ref={ref} className={`scroll-reveal ${visible ? "visible" : ""} ${className}`}>
      {children}
    </div>
  );
}

export default function App() {
  const posthog = usePostHog();

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

  // Redirect to Vibes after waitlist signup — registered once, no deps
  useEffect(() => {
    function handleWaitlistSuccess(event) {
      posthog?.capture("waitlist_signup_completed", {
        waitlist_id: "32776",
        email: event.detail?.email,
      });
      if (event.detail?.email) {
        posthog?.identify(event.detail.email, { email: event.detail.email });
      }
      setTimeout(() => {
        window.location.href = "https://vryfidvibes.com?ref=exchange";
      }, 1500);
    }
    document.addEventListener("getWaitlistSuccess", handleWaitlistSuccess);

    // Fallback: watch for GetWaitlist success message in the DOM
    const observer = new MutationObserver(() => {
      const container = document.getElementById("getWaitlistContainer");
      if (!container) return;
      const text = container.innerText || "";
      if (text.toLowerCase().includes("you're on the list") || text.toLowerCase().includes("thank") || text.toLowerCase().includes("success")) {
        observer.disconnect();
        setTimeout(() => {
          window.location.href = "https://vryfidvibes.com?ref=exchange";
        }, 2000);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      document.removeEventListener("getWaitlistSuccess", handleWaitlistSuccess);
      observer.disconnect();
    };
  }, []);

  const scrollToWaitlist = () => {
    document.getElementById("waitlist-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="page">
      <div className="glow" />

      <div className="shell">
        <header className="topbar">
          <div className="topbar-left">
            <img src="/vryfid-logo.jpg" alt="VryfID" className="topbar-logo" />
            <div>
              <div className="topbar-brand">The VryfiExchange</div>
              <div className="topbar-sub">For renters</div>
            </div>
          </div>
          <button className="button button--header" onClick={scrollToWaitlist}>Join waitlist</button>
        </header>

        <main>
          {/* Hero */}
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

          {/* CTA */}
          <ScrollReveal>
            <div className="cta-wrapper">
              <section className="cta-section">
                <h2 className="cta-title">
                  Sign up. Get verified once.
                  <span className="accent"> Then approve the best ones and move forward with confidence.</span>
                </h2>
                <p className="cta-sub">
                  No more endless searching. No more repeating yourself. No more wondering if a place is even worth the effort.
                </p>
              </section>
            </div>
          </ScrollReveal>

          {/* The Shift */}
          <ScrollReveal>
            <section className="shift-section">
              <p className="eyebrow mint">The shift</p>
              <h2 className="shift-title">
                The VryfiExchange flips the process: landlords receive verified, qualified tenants first, then connect with the right ones to fill the property.
              </h2>
            </section>
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
        </main>
      </div>
    </div>
  );
}
