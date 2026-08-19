import { ArrowDown, ArrowRight, BadgeCheck, Building2, HeartPulse, Scale, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { siteConfig } from '../config'

const pillars = [
  {
    icon: Sparkles,
    number: '01',
    title: 'Stories first',
    text: 'Every system exists to create interaction, consequence and character-led stories — never just a grind.',
  },
  {
    icon: Scale,
    number: '02',
    title: 'A living city',
    text: 'A balanced economy and connected civilian, criminal and public-service paths make every choice matter.',
  },
  {
    icon: BadgeCheck,
    number: '03',
    title: 'Quality standard',
    text: 'An 18+ allowlisted community supported by a team that values fairness, maturity and memorable roleplay.',
  },
]

export default function Home() {
  return (
    <div id="content">
      <section className="home-hero">
        <div className="hero-image" aria-hidden="true" />
        <div className="hero-grain" aria-hidden="true" />
        <div className="hero-content section-shell">
          <div className="hero-copy reveal">
            <p className="eyebrow"><span /> Serious FiveM roleplay</p>
            <h1>WRITE<br />YOUR <em>STORY.</em></h1>
            <p className="hero-lede">A city shaped by consequence, ambition and the people you meet along the way.</p>
            <div className="button-row">
              <Link className="button" to="/join">Join Venture <ArrowRight size={18} /></Link>
              <Link className="text-link" to="/rules">Read the rules <ArrowRight size={16} /></Link>
            </div>
          </div>
          <div className="hero-side-note">
            <span className="status-dot" />
            <div><small>ALLOWLIST</small><strong>Applications open</strong></div>
          </div>
          <a className="scroll-cue" href="#story"><span>Discover the city</span><ArrowDown size={17} /></a>
        </div>
      </section>

      <section className="manifesto section-shell" id="story">
        <div className="section-index">01 / THE VENTURE</div>
        <div className="manifesto-copy">
          <p className="eyebrow"><span /> More than a server</p>
          <h2>A CITY BUILT FOR<br /><em>WHAT HAPPENS NEXT.</em></h2>
          <div className="manifesto-body">
            <p>Venture is a serious roleplay community where your name means something. Build a business, answer the call, work the streets or simply find your place — the best stories are the ones nobody scripted.</p>
            <p>We give players the stage, the systems and the freedom to create moments that live beyond a single session.</p>
          </div>
        </div>
      </section>

      <section className="cinema-break">
        <div className="cinema-image" aria-hidden="true" />
        <div className="cinema-caption section-shell">
          <span>ONE CITY</span>
          <p>Thousands of possible lives.</p>
        </div>
      </section>

      <section className="experience section-shell">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><span /> The experience</p>
            <h2>YOUR CHARACTER.<br /><em>YOUR CONSEQUENCES.</em></h2>
          </div>
          <p>Venture is built around interaction — creating reasons to meet, depend on, challenge and remember one another.</p>
        </div>
        <div className="pillar-grid">
          {pillars.map(({ icon: Icon, number, title, text }) => (
            <article className="pillar-card" key={number}>
              <div className="pillar-top"><span>{number}</span><Icon size={23} strokeWidth={1.6} /></div>
              <div><h3>{title}</h3><p>{text}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="life-section">
        <div className="section-shell life-grid">
          <div className="life-title">
            <p className="eyebrow"><span /> Choose your path</p>
            <h2>LIFE IN<br /><em>VENTURE.</em></h2>
          </div>
          <div className="life-list">
            <article><HeartPulse /><span><small>01</small><b>Serve the city</b><p>Emergency services, law and public careers with purpose.</p></span></article>
            <article><Building2 /><span><small>02</small><b>Build an empire</b><p>Player-owned businesses, a living economy and real opportunity.</p></span></article>
            <article><Sparkles /><span><small>03</small><b>Make it yours</b><p>Slow-burn stories, risky choices and the freedom to surprise us.</p></span></article>
          </div>
        </div>
      </section>

      <section className="numbers section-shell" aria-label="Community highlights">
        <div><strong>18+</strong><span>Mature community</span></div>
        <div><strong>05</strong><span>Active group limit</span></div>
        <div><strong>∞</strong><span>Stories to tell</span></div>
        <a href={siteConfig.discordUrl} target="_blank" rel="noreferrer">Start yours <ArrowRight /></a>
      </section>
    </div>
  )
}
