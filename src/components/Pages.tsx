// @ts-nocheck
/* Statické stránky (o projektu, GDPR, podmínky), patička, hlášení chyb a sdílení. */
import { useRef, useState } from 'react'
import { tr, getLang } from '../lib/i18n'
import { RACES } from '../data/races'
import { supabase } from '../lib/auth'

const EN = () => getLang() === 'en'
const H2 = { margin: '22px 0 8px', fontFamily: "'Space Grotesk', sans-serif", fontSize: 20 }
const P = { margin: '0 0 10px', fontSize: 15, lineHeight: 1.65, color: '#33373D', maxWidth: '75ch' }
const BOX = { background: '#FFFFFF', border: '1px solid #E2E0D8', borderRadius: 14, padding: '22px 22px 18px' }

export const SITE = typeof location !== 'undefined' ? location.origin : 'https://rundar-run.vercel.app'
export const raceUrl = (r) => '/zavod/' + r.id + '/'

/** Anonymní identifikátor prohlížeče – jen aby jeden člověk nemohl hlášení „nafouknout“. */
function clientId() {
  try { let c = localStorage.getItem('startovka.cid'); if (!c) { c = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('startovka.cid', c) } return c } catch { return null }
}

export async function shareRace(r, toast) {
  const url = SITE + raceUrl(r)
  const title = r.name
  try {
    if (navigator.share) { await navigator.share({ title, text: r.name + ' – ' + r.place.split(' – ')[0], url }); return }
  } catch (e) { if (e && e.name === 'AbortError') return }
  try { await navigator.clipboard.writeText(url); toast(tr('Odkaz zkopírován – vlož ho kamarádům.')) } catch { window.prompt(tr('Zkopíruj odkaz:'), url) }
}

/** Načte počty hlášení a označí / skryje problematické závody. */
export async function loadReports() {
  if (!supabase) return false
  const { data } = await supabase.from('race_report_counts').select('race_id,n').limit(5000)
  if (!data) return false
  const m = {}; data.forEach((x) => { m[x.race_id] = x.n })
  let ch = false
  RACES.forEach((r) => { const n = m[r.id] || 0; if (n !== (r.reported || 0)) { r.reported = n; ch = true } })
  return ch
}

const REASONS = [
  ['neexistuje', 'Závod neexistuje / je vymyšlený'],
  ['zruseno', 'Závod je zrušený'],
  ['termin', 'Špatné datum nebo čas'],
  ['misto', 'Špatné místo'],
  ['duplicita', 'Je tu dvakrát'],
  ['spam', 'Spam / nevhodný obsah'],
  ['jine', 'Něco jiného'],
]

export function ReportModal({ race, onClose }) {
  const [reason, setReason] = useState(race ? '' : 'zprava')
  const [note, setNote] = useState('')
  const [contact, setContact] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [done, setDone] = useState(false)
  const hp = useRef(null)
  async function send() {
    setMsg('')
    if (!reason) return setMsg(tr('Vyber, co je špatně.'))
    if (!race && note.trim().length < 5) return setMsg(tr('Napiš nám pár slov.'))
    if (hp.current && hp.current.value) { setDone(true); return }
    const LK = 'startovka.reports'; let log = []
    try { log = JSON.parse(localStorage.getItem(LK) || '[]').filter((x) => x.t > Date.now() - 864e5) } catch { /* ignore */ }
    if (race && log.some((x) => x.id === race.id)) return setMsg(tr('Tenhle závod už jsi nahlásil(a) – díky!'))
    if (log.length >= 15) return setMsg(tr('Dnes už jsi poslal(a) hodně hlášení, zkus to prosím zítra.'))
    if (!supabase) return setMsg(tr('Odesílání funguje jen na ostrém webu.'))
    setBusy(true)
    const { error } = await supabase.from('race_reports').insert({ race_id: race ? race.id : null, reason, note: note.trim().slice(0, 1000) || null, contact: contact.trim().slice(0, 200) || null, client: clientId() })
    setBusy(false)
    if (error) return setMsg(tr('Odeslání se nepovedlo: ') + error.message)
    try { localStorage.setItem(LK, JSON.stringify([...log, { id: race ? race.id : '', t: Date.now() }])) } catch { /* ignore */ }
    setDone(true)
  }
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(21,23,26,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, zIndex: 80 }}>
      <div role="dialog" aria-modal="true" aria-labelledby="repTitle" style={{ background: '#FFFFFF', borderRadius: 16, maxWidth: 460, width: '100%', padding: 22, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '94vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 id="repTitle" style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 22 }}>{race ? tr('Nahlásit chybu') : tr('Napsat nám')}</h2>
            {race && <p style={{ margin: '4px 0 0', fontSize: 14, color: '#4A4F56' }}>{race.name}</p>}
          </div>
          <button className="xbtn" onClick={onClose} aria-label={tr('Zavřít')}>✕</button>
        </div>
        {done ? (<>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>{race ? tr('Díky! Hlášení jsme dostali. Když stejný problém nahlásí víc lidí, závod se automaticky označí nebo skryje.') : tr('Díky za zprávu! Pokud jsi nechal(a) kontakt, ozveme se.')}</p>
          <button className="btn" onClick={onClose}>{tr('Zavřít')}</button>
        </>) : (<>
          {race && <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {REASONS.map(([id, l]) => <label key={id} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 15, minHeight: 34, cursor: 'pointer' }}><input type="radio" name="reason" checked={reason === id} onChange={() => setReason(id)} />{tr(l)}</label>)}
          </div>}
          <div className="fld"><label htmlFor="rnote">{race ? tr('Poznámka (nepovinné)') : tr('Zpráva')}</label><textarea id="rnote" rows={race ? 3 : 5} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder={race ? tr('Např. správné datum je 12. 4.') : tr('Nápad, chyba, žádost o odstranění údajů…')} style={{ font: '500 15px Inter, sans-serif', border: '1px solid #D9D6CC', borderRadius: 10, padding: 10, resize: 'vertical' }} /></div>
          <div className="fld"><label htmlFor="rcon">{tr('Kontakt pro odpověď (nepovinné)')}</label><input id="rcon" type="text" value={contact} onChange={(e) => setContact(e.target.value)} maxLength={200} placeholder={tr('e-mail')} autoComplete="email" /></div>
          <input ref={hp} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }} />
          {msg && <p role="alert" style={{ margin: 0, fontSize: 14, color: '#B42318' }}>{msg}</p>}
          <button className="btn" disabled={busy} onClick={send} style={{ minHeight: 46 }}>{busy ? tr('Odesílám…') : tr('Odeslat')}</button>
          <p style={{ margin: 0, fontSize: 12, color: '#5A5F66' }}>{tr('Kontakt použijeme jen k odpovědi. Víc v sekci Ochrana osobních údajů.')}</p>
        </>)}
      </div>
    </div>
  )
}

export function Footer({ go, onContact, mob }) {
  const A = (p, l) => <a href={p} onClick={(e) => { e.preventDefault(); go(p) }} style={{ color: '#4A4F56' }}>{tr(l)}</a>
  return (
    <footer style={{ borderTop: '1px solid #E2E0D8', marginTop: 8, paddingTop: 16, display: 'flex', flexWrap: 'wrap', gap: '10px 18px', fontSize: 13.5, color: '#5A5F66', paddingBottom: mob ? 8 : 0 }}>
      <span style={{ fontWeight: 600, color: '#15171A' }}>Rundar</span>
      {A('/o-projektu/', 'O projektu a zdroje dat')}
      {A('/ochrana-udaju/', 'Ochrana osobních údajů')}
      {A('/podminky/', 'Podmínky')}
      <button className="linkbtn" onClick={onContact} style={{ fontWeight: 500, fontSize: 13.5, color: '#4A4F56', textDecoration: 'underline' }}>{tr('Napsat nám')}</button>
      <span style={{ flexBasis: '100%', fontSize: 12.5 }}>{tr('Termíny se mohou změnit – před závodem vždy ověř údaje u pořadatele.')}</span>
    </footer>
  )
}

function Back({ go }) {
  return <a href="/" onClick={(e) => { e.preventDefault(); go('/') }} style={{ color: '#C2410C', fontWeight: 600, textDecoration: 'none', fontSize: 15 }}>← {tr('Zpět na závody')}</a>
}

const SRC = [
  ['https://ceskybeh.cz/terminovka/', 'Český běh – termínovka ČAS', 'Oficiální termínovka ČAS: čas startu, místo, startovné, archiv výsledků.', 'cb'],
  ['https://www.stopnito.cz/zavody', 'stopnito.cz', 'Registrace, seznam přihlášených, výsledky, GPS tracking.', 'sn'],
  ['https://www.runczech.com', 'RunCzech', 'Vlastní registrace a výsledky seriálu.', 'rc'],
  ['https://behejlesy.cz', 'Běhej lesy', 'Vlastní registrace a výsledky seriálu.', 'bl'],
  ['https://www.behej.com/terminovka', 'behej.com', 'Termínovka s mapou; u závodů web pořadatele a čas startu.', 'bj'],
  ['https://www.svetbehu.cz/terminovka/', 'SvětBěhu.cz', 'Termínovka časopisu Svět běhu.', 'sb'],
  ['https://www.bezvabeh.cz/terminovka', 'BezvaBĚH.cz', 'Termínovka a výsledky.', 'bz'],
  ['https://running.life/terminovka/cesko', 'running.life', 'Celostátní termínovka – doplňuje závody ze všech krajů. Údaje ověřuj u pořadatele.', 'rl'],
  ['https://gotrail.run/', 'gotrail.run', 'Agregátor trailů – jen pro objevování.', 'gt'],
]

export function StaticPage({ kind, go, onContact }) {
  const en = EN()
  const cnt = (p) => RACES.filter((r) => r.plat && r.plat.includes(p)).length
  let title, body
  if (kind === 'o-projektu') {
    title = en ? 'About Rundar' : 'O projektu'
    body = (<>
      <p style={P}>{en ? 'Rundar is a free calendar of running races in the Czech Republic – road, trail, uphill, obstacle and kids’ races in one place, with filters by distance, place and type, a map, results and your own race calendar.' : 'Rundar je bezplatný kalendář běžeckých závodů v Česku – silnice, traily, vrchy, překážkové i dětské běhy na jednom místě. S filtry podle vzdálenosti, místa a typu, mapou, výsledky a vlastním kalendářem.'}</p>
      <p style={P}>{en ? 'We don’t organise races or take registrations. Every race links to its organiser’s website or registration system, where you sign up and find results.' : 'Závody nepořádáme ani nevybíráme přihlášky. U každého závodu vedeme na web pořadatele nebo registrační systém, kde se přihlásíš a najdeš výsledky.'}</p>
      <h2 style={H2}>{en ? 'Where the data comes from' : 'Odkud bereme data'}</h2>
      <p style={P}>{en ? 'The calendar combines public race calendars, series and registration systems. For every race we keep where the date came from and link back to the source. Runners can add a missing race themselves (from the race website or a PDF) – those races are marked “added by a runner”.' : 'Kalendář skládá veřejné termínovky, seriály a registrační systémy. U každého závodu si pamatujeme, odkud termín máme, a odkazujeme zpět na zdroj. Chybějící závod může přidat kdokoli (z webu závodu nebo PDF propozic) – takové závody jsou označené „Přidáno běžcem“.'}</p>
      <div style={{ overflowX: 'auto' }}>
        <table className="ptab">
          <thead><tr><th>{tr('Platforma')}</th><th>{tr('Co nabízí')}</th><th>{tr('V kalendáři')}</th></tr></thead>
          <tbody>{SRC.map(([u, n, d, p]) => <tr key={p}><td><a href={u} target="_blank" rel="noopener">{tr(n)}</a></td><td>{tr(d)}</td><td>{cnt(p)}</td></tr>)}
            <tr><td>{tr('Přidáno běžci')}</td><td>{en ? 'Races added by visitors.' : 'Závody přidané návštěvníky webu.'}</td><td>{cnt('user')}</td></tr>
          </tbody>
        </table>
      </div>
      <p style={{ ...P, marginTop: 12, fontSize: 13.5, color: '#5A5F66' }}>{en ? 'Coordinates are the centre of the town, not the exact start. Travel times are estimates. Are you an operator of one of the sources and want a change, or to be removed? Write to us and we’ll sort it out quickly.' : 'Souřadnice jsou střed obce, ne přesné místo startu. Časy cesty jsou orientační. Provozujete některý ze zdrojů a chcete něco upravit nebo odebrat? Napište nám a rychle to vyřešíme.'}</p>
      <h2 style={H2}>{en ? 'Something wrong?' : 'Něco nesedí?'}</h2>
      <p style={P}>{en ? 'Every race has a “Report an error” button. When several people report the same problem, the race is flagged automatically.' : 'U každého závodu je tlačítko „Nahlásit chybu“. Když stejný problém nahlásí víc lidí, závod se automaticky označí.'}</p>
      <button className="btn" onClick={onContact}>{tr('Napsat nám')}</button>
    </>)
  } else if (kind === 'ochrana-udaju') {
    title = en ? 'Privacy policy' : 'Ochrana osobních údajů'
    body = (<>
      <p style={P}>{en ? 'We collect as little as possible. You can browse the calendar without an account and without cookies.' : 'Sbíráme co nejméně. Kalendář můžeš procházet bez účtu a bez cookies.'}</p>
      <h2 style={H2}>{en ? 'Controller' : 'Správce'}</h2>
      <p style={P}>{en ? 'Rundar is run by Jan Schulhof, a private individual. Contact: the “Contact us” form at the bottom of every page.' : 'Rundar provozuje Jan Schulhof jako fyzická osoba. Kontakt: formulář „Napsat nám“ v patičce každé stránky.'}</p>
      <h2 style={H2}>{en ? 'What we process and why' : 'Co zpracováváme a proč'}</h2>
      <ul style={{ ...P, paddingLeft: 20 }}>
        <li><b>{en ? 'Account' : 'Účet'}</b> – {en ? 'e-mail, name and the races you saved, so you can log in and keep your calendar (performance of a contract). Stored with Supabase (database and login provider).' : 'e-mail, jméno a uložené závody, abys se mohl(a) přihlásit a mít svůj kalendář (plnění smlouvy). Uloženo u Supabase (databáze a přihlašování).'}</li>
        <li><b>{en ? 'Google login' : 'Přihlášení přes Google'}</b> – {en ? 'if you use it, Google passes us your e-mail and name.' : 'pokud ho použiješ, Google nám předá tvůj e-mail a jméno.'}</li>
        <li><b>{en ? 'Added races and reports' : 'Přidané závody a hlášení'}</b> – {en ? 'what you enter; races are public. The optional contact in a report is used only to reply (legitimate interest).' : 'to, co vyplníš; závody jsou veřejné. Nepovinný kontakt v hlášení použijeme jen k odpovědi (oprávněný zájem).'}</li>
        <li><b>{en ? 'Traffic statistics' : 'Statistiky návštěvnosti'}</b> – {en ? 'Vercel Web Analytics: anonymous, no cookies, no tracking across sites.' : 'Vercel Web Analytics: anonymní, bez cookies, bez sledování napříč weby.'}</li>
        <li><b>{en ? 'Hosting and maps' : 'Hosting a mapy'}</b> – {en ? 'the site runs on Vercel; map tiles load from Mapy.cz (Seznam.cz). Like any web server, they see your IP address.' : 'web běží na Vercelu, mapové podklady se načítají z Mapy.cz (Seznam.cz). Jako každý server vidí tvou IP adresu.'}</li>
        <li><b>{en ? 'Your browser' : 'Tvůj prohlížeč'}</b> – {en ? 'your town/location, language and similar settings are stored only in your browser (localStorage), not sent to us. Location is used only after you allow it.' : 'město/poloha, jazyk a podobná nastavení se ukládají jen v tvém prohlížeči (localStorage), neposílají se nám. Poloha se zjistí jen po tvém svolení.'}</li>
      </ul>
      <h2 style={H2}>{en ? 'How long' : 'Jak dlouho'}</h2>
      <p style={P}>{en ? 'Account data until you delete the account; reports at most 2 years.' : 'Údaje účtu do zrušení účtu, hlášení nejdéle 2 roky.'}</p>
      <h2 style={H2}>{en ? 'Your rights' : 'Tvoje práva'}</h2>
      <p style={P}>{en ? 'You can ask for access, correction or deletion of your data, object to processing, and complain to the Czech Data Protection Office (uoou.gov.cz). Write to us via the form – we’ll handle it within 30 days.' : 'Můžeš požádat o přístup, opravu nebo smazání údajů, vznést námitku a stěžovat si u Úřadu pro ochranu osobních údajů (uoou.gov.cz). Napiš nám přes formulář – vyřídíme do 30 dnů.'}</p>
      <button className="btn" onClick={onContact}>{tr('Napsat nám')}</button>
    </>)
  } else {
    title = en ? 'Terms of use' : 'Podmínky používání'
    body = (<>
      <p style={P}>{en ? 'Rundar is free and informational. By using it you agree to these terms.' : 'Rundar je zdarma a má informativní charakter. Používáním webu s těmito podmínkami souhlasíš.'}</p>
      <h2 style={H2}>{en ? 'Race information' : 'Údaje o závodech'}</h2>
      <p style={P}>{en ? 'We gather races from public sources and from runners. Dates, distances and other details may change or be inaccurate – always check them with the organiser. We are not the organiser of any race and are not liable for its cancellation, changes or for damage caused by relying on the data.' : 'Závody přebíráme z veřejných zdrojů a od běžců. Termíny, tratě a další údaje se mohou změnit nebo být nepřesné – vždy je ověř u pořadatele. Nejsme pořadatelem žádného závodu a neodpovídáme za jeho zrušení, změny ani za škodu vzniklou spolehnutím na údaje.'}</p>
      <h2 style={H2}>{en ? 'Adding races and reports' : 'Přidávání závodů a hlášení'}</h2>
      <p style={P}>{en ? 'Add only real running races and true information. No advertising, spam or offensive content. We may edit, hide or delete any added content without notice. Races reported by several people may be hidden automatically.' : 'Přidávej jen skutečné běžecké závody a pravdivé údaje. Žádná reklama, spam ani urážlivý obsah. Přidaný obsah můžeme bez upozornění upravit, skrýt nebo smazat. Závody, které nahlásí víc lidí, se mohou automaticky skrýt.'}</p>
      <h2 style={H2}>{en ? 'Account' : 'Účet'}</h2>
      <p style={P}>{en ? 'Keep your password safe. You can ask us to delete your account at any time.' : 'Heslo si chraň. O zrušení účtu můžeš kdykoli požádat.'}</p>
      <h2 style={H2}>{en ? 'Sources and rights' : 'Zdroje a práva'}</h2>
      <p style={P}>{en ? 'Names of races, organisers and platforms belong to their owners. We take over only factual data (date, place, distance) and always link to the source. If you hold rights to any data and want it changed or removed, contact us.' : 'Názvy závodů, pořadatelů a platforem patří jejich vlastníkům. Přebíráme jen faktické údaje (datum, místo, trať) a vždy odkazujeme na zdroj. Pokud máte k některým údajům práva a chcete je upravit nebo odebrat, napište nám.'}</p>
      <p style={{ ...P, fontSize: 13, color: '#5A5F66' }}>{en ? 'Valid from 18 November 2026.' : 'Platné od 18. 11. 2026.'}</p>
    </>)
  }
  if (typeof document !== 'undefined') document.title = title + ' | Rundar'
  return (
    <section style={BOX}>
      <Back go={go} />
      <h1 style={{ margin: '14px 0 12px', fontFamily: "'Space Grotesk', sans-serif", fontSize: 30, letterSpacing: '-0.01em' }}>{title}</h1>
      {body}
    </section>
  )
}

export function RaceDetail({ r, go, children, nearby }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Back go={go} />
      {children}
      {nearby.length > 0 && <>
        <h2 style={{ ...H2, margin: '10px 0 0' }}>{tr('Další závody v okolí')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {nearby.map((x) => <a key={x.id} href={raceUrl(x)} onClick={(e) => { e.preventDefault(); go(raceUrl(x)) }} style={{ ...BOX, padding: '12px 16px', textDecoration: 'none', color: '#15171A', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span><b>{x.name}</b><br /><span style={{ fontSize: 13.5, color: '#5A5F66' }}>{x.place.split(' – ')[0]}</span></span>
            <span style={{ fontSize: 14, color: '#4A4F56', whiteSpace: 'nowrap' }}>{new Date(x.from + 'T12:00:00').toLocaleDateString(getLang() === 'en' ? 'en-GB' : 'cs-CZ', { day: 'numeric', month: 'short' })}</span>
          </a>)}
        </div>
      </>}
    </section>
  )
}
