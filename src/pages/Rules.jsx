import { useMemo, useState } from 'react'
import { AlertTriangle, ChevronDown, Search, ShieldCheck, X } from 'lucide-react'
import rules from '../data/rules.json'

function RuleSection({ section, forceOpen }) {
  const [open, setOpen] = useState(section.id === '1.1')
  const isOpen = forceOpen || open

  return (
    <article className={`rule-section ${isOpen ? 'rule-section--open' : ''}`}>
      <button type="button" className="rule-toggle" onClick={() => setOpen(!open)} aria-expanded={isOpen}>
        <span className="rule-id">{section.id}</span>
        <h3>{section.title}</h3>
        <span className="rule-count">{section.rules.length} {section.rules.length === 1 ? 'rule' : 'rules'}</span>
        <ChevronDown className="rule-chevron" size={20} />
      </button>
      <div className="rule-body">
        <div>
          <ol>
            {section.rules.map((rule, index) => <li key={index}>{rule}</li>)}
          </ol>
          {section.sourceIncomplete && (
            <p className="source-note"><AlertTriangle size={16} /> The source Google Doc currently ends at this point, mid-sentence. Update rules.json once the source rule is completed.</p>
          )}
        </div>
      </div>
    </article>
  )
}

export default function Rules() {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState('all')

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return rules.categories
      .filter(category => active === 'all' || category.id === active)
      .map(category => ({
        ...category,
        sections: category.sections.filter(section =>
          !term || section.title.toLowerCase().includes(term) || section.id.includes(term) || section.rules.some(rule => rule.toLowerCase().includes(term)),
        ),
      }))
      .filter(category => category.sections.length > 0)
  }, [query, active])

  const resultCount = filtered.reduce((count, category) => count + category.sections.length, 0)

  return (
    <div id="content">
      <section className="page-hero rules-hero">
        <div className="page-hero-image" aria-hidden="true" />
        <div className="page-hero-content section-shell">
          <p className="eyebrow"><span /> The standard we share</p>
          <h1>PLAY FAIR.<br /><em>STAY TRUE.</em></h1>
          <p>Protect the scene. Respect the player. Put roleplay before winning.</p>
        </div>
      </section>

      <section className="rules-intro section-shell">
        <div className="section-index">03 / COMMUNITY RULES</div>
        <div className="rules-intro-main">
          <div className="rules-notice"><ShieldCheck size={22} /><p>{rules.notice}</p></div>
          {rules.introduction.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
      </section>

      <section className="golden section-shell">
        <span className="golden-mark">VR</span>
        <div><p className="eyebrow"><span /> Read this first</p><h2>{rules.goldenRule.title}</h2></div>
        <div>{rules.goldenRule.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
      </section>

      <section className="rules-browser section-shell">
        <div className="rules-toolbar">
          <div className="rule-tabs" role="group" aria-label="Filter rule categories">
            <button className={active === 'all' ? 'active' : ''} onClick={() => setActive('all')}>All rules</button>
            {rules.categories.map(category => (
              <button className={active === category.id ? 'active' : ''} onClick={() => setActive(category.id)} key={category.id}>{category.title.replace(' Guidelines', '')}</button>
            ))}
          </div>
          <label className="rules-search">
            <Search size={18} />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search rules..." aria-label="Search rules" />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={16} /></button>}
          </label>
        </div>

        <div className="rules-results-meta">{resultCount} {resultCount === 1 ? 'section' : 'sections'} shown</div>

        {filtered.length ? filtered.map(category => (
          <div className="rule-category" key={category.id}>
            <div className="category-heading"><span>{category.number}</span><h2>{category.title}</h2></div>
            <div className="rule-list">
              {category.sections.map(section => <RuleSection section={section} forceOpen={Boolean(query)} key={section.id} />)}
            </div>
          </div>
        )) : (
          <div className="rules-empty"><Search size={28} /><h3>No matching rules</h3><p>Try a broader word or choose another category.</p><button className="text-link" onClick={() => { setQuery(''); setActive('all') }}>Clear filters</button></div>
        )}
      </section>
    </div>
  )
}
