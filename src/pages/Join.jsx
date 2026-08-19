import { ArrowRight, Check, MessageCircle, Send, UserRoundCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import team from '../data/team.json'
import { siteConfig } from '../config'

const steps = [
  { number: '01', title: 'Join Discord', text: 'Enter the community hub and get familiar with Venture before you apply.' },
  { number: '02', title: 'Read the rules', text: 'Know the standards and make sure our style of serious roleplay is right for you.' },
  { number: '03', title: 'Apply', text: 'Open an application through Discord and tell us about the stories you want to create.' },
  { number: '04', title: 'Enter the city', text: 'Once approved, create your character and begin your Venture.' },
]

export default function Join() {
  return (
    <div id="content">
      <section className="page-hero join-hero">
        <div className="page-hero-image" aria-hidden="true" />
        <div className="page-hero-content section-shell">
          <p className="eyebrow"><span /> Allowlist applications open</p>
          <h1>FIND YOUR<br /><em>PLACE.</em></h1>
          <p>Join a mature community that cares about the person behind every character.</p>
        </div>
      </section>

      <section className="join-intro section-shell">
        <div className="section-index">02 / JOIN VENTURE</div>
        <div>
          <p className="eyebrow"><span /> Your next chapter</p>
          <h2>FOUR STEPS.<br /><em>ONE NEW STORY.</em></h2>
        </div>
        <p className="join-intro-copy">Applications are handled through Discord. It keeps everything in one place and lets our team get to know the storyteller, not just the answers on a form.</p>
      </section>

      <section className="steps section-shell">
        {steps.map((step, index) => (
          <article className="step" key={step.number}>
            <span className="step-number">{step.number}</span>
            <div><h3>{step.title}</h3><p>{step.text}</p></div>
            {index < steps.length - 1 ? <ArrowRight className="step-arrow" size={20} /> : <Check className="step-arrow" size={20} />}
          </article>
        ))}
      </section>

      <section className="discord-section section-shell">
        <div className="discord-card">
          <div className="discord-icon"><MessageCircle size={28} /></div>
          <div>
            <p className="eyebrow"><span /> Venture community</p>
            <h2>APPLICATIONS<br />LIVE ON <em>DISCORD.</em></h2>
            <p>Get announcements, application support and a first look at the people and stories shaping the city.</p>
            <a className="button" href={siteConfig.discordUrl} target="_blank" rel="noreferrer">Open Discord <Send size={17} /></a>
          </div>
          <div className="discord-checklist">
            <span><Check size={15} /> 18+ community</span>
            <span><Check size={15} /> Working microphone</span>
            <span><Check size={15} /> Story-first mindset</span>
            <span><Check size={15} /> Rules understood</span>
          </div>
        </div>
      </section>

      <section className="team section-shell">
        <div className="section-heading team-heading">
          <div>
            <p className="eyebrow"><span /> Behind the city</p>
            <h2>MEET THE<br /><em>VENTURE TEAM.</em></h2>
          </div>
          <p>A small, focused group committed to fair decisions, steady development and a community worth investing your time in.</p>
        </div>
        <div className="team-grid">
          {team.map((member, index) => (
            <article className="team-card" key={member.role}>
              <div className="team-avatar"><span>{member.initials}</span><UserRoundCheck size={20} /></div>
              <small>0{index + 1} / {member.role}</small>
              <h3>{member.name}</h3>
              <p>{member.bio}</p>
            </article>
          ))}
        </div>
        <div className="team-note"><span>Want to know what we expect?</span><Link className="text-link" to="/rules">Read the community rules <ArrowRight size={16} /></Link></div>
      </section>
    </div>
  )
}
