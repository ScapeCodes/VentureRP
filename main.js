const siteConfig = {
  discordUrl: 'https://discord.gg/2UN9VwUqZH',
};

const team = [
  { name: 'Dormin', role: 'Founder', initials: 'D', bio: 'Founder & Owner of Venture Roleplay.' },
  { name: 'Jambo', role: 'Founder', initials: 'J', bio: 'Founder & Owner of Venture Roleplay.' },
  { name: 'ItzxSonar', role: 'Lead Developer', initials: 'S', bio: 'Building the systems, careers and details that make the city feel alive.' },
  { name: 'Scape', role: 'Developer', initials: 'S', bio: 'Building the systems, careers and details that make the city feel alive.' },
];

const rules = {
  notice: 'All rules are subject to change. Members are expected to keep themselves updated with the community guidelines.',
  introduction: [
    'We would like to welcome you to Venture Roleplay. Venture is built around a simple philosophy: "Immersive Storytelling & Quality Roleplay." We want to create an immersive, fun, and welcoming experience for everyone. All players are expected to follow both the wording and intent of these rules.',
    'Players may not intentionally abuse loopholes, unclear wording, bugs, game mechanics, or missing examples to avoid the purpose of a rule. Not every possible situation can be written into the rules, and staff may use reasonable judgement when dealing with situations not specifically listed.',
  ],
  goldenRule: {
    title: 'The Golden Rule',
    paragraphs: [
      'Stay in character while actively roleplaying. Do not break character to argue about rules, complain about another player, or discuss OOC information. If another player breaks a rule, stay in character, save a clip if possible, and report it afterward. Small accidental slipups happen, but intentionally or repeatedly breaking character may result in punishment.',
      'OOC communication is only acceptable when directed by staff, dealing with a serious technical issue, or during a genuine emergency.',
    ],
  },
  categories: [
    {
      id: 'community', number: '01', title: 'Community Guidelines',
      sections: [
        { id: '1.1', title: 'Communication', rules: ['English must be the primary language used during public roleplay and community communication. Short phrases in other languages are fine as long as they are not used to hide information during an active situation.', 'All players must have a working microphone that can be clearly understood.', 'Excessive microphone spam, extremely loud audio, disruptive soundboards, or intentionally poor audio quality are not allowed.'] },
        { id: '1.2', title: 'Media Content', rules: ['Players are welcome to stream and record their sessions.', 'Be mindful of what you play through your microphone or soundboard. Do not intentionally play excessively loud, inappropriate, or disruptive content.', 'Watching another player\'s stream, screen share, or recording to gain information that your character does not know is considered metagaming.'] },
        { id: '1.3', title: 'Age Requirement', rules: ['Venture Roleplay is an 18+ community. All players must be at least 18 years old.', 'Anyone found to be under the age requirement or intentionally lying about their age will receive a permanent ban.'] },
        { id: '1.4', title: 'Harassment & Conduct', rules: ['Harassment, hate speech, discrimination, sexual harassment, threats, doxxing, or sharing another player\'s private information will not be tolerated.', 'Roleplay conflict between characters is allowed. Using roleplay as an excuse to repeatedly target or harass the player behind the character is not.', 'Players are expected to treat each other respectfully outside of roleplay.'] },
        { id: '1.5', title: 'Hacking & Modded Clients', rules: ['Hacking, cheats, modded clients, third-party programs, or modifications that provide an unfair in-game advantage are prohibited.', 'Players found knowingly using cheats or unauthorized advantages will receive a permanent ban.', 'Visual or client modifications that do not provide an unfair advantage are subject to staff approval. Examples are NVE, QuantV, etc, all are fine.'] },
      ],
    },
    {
      id: 'roleplay', number: '02', title: 'Roleplay Rules',
      sections: [
        { id: '2.1', title: 'Serious Roleplay', rules: ['Venture Roleplay is a serious roleplay server, but we are not trying to perfectly simulate real life. Players are expected to stay in character, react reasonably to situations, and help create enjoyable roleplay for everyone involved.', 'Fun and chaotic situations are allowed when they still make sense within the scene. For example, taking a reasonable jump during a police chase is fine. Constantly abusing unrealistic vehicle physics simply because the game allows it would not be.', 'Roleplay should always be prioritized over winning.'] },
        { id: '2.2', title: 'Fail RP', rules: ['Fail RP is any action that ignores reasonable roleplay, the situation around your character, or realistic consequences in a way that negatively affects the scene.', 'Examples include ignoring serious injuries, performing unrealistic actions simply because game mechanics allow them, refusing to reasonably participate in a scene, constantly treating serious situations like GTA Online, or intentionally avoiding roleplay consequences.', 'If another player breaks a rule, that does not give you permission to break character or break another rule in response.'] },
        { id: '2.3', title: 'RDM — Random Deathmatch', rules: ['Random Deathmatch is attacking, seriously injuring, or killing another player without enough roleplay reason or escalation.', 'Having a disagreement with someone does not automatically give you permission to shoot them. Violence must make sense based on what happened leading up to the situation.', 'For example, someone scratching your vehicle, insulting you once, or having a small argument with you would not normally justify immediately shooting them.', 'Not every shooting requires someone to verbally announce that they are about to shoot. If there is already a clear and immediate threat to someone\'s life, violence may be reasonable.', 'Staff will consider the full context of the situation, including previous interactions, threats, escalation, time passed, and whether the response was reasonable.'] },
        { id: '2.4', title: 'VDM — Vehicle Deathmatch', rules: ['Vehicle Deathmatch is intentionally or recklessly using a vehicle as a weapon against another player without valid roleplay justification.', 'You may not intentionally run someone over simply because they are involved in a conflict with you or shooting at you.', 'Accidental collisions are not automatically considered VDM. Players should still react appropriately when an accident happens.', 'If players intentionally surround or block your vehicle with their bodies and there is no reasonable way to escape, you may use your vehicle to get away. You must make a reasonable attempt to avoid hitting people where possible.', 'You may not intentionally put yourself in a position where people block your vehicle just so you can run them over.', 'Repeatedly hitting someone, turning around to hit them again, or deliberately using a vehicle to kill people will be treated as serious VDM.'] },
        { id: '2.5', title: 'Metagaming', rules: ['Metagaming is gaining, sharing, or using information that your character did not legitimately learn through roleplay.', 'Examples include watching streams, using Discord calls or screen shares, reading stream chat, using information from another character, or having another player give you OOC information.', 'You may not have someone else gather OOC information and relay it to you. Passing metagamed information through another player does not make the information IC.', 'Information your character does not know cannot be used simply because you know it as a player.'] },
        { id: '2.6', title: 'Powergaming', rules: ['Powergaming is abusing game mechanics, unrealistic actions, or forced roleplay to give yourself an unfair advantage or control another player\'s character.', 'Examples include using an emote to hide your character during combat, abusing animations to escape restraints, forcing someone to forget information, forcing another player\'s injuries, or using /me commands to automatically decide another player\'s outcome.', 'Roleplay commands describe actions or attempts. They do not automatically control another character.', 'Players may also not knowingly abuse bugs, glitches, animations, inventory mechanics, vehicle mechanics, or other unintended game features to gain an advantage. Serious bugs should be reported instead of abused or shared.'] },
        { id: '2.7', title: 'Combat Logging', rules: ['Combat Logging is disconnecting, quitting, or intentionally causing yourself to disconnect to avoid an active roleplay situation or its consequences.', 'You do not need to be downed for this rule to apply.', 'This includes leaving to avoid combat, arrest, police pursuit, robbery, kidnapping, being searched, medical roleplay, losing items, or any other active situation.', 'We understand crashes and internet issues happen. If you disconnect during an active scene, you must make a reasonable attempt to reconnect and continue the roleplay. If possible, inform the involved players or staff that you crashed.', 'Repeated convenient disconnects may still be treated as Combat Logging.'] },
        { id: '2.8', title: 'Fear Roleplay / Valuing Your Life', rules: ['Your character must reasonably value their life and safety.', 'If you are faced with an immediate and believable threat of serious injury or death, you must react reasonably to that threat.', 'For example, if you are alone and multiple people already have guns pointed directly at you, suddenly pulling out your own weapon would normally be considered failing to value your life.', 'Fear RP is based on the situation and not simply a number of players. Staff may consider distance, weapons being aimed, available cover, whether your weapon was already drawn, ability to escape, number of attackers, and how immediate the threat was.', 'Having a weapon does not automatically mean another player must follow every demand you make.'] },
        { id: '2.9', title: 'New Life Rule', rules: ['When your character is injured, there are two states: downed and dead.', 'If your character is downed, they are still conscious and may remember what happens around them. You may not abuse the downed state to crawl around purely to gather information or gain an advantage.', 'If your character is dead, they are considered unconscious. You cannot hear, remember, or use information that happens around you while dead. You may not use your radio, phone, camera, or other methods to gather or relay information.', 'You remember everything that happened before entering the dead state, but everything after that point is considered unknown to your character.', 'If you fully respawn, you may not immediately return to, rejoin, or interfere with the same active situation that caused your death. You may not return for revenge, recover items from the scene, scout for your group, or help continue the same fight.', 'You must allow the original situation to reasonably conclude before becoming involved again.'] },
        { id: '2.10', title: 'Shitlord RP', rules: ['Venture is not a "100k or Die" server. Shootouts and violent storylines are allowed, but this is still a roleplay server.', 'Shitlord RP is behaviour focused mainly on creating constant conflict, shooting, robbing, or chaos with little meaningful roleplay behind it.', 'Examples include constantly being trigger happy over minor situations, repeatedly robbing random players with little interaction, constantly targeting police just for their equipment, or repeatedly starting situations purely because you want a shootout.', 'Robbing or fighting police is not automatically against the rules. The issue is when that becomes your main goal with little or no meaningful roleplay behind it.', 'Roleplay should come before loot, kills, or winning.'] },
        { id: '2.11', title: 'Rule of 5', rules: ['During any active confrontation, whether verbal or physical, a group may have a maximum of 5 people actively involved.', 'You may not bypass this limit by splitting into multiple groups, using allies from another group, having additional players scout, provide information, block roads, transport people, or otherwise assist the same situation.', 'If two different groups intentionally work together during the same confrontation, everyone actively assisting counts toward the same limit.', 'Players who are nearby but genuinely uninvolved do not automatically count. Once they begin helping or influencing the situation, they become part of the active group.', 'During an officially recognized war, the defending side may have up to 8 people.', 'The purpose of this rule is to limit how many people can actively assist one side of a confrontation. Players may not use technicalities to get around the limit.'] },
      ],
    },
    {
      id: 'discord', number: '03', title: 'Discord Rules',
      sections: [
        { id: '3.1', title: 'Respect', rules: ['We ask that all players be respectful to one another. We understand conflicts and differences with each other happen. But the last thing that we need is for people to bring their IC beef OOC in the discord.', 'Ultimately you need to treat others the way you want to be treated. You of course wouldn\'t want someone getting'], sourceIncomplete: true },
      ],
    },
  ],
};

const icons = {
  arrowDown: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>`,
  arrowRight: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
  arrowUpRight: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7 17 17"/><path d="M7 17 7 7 17 7"/></svg>`,
  badgeCheck: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></svg>`,
  building2: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`,
  heartPulse: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/></svg>`,
  scale: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>`,
  sparkles: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
  messageCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>`,
  send: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>`,
  userRoundCheck: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m22 21-2.5-2.5"/></svg>`,
  alertTriangle: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
  chevronDown: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`,
  search: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  shieldCheck: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>`,
  x: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
  menu: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`,
};

function initIcons() {
  document.querySelectorAll('.icon[data-icon]').forEach(el => {
    const key = el.getAttribute('data-icon');
    if (icons[key]) el.innerHTML = icons[key];
  });
}

function initNav() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  const onScroll = () => {
    if (window.scrollY > 24) navbar.classList.add('navbar--scrolled');
    else navbar.classList.remove('navbar--scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('nav-links--open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.querySelector('.icon').innerHTML = isOpen ? icons.x : icons.menu;
    });
  }
}

function renderTeam() {
  const grid = document.getElementById('team-grid');
  if (!grid) return;
  grid.innerHTML = team.map((member, index) => `
    <article class="team-card">
      <div class="team-avatar"><span>${member.initials}</span>${icons.userRoundCheck}</div>
      <small>0${index + 1} / ${member.role}</small>
      <h3>${member.name}</h3>
      <p>${member.bio}</p>
    </article>
  `).join('');
}

function renderRules() {
  const list = document.getElementById('rule-list');
  if (!list) return;
  const meta = document.getElementById('rules-meta');
  const empty = document.getElementById('rules-empty');
  const queryInput = document.getElementById('rules-query');
  const tabButtons = document.querySelectorAll('.rule-tabs button');
  let query = '';
  let active = 'all';

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function render() {
    const term = query.trim().toLowerCase();
    let resultCount = 0;
    let html = '';

    rules.categories.forEach(category => {
      if (active !== 'all' && category.id !== active) return;
      const sections = category.sections.filter(section => {
        if (!term) return true;
        return section.title.toLowerCase().includes(term) || section.id.includes(term) || section.rules.some(rule => rule.toLowerCase().includes(term));
      });
      if (sections.length === 0) return;
      resultCount += sections.length;

      html += `<div class="rule-category">
        <div class="category-heading"><span>${category.number}</span><h2>${escapeHtml(category.title)}</h2></div>
        <div class="rule-list">
          ${sections.map(section => `
            <article class="rule-section" data-id="${section.id}">
              <button type="button" class="rule-toggle" aria-expanded="false">
                <span class="rule-id">${section.id}</span>
                <h3>${escapeHtml(section.title)}</h3>
                <span class="rule-count">${section.rules.length} ${section.rules.length === 1 ? 'rule' : 'rules'}</span>
                <span class="rule-chevron">${icons.chevronDown}</span>
              </button>
              <div class="rule-body"><div>
                <ol>
                  ${section.rules.map(rule => `<li>${escapeHtml(rule)}</li>`).join('')}
                </ol>
                ${section.sourceIncomplete ? `<p class="source-note">${icons.alertTriangle} The source Google Doc currently ends at this point, mid-sentence. Update rules.json once the source rule is completed.</p>` : ''}
              </div></div>
            </article>
          `).join('')}
        </div>
      </div>`;
    });

    if (!html) {
      list.innerHTML = '';
      if (meta) meta.style.display = 'none';
      if (empty) empty.style.display = '';
    } else {
      list.innerHTML = html;
      if (meta) {
        meta.style.display = '';
        meta.textContent = resultCount + ' ' + (resultCount === 1 ? 'section' : 'sections') + ' shown';
      }
      if (empty) empty.style.display = 'none';
    }
  }

  render();

  if (queryInput) {
    queryInput.addEventListener('input', e => { query = e.target.value; render(); });
    const clearBtn = document.getElementById('rules-clear');
    if (clearBtn) clearBtn.addEventListener('click', () => { queryInput.value = ''; query = ''; render(); });
    const clearFiltersBtn = document.getElementById('rules-clear-filters');
    if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', () => { queryInput.value = ''; query = ''; active = 'all'; render(); });
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      active = btn.dataset.category;
      render();
    });
  });

  list.addEventListener('click', e => {
    const toggle = e.target.closest('.rule-toggle');
    if (!toggle) return;
    const section = toggle.closest('.rule-section');
    const body = section.querySelector('.rule-body');
    const isOpen = section.classList.toggle('rule-section--open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
}

function init() {
  initIcons();
  initNav();
  renderTeam();
  renderRules();
}

document.addEventListener('DOMContentLoaded', init);
