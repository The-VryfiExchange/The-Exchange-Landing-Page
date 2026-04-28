import { useEffect, useState, useRef, useCallback } from "react";

const DEFAULT_REVEAL_STAGE = 1;

const ROTATING_WORDS = ["searching", "paying", "applying"];
const TYPE_SPEED = 120;
const PAUSE_AFTER_TYPE = 1000;
const STRIKE_DURATION = 400;
const PAUSE_AFTER_STRIKE = 200;
const LOOP_DELAY = 5000;

function useRotatingWord() {
  const [wordIndex, setWordIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [phase, setPhase] = useState("typing"); // typing | pausing | striking | clearing
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
          // After staying on "applying" for 5s, restart the whole cycle
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

const revealSections = [
  {
    stage: 2,
    eyebrow: "Why it matters",
    title: "Trust should show up before the paperwork, the waiting, and the wasted time.",
    copy:
      "The VryfiExchange is building a new real estate flow where verified identity, verified income, and real fit come first. That changes what both sides feel from the very beginning.",
  },
  {
    stage: 3,
    eyebrow: "The shift",
    title:
      "The VryfiExchange flips the process: landlords receive verified, qualified tenants first, then connect with the right ones to fill the property.",
    copy:
      "Instead of weak leads, slow follow-up, and endless searching, our matching layer starts with renters who are already verified and already fit what the property needs.",
  },
  {
    stage: 4,
    eyebrow: "What powers it",
    title: "Verified income. Verified identity. Real preferences. Real fit.",
    copy:
      "Our AI agent matches renters to listings using income-to-rent fit, identity status, and actual renter preferences so the strongest connections happen earlier.",
  },
];

function RotatingWord() {
  const { displayedText, phase, isLastWord } = useRotatingWord();
  const struck = phase === "striking" || (phase === "clearing");

  return (
    <span className="rotating-word-wrapper">
      <span className={`rotating-word${struck ? " struck" : ""}${isLastWord && phase === "typing" && displayedText === "applying" ? " final" : ""}`}>
        {displayedText}
      </span>
      {!(isLastWord && displayedText.length === ROTATING_WORDS[ROTATING_WORDS.length - 1].length) && (
        <span className="typing-cursor">|</span>
      )}
    </span>
  );
}

export default function App() {
  const revealStage = DEFAULT_REVEAL_STAGE;

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

  return (
    <div className="page">
      <div className="glow" />

      <div className="shell">
        <header className="topbar">
          <div>
            <div className="eyebrow">The VryfiExchange</div>
            <div className="sub">Powered by VryfID</div>
          </div>
        </header>

        <main>
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

            <div className="pill">Coming soon</div>
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
              style={{ maxWidth: "500px", margin: "0 auto" }}
            />

            <div className="waitlist-meta">
              <p>Next reveal at 5,000 signups. Referrers get it 48 hours early.</p>
              <p>Launching in NYC, Atlanta, Nashville. Sign up wherever you are, we&apos;ll bring The Exchange to you.</p>
            </div>
          </section>

          <section className="founders">
            <div className="eyebrow">Meet our founders</div>
            <h2>Brothers building a better way to find a home.</h2>
            <div className="founders-copy">
              <p>
                Aiden is an NYU student and was trying to find an apartment last summer. He sent 10 applications, paid
                $200 in fees, and watched the place he wanted go to someone else in two hours. Gabe went through the
                same thing that fall. Same city, same broken system, same useless paperwork sent 20 times to 20
                landlords.
              </p>
              <p>
                We&apos;re brothers. We grew up around a New Jersey furniture business. With The VryfiExchange,
                there&apos;s no more applying to forty places to maybe get one.
              </p>
              <p>
                We&apos;re building it out of a 120-year-old factory in Passaic that we restored. You can come see it.
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
                  >
                    LinkedIn ↗
                  </a>
                </div>
              </div>
            </div>
          </section>

          {revealSections
            .filter((section) => revealStage >= section.stage)
            .map((section) => (
              <section
                key={section.stage}
                className={`reveal ${
                  section.stage === 2 ? "stage-2" : section.stage === 3 ? "stage-3" : "stage-4"
                }`}
              >
                <p className={`eyebrow ${section.stage === 3 ? "mint" : section.stage === 4 ? "light" : ""}`}>
                  {section.eyebrow}
                </p>
                <h2>{section.title}</h2>
                <p>{section.copy}</p>
              </section>
            ))}
        </main>
      </div>
    </div>
  );
}
