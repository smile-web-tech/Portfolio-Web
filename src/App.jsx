import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import SplitType from 'split-type';
import './App.css'
import CustomCursor from './CustomCursor';
import SectionBackground from './AboutBackground';
import { usePortfolioApi, assetUrl, trackVisit } from './usePortfolioApi';
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// Content comes from the admin CMS, so treat it as untrusted: only ever link to these schemes.
const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];
function safeHref(url) {
  if (!url) return undefined;
  try {
    return SAFE_PROTOCOLS.includes(new URL(url, window.location.origin).protocol) ? url : undefined;
  } catch {
    return undefined;
  }
}

// **bold** -> <strong>. Built from React elements, never innerHTML.
function RichText({ text }) {
  return text.split('**').map((part, i) => (i % 2 === 1 ? <strong key={i} className="highlight">{part}</strong> : part));
}

const monthFormat = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const formatRange = (start, end, separator) =>
  `${monthFormat.format(new Date(start))}${separator}${end ? monthFormat.format(new Date(end)) : 'Present'}`;

const projectBtnStyle = { padding: '0.2rem 0.6rem', height: 'auto', fontSize: '0.8rem', color: '#fff', textDecoration: 'none' };
const EXTERNAL = { target: '_blank', rel: 'noopener noreferrer' };

function groupBy(items, key) {
  const groups = new Map();
  for (const item of items) groups.set(item[key], [...(groups.get(item[key]) ?? []), item]);
  return [...groups];
}

function hostPath(url) {
  try {
    const u = new URL(url);
    return u.host.replace(/^www\./, '') + u.pathname.replace(/\/$/, '');
  } catch {
    return url;
  }
}

function handleOf(url) {
  try {
    return new URL(url).pathname.replace(/^\/|\/$/g, '') || hostPath(url);
  } catch {
    return url;
  }
}

function Portfolio({ data }) {
  const { settings, projects, experience, education, skills } = data;
  const [firstName = '', ...restName] = (settings?.name ?? '').trim().split(/\s+/);
  const bioParagraphs = (settings?.bio ?? '').split(/\n\s*\n/).filter(Boolean);
  const skillGroups = groupBy(skills, 'category');

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const container = useRef();

  const downloadCV = () => {
    alert("download started!");
  }

  useGSAP(() => {

    const handleLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', handleLoad);

    const splitText = new SplitType('.split', { types: 'chars' });
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl
      .from(splitText.chars, { y: 80, opacity: 0, stagger: 0.05, duration: 0.8 })
      .from('.subtitle', { y: 30, opacity: 0, duration: 0.6 }, '-=0.5')
      .from('.contact', { y: 30, opacity: 0, duration: 0.8 }, '-=0.5')
      .from('.hero-image-wrap', { scale: 0.5, opacity: 0, duration: 1, ease: 'back.out(1.7)' }, '-=0.7')
      .from('.forwardButtonsLeft, .forwardButtonsBottom', { opacity: 0, duration: 1 }, '-=0.5');

    ScrollTrigger.create({
      start: 'top -50',
      end: 99999,
      toggleClass: { className: 'scrolled', targets: '.navbar' }
    });

    const groups = gsap.utils.toArray('.skillGroup, .workGroup');
    groups.forEach(group => {
      gsap.from(group, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        scrollTrigger: {
          trigger: group,
          start: 'top bottom',
          toggleActions: 'play none none none'
        }
      });
    });


    const cards = gsap.utils.toArray('.card, .exp-card');
    cards.forEach((card, i) => {
      gsap.from(card, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        scrollTrigger: {
          trigger: card,
          start: 'top bottom',
          toggleActions: 'play none none none'
        }
      });

      card.addEventListener('mouseenter', () => gsap.to(card, { scale: 1.02, duration: 0.3 }));
      card.addEventListener('mouseleave', () => gsap.to(card, { scale: 1, duration: 0.3 }));
    });

    const sections = gsap.utils.toArray('section');
    const navLinks = gsap.utils.toArray('.nav-links a');
    const forwardBtns = gsap.utils.toArray('.forwardBtn');

    sections.forEach(sec => {
      ScrollTrigger.create({
        trigger: sec,
        start: 'top center',
        end: 'bottom center',
        onToggle: (self) => {
          if (self.isActive) {
            navLinks.forEach(link => link.classList.remove('active'));
            const activeLink = document.querySelector(`.nav-links a[href="#${sec.id}"]`);
            if (activeLink) activeLink.classList.add('active');

            forwardBtns.forEach(btn => btn.classList.remove('activeFor'));
            const activeForwardLink = document.querySelector(`a[href="#${sec.id}"] .forwardBtn`);
            if (activeForwardLink) activeForwardLink.classList.add('activeFor');
          }
        }
      });
    });

    return () => {
      window.removeEventListener('load', handleLoad);
      if (splitText) splitText.revert();
    };

  }, { scope: container });
  const handleScrollTo = (e, id) => {
    e.preventDefault();
    setIsMenuOpen(false);

    gsap.to(window, {
      duration: 1,
      scrollTo: { y: id, offsetY: 0 },
      ease: 'power2.inOut'
    });
  };

  return (
    <div ref={container}>
      <CustomCursor />
      <nav className="navbar" id="navbar">
        <div className="container">
          <a href="#home" className="logo" onClick={(e) => handleScrollTo(e, '#home')}>{firstName}</a>
          <div
            className={`hamburger ${isMenuOpen ? "activate" : ""}`}
            id="hamburger-icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </div>

          <ul className={`nav-links ${isMenuOpen ? "activate" : ""}`} id="nav-menu">
            <li><a href="#home" onClick={(e) => handleScrollTo(e, '#home')}>Main</a></li>
            <li><a href="#about" onClick={(e) => handleScrollTo(e, '#about')}>About</a></li>
            <li><a href="#skills" onClick={(e) => handleScrollTo(e, '#skills')}>Skills</a></li>
            <li><a href="#experience" onClick={(e) => handleScrollTo(e, '#experience')}>Work Experience</a></li>
            <li><a href="#projects" onClick={(e) => handleScrollTo(e, '#projects')}>Projects</a></li>
            <li><a href="#education" onClick={(e) => handleScrollTo(e, '#education')}>Education</a></li>
            <li><a href="#contact" onClick={(e) => handleScrollTo(e, '#contact')}>Contact</a></li>
          </ul>
        </div>
      </nav>

      <section id="home" className="section">
        <div className="container hero-inner">
          <div className="hero-text">
            <p className="subtitle">Hi my name is</p>
            <br />
            {/* 'split' class drives the character animation */}
            <h1 className="title"><span className="split">{firstName.toUpperCase()}</span> {restName.join(' ').toUpperCase()}</h1>
            <div className="contact">
              {settings?.email && (
                <a href={`mailto:${settings.email}`}>
                  <button className="contactBtn">Contact me</button>
                </a>
              )}
              <br />
              {safeHref(assetUrl(settings?.resumeUrl)) && (
                <a href={safeHref(assetUrl(settings.resumeUrl))} download={`${firstName}_CV.pdf`}>
                  <button className="CVbtn">Download CV</button>
                </a>
              )}
              <div className="contactFlex"></div>
            </div>

            <div className="forwardButtonsBottom">
              <ul className="forBtnBottom">
                <a href="#home" onClick={(e) => handleScrollTo(e, '#home')}><li className="forwardBtn"></li></a>
                <a href="#about" onClick={(e) => handleScrollTo(e, '#about')}><li className="forwardBtn"></li></a>
                <a href="#skills" onClick={(e) => handleScrollTo(e, '#skills')}><li className="forwardBtn"></li></a>
              </ul>
            </div>

          </div>
          <div className="hero-image-wrap">
            <div className="image-layer">
              {settings?.heroBackgroundUrl && <img src={assetUrl(settings.heroBackgroundUrl)} alt="Background" className="background-img" />}
              {settings?.profilePicUrl && <img src={assetUrl(settings.profilePicUrl)} alt={settings?.name ?? 'Portrait'} className="foreground-img" />}
            </div>
          </div>
          <div className="forwardButtonsLeft ">
            <ul className="forBtnRight">
              <a href="#projects" onClick={(e) => handleScrollTo(e, '#projects')}><li className="forwardBtn"></li></a>
              <a href="#experience" onClick={(e) => handleScrollTo(e, '#experience')}><li className="forwardBtn"></li></a>
              <a href="#contact" onClick={(e) => handleScrollTo(e, '#contact')}><li className="forwardBtn"></li></a>
            </ul>
          </div>
        </div>

      </section>

      <section id="about" className="section about">
        <SectionBackground />
        <div className="container about-inner">
          {settings?.aboutImageUrl && (
            <div className="about-image-wrap">
              <img src={assetUrl(settings.aboutImageUrl)} alt="Me at work" />
            </div>
          )}
          <div className="about-text">
            <h2 className="subtitle">About Me</h2>
            {bioParagraphs.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </div>
      </section>

      <section id="skills" className="skills section ">
        <SectionBackground variant="right" showOrbs />
        <div className="container">
          <div className="skill-title">
            <h2 >Skills</h2>
          </div>
          <div className="skillsContainer grid">
            {skillGroups.map(([category, items]) => (
              <div className="skillGroup" key={category}>
                <h2 className="skillTitle">{category}</h2>
                <div className="generalSkills">
                  {items.map((skill) => (
                    <div className="singleSkill" key={skill.id}>
                      {skill.iconUrl && <img src={assetUrl(skill.iconUrl)} alt="" className="techLogo" loading="lazy" />}
                      <span>{skill.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="experience" className="section experience">
        <SectionBackground variant="left" showOrbs />
        <div className="container projectTitle">
          <h2>Work Experience</h2>
          <div className="workGroup">
            {experience.map((job) => (
              <div className="role-card" key={job.id}>
                <div className="role-header">
                  {job.logoUrl && <img src={assetUrl(job.logoUrl)} alt={job.company} className="companyLogo" />}
                  <div className="company-info">
                    <h3 className="workCompany">{job.company}</h3>
                    {job.location && <span className="workLocation">{job.location}</span>}
                  </div>
                </div>
                <div className="role">
                  <h4 className="workTitle">{job.role}</h4>
                  <span className="workDate">{formatRange(job.startDate, job.endDate, ' - ')}</span>
                  {job.details.map((block, i) => (
                    <div className="project" style={i > 0 ? { marginTop: '1.5rem' } : undefined} key={i}>
                      {block.title && (safeHref(block.url)
                        ? <a href={block.url} {...EXTERNAL} className="projectLink"><h4 className="workTitle">{block.title}</h4></a>
                        : <h4 className="workTitle">{block.title}</h4>)}
                      <ul className="workResponsibilities">
                        {block.bullets.map((bullet, j) => <li key={j}><RichText text={bullet} /></li>)}
                      </ul>
                      {i === 0 && job.showProgress && <DevProgress />}
                    </div>
                  ))}
                  {job.details.length === 0 && job.showProgress && <div className="project"><DevProgress /></div>}
                </div>
              </div>
            ))}
          </div>
        </div>


      </section>

      <section id="projects" className="section projects">
        <SectionBackground variant="right" showOrbs />
        <div className="container projectTitle">
          <h2>PROJECTS</h2>
          <div className="project-cards">
            {projects.map((project) => {
              const buttons = project.links.filter((l) => l.kind !== 'github' && safeHref(l.url));
              const repos = project.links.filter((l) => l.kind === 'github' && safeHref(l.url));
              const primary = buttons[0] ?? repos[0];
              const image = project.thumbnailUrl && <img src={assetUrl(project.thumbnailUrl)} alt={project.title} loading="lazy" />;
              return (
                <div className="card" key={project.id}>
                  <div className="external-links">
                    {buttons.map((link, i) => (
                      <div className="LiveDemoBtn" key={i}>
                        <a href={link.url} {...EXTERNAL} className="contactBtn"
                          style={{ ...projectBtnStyle, background: link.kind === 'highlight' ? '#ff7000' : undefined }}>
                          {link.label}
                        </a>
                      </div>
                    ))}
                    {repos.map((link, i) => (
                      <div className="GitHubIcon" key={i}>
                        <a href={link.url} {...EXTERNAL} aria-label={`${link.label} (${project.title})`}>
                          <img src="/icons/githubIcon.svg" alt="GitHub" style={{ height: '30px', width: '30px' }} />
                        </a>
                      </div>
                    ))}
                  </div>
                  {image && (primary ? <a href={primary.url} {...EXTERNAL}>{image}</a> : image)}
                  <div className="info">
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                  </div>
                  <br />
                  <div className="technologies flex">
                    {project.techStack.map((tech) => <small key={tech}>{tech}</small>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </section>

      <section id="education" className="section education">
        <div className="wave-bg"></div>
        <div className="container projectTitle">
          <h2>Education</h2>
          <div className="exp-grid">
            {education.map((school) => (
              <div className="exp-card" key={school.id}>
                {school.logoUrl && <img src={assetUrl(school.logoUrl)} alt={`${school.institution} logo`} />}
                <div className="details">
                  <h3>{school.institution}</h3>
                  {school.location && <p>{school.location}</p>}
                  {school.degree && <p>{school.degree}</p>}
                  {school.gpa && <p>GPA: {school.gpa}</p>}
                  {school.bullets.map((line, i) => <p key={i}>{line}</p>)}
                  {school.bullets.length === 0 && <br />}
                  <span className="educationDate">{formatRange(school.startDate, school.endDate, ' — ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact">
        <div className="footer-container">
          <div className="hero-image-wrap-footer">
            <div className="image-layer-footer">
              <img src="pictures/logoBack.png" alt="Background" className="background-img" />
            </div>
          </div>
          <div className="contact-links">
            {safeHref(settings?.githubUrl) && (
              <a href={settings.githubUrl} {...EXTERNAL}><div className="github"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" className="icon" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path></svg></div> {handleOf(settings.githubUrl)}</a>
            )}
            {settings?.phone && (
              <a href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}>
                <div className="phone">
                <svg
                  id="Layer_1"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  viewBox="0 0 32 32"
                  enableBackground="new 0 0 32 32"
                  xmlSpace="preserve"
                >
                  <path
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={2}
                    strokeMiterlimit={10}
                    d="M13.6,8.5L9.5,4.3C9,3.9,8.3,3.9,7.8,4.3L4.7,7.5 C4,8.1,3.8,9.1,4.1,9.9c0.8,2.3,2.9,6.9,7,11s8.7,6.1,11,7c0.9,0.3,1.8,0.1,2.5-0.5l3.1-3.1c0.5-0.5,0.5-1.2,0-1.7l-4.1-4.1 c-0.5-0.5-1.2-0.5-1.7,0l-2.5,2.5c0,0-2.8-1.2-5-3.3s-3.3-5-3.3-5l2.5-2.5C14.1,9.7,14.1,8.9,13.6,8.5z"
                  />
                </svg></div>{settings.phone}</a>
            )}
            {safeHref(settings?.linkedinUrl) && (
              <a href={settings.linkedinUrl} {...EXTERNAL}><div className="linkedin"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 1024 1024" className="icon" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zM349.3 793.7H230.6V411.9h118.7v381.8zm-59.3-434a68.8 68.8 0 1 1 68.8-68.8c-.1 38-30.9 68.8-68.8 68.8zm503.7 434H675.1V608c0-44.3-.8-101.2-61.7-101.2-61.7 0-71.2 48.2-71.2 98v188.9H423.7V411.9h113.8v52.2h1.6c15.8-30 54.5-61.7 112.3-61.7 120.2 0 142.3 79.1 142.3 181.9v209.4z"></path></svg></div> {hostPath(settings.linkedinUrl)}</a>
            )}
            {settings?.email && (
              <a href={`mailto:${settings.email}`}><div className="mail"><svg width="24px" height="24px" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="currentColor"><path strokeLinejoin="round" strokeWidth="12" d="M22 57.265V142c0 5.523 4.477 10 10 10h24V95.056l40 30.278 40-30.278V152h24c5.523 0 10-4.477 10-10V57.265c0-13.233-15.15-20.746-25.684-12.736L96 81.265 47.684 44.53C37.15 36.519 22 44.032 22 57.265Z" /></svg></div> {settings.email}</a>
            )}
            {safeHref(settings?.twitterUrl) && (
              <a href={settings.twitterUrl} {...EXTERNAL}><div className="twitter"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" className="icon" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg></div> {handleOf(settings.twitterUrl)}</a>
            )}

          </div>
        </div>
        {settings?.footerCredit && (
          <p className="mainFooter"><strong className="LightText">Design by: </strong>&nbsp; {settings.footerCredit}</p>
        )}

      </section>
    </div>
  )
}

function DevProgress() {
  return (
    <div className="dev-progress">
      <div className="dev-progress-label">
        <span>Development Progress</span>
        <span className="dev-progress-status">In Progress</span>
      </div>
      <div className="dev-progress-track">
        <div className="dev-progress-fill"></div>
      </div>
    </div>
  );
}

// Fresh content remounts the page so the entrance animations bind to the new elements.
const versionOf = (data) => {
  const text = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) | 0;
  return hash;
};

function App() {
  const { data, loading } = usePortfolioApi();
  useEffect(() => { trackVisit(); }, []);

  if (!data) {
    return (
      <div role="status" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#8892b0', fontFamily: 'sans-serif', background: '#0a192f' }}>
        {loading ? 'Loading…' : 'Content is temporarily unavailable. Please refresh in a moment.'}
      </div>
    );
  }
  return <Portfolio key={versionOf(data)} data={data} />;
}

export default App
