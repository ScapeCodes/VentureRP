import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { siteConfig } from '../config'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-cta section-shell">
        <div>
          <p className="eyebrow"><span /> Your story starts here</p>
          <h2>READY TO<br /><em>VENTURE?</em></h2>
        </div>
        <a className="circle-link" href={siteConfig.discordUrl} target="_blank" rel="noreferrer" aria-label="Join Venture Roleplay on Discord">
          <ArrowUpRight size={30} />
          <span>Join Discord</span>
        </a>
      </div>
      <div className="footer-bottom section-shell">
        <div className="brand brand--footer">
          <img src="/logo.png" alt="" />
          <span><b>VENTURE</b><small>ROLEPLAY</small></span>
        </div>
        <nav aria-label="Footer navigation">
          <Link to="/">Home</Link>
          <Link to="/join">Join us</Link>
          <Link to="/rules">Rules</Link>
        </nav>
        <p>© {new Date().getFullYear()} Venture Roleplay<br /><span>Not affiliated with Rockstar Games.</span></p>
      </div>
    </footer>
  )
}
