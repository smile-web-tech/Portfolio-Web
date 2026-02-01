import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import SplitType from 'split-type'; 
import './App.css'
import emailjs from '@emailjs/browser';
import CustomCursor from './CustomCursor';
import * as React from "react";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

function App() {
  const form = useRef();
  const [isSending, setIsSending] = useState(false);
  const sendEmail = (e) => {
    e.preventDefault();
    setIsSending(true);

    const sendNotification = emailjs.sendForm(
      'service_lxc7lgz',   
      'template_paqo4po',  
      form.current,
      { publicKey: 'dsT2_ewnev732Wlvl' }
    );

    const sendAutoReply = emailjs.sendForm(
      'service_lxc7lgz',      
      'template_je0qlh8',
      form.current,
      { publicKey: 'dsT2_ewnev732Wlvl' }
    );

    Promise.all([sendNotification, sendAutoReply])
      .then(
        () => {
          alert('Message sent successfully!');
          setIsSending(false);
          e.target.reset();
        },
        (error) => {
          console.error('FAILED...', error.text);
          alert('Failed to send message. Please try again.');
          setIsSending(false);
        }
      );
  };
  const fetchCount = async () => {
    try {
      const counterElement = document.getElementById('view-count');
      const hasVisited = localStorage.getItem('hasVisited_portfolio');
      
      const userAgent = encodeURIComponent(navigator.userAgent);
      
      let apiUrl = `https://iospo.org/get_data.php?mode=read`;

      if (!hasVisited) {
        apiUrl = `https://iospo.org/get_data.php?ua=${userAgent}`;
      }

      const response = await fetch(apiUrl);
      const data = await response.json();

      const proxy = { value: 0 }; 
      
      gsap.to(proxy, {
        value: data.visits, 
        duration: 1.5,
        ease: "power3.out",
        onUpdate: () => {
          if (counterElement) {
            counterElement.innerText = Math.floor(proxy.value);
          }
        }
      });

      if (!hasVisited) {
        localStorage.setItem('hasVisited_portfolio', 'true');
      }

    } catch (error) {
      console.error("Counter failed:", error);
      const el = document.getElementById('view-count');
      if(el) el.innerText = "Err";
    }
  };

  fetchCount();

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

    const fetchCount = async () => {
      try {
        const counterElement = container.current.querySelector('#view-count');
        const hasVisited = localStorage.getItem('hasVisited_portfolio');
        
        let apiUrl = hasVisited 
          ? 'https://iospo.org/get_data.php?mode=read'
          : 'https://iospo.org/get_data.php';

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Network response was not ok");
        
        const data = await response.json();
        
        const visitCount = data.visits ? parseInt(data.visits) : 0;


        const proxy = { value: 0 }; 
        gsap.to(proxy, {
          value: visitCount, 
          duration: 1.5,
          ease: "power3.out",
          onUpdate: () => {
            if (counterElement) {
              counterElement.innerText = Math.floor(proxy.value);
            }
          }
        });
        if (!hasVisited) {
          localStorage.setItem('hasVisited_portfolio', 'true');
        }

      } catch (error) {
        console.error("Counter Error:", error);
        const el = container.current.querySelector('#view-count');
        if(el) el.innerText = "---";
      }
    };
    fetchCount(); 


    const groups = gsap.utils.toArray('.skillGroup, .workGroup');
    groups.forEach(group => {
      gsap.from(group, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        scrollTrigger: {
          trigger: group,
          start: 'top 85%', 
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
          start: 'top 90%', 
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
        if(splitText) splitText.revert(); 
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
          <a href="#home" className="logo" onClick={(e) => handleScrollTo(e, '#home')}>Ysmayyl</a>
          
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


      {/* Added ID 'home' and className 'section' */}
      <section id="home" className="section"> 
        <div className="container hero-inner">
          <div className="hero-text">
            <p className="subtitle">Hi my name is</p>
            <br />
            {/* Added 'split' class for animation */}
            <h1 className="title"><span className="split">YSMAYYL</span> MAMMETGELDIYEV</h1>
            <div className="contact">
              <a href="#contact" onClick={(e) => handleScrollTo(e, '#contact')}>
                <button className="contactBtn">Contact me</button>
              </a>
              <br />
              <a href="/files/Ysmayyl_Mammetgeldiyev.pdf" download="Ysmayyl_CV.pdf">
             <button className="CVbtn">Download CV</button>
              </a>
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
            <img src="pictures/logoBack.webp" alt="Background" className="background-img" />
            <img src="pictures/smile-web.webp" alt="Foreground" className="foreground-img" />
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

      {/* Added 'section' class for GSAP targeting */}
      <section id="about" className="section about">
        <div className="container about-inner">
          <div className="about-image-wrap">
            <img src="pictures/smile2.webp" alt="Me at work"/>
          </div>
          <div className="about-text">
            <h2 className="subtitle">About Me</h2>
            <p>Motivated and detail-oriented IT enthusiast with strong skills in software development, system administration, and web technologies.
              I enjoy taking on challenges, building efficient solutions, and bringing both technical precision and creativity to every project. Whether it’s developing applications, managing IT systems, or collaborating with a team, I aim to deliver reliable, high-quality results.
              </p>
          </div>
        </div>
      </section>

      <section id="skills" className="skills section ">
    <div className="container">
  <div className="skill-title">
    <h2 >Skills</h2>
  </div>
    <div className="skillsContainer grid">
      <div className="skillGroup">
        <h2>Languages</h2>
        <div className="generalSkills">
          <div className="singleSkill">
            <img src="data:image/svg+xml,%3csvg%20fill='none'%20height='2500'%20width='2183'%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20124%20141.53199999999998'%3e%3cpath%20d='M10.383%20126.894L0%200l124%20.255-10.979%20126.639-50.553%2014.638z'%20fill='%23e34f26'/%3e%3cpath%20d='M62.468%20129.277V12.085l51.064.17-9.106%20104.851z'%20fill='%23ef652a'/%3e%3cpath%20d='M99.49%2041.362l1.446-15.49H22.383l4.34%2047.49h54.213L78.81%2093.617l-17.362%204.68-17.617-5.106-.936-12.085H27.319l2.128%2024.681%2032%208.936%2032.255-8.936%204.34-48.17H41.107L39.49%2041.362z'%20fill='%23fff'/%3e%3c/svg%3e" alt="" className="techLogo"/>
            <span>Html 5</span></div>
            <div className="singleSkill">
              <img src="data:image/svg+xml,%3csvg%20fill='none'%20height='2500'%20width='2183'%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20124%20141.53'%3e%3cpath%20d='M10.383%20126.892L0%200l124%20.255-10.979%20126.637-50.553%2014.638z'%20fill='%231b73ba'/%3e%3cpath%20d='M62.468%20129.275V12.085l51.064.17-9.106%20104.85z'%20fill='%231c88c7'/%3e%3cpath%20d='M100.851%2027.064H22.298l2.128%2015.318h37.276l-36.68%2015.745%202.127%2014.808h54.043l-1.958%2020.68-18.298%203.575-16.595-4.255-1.277-11.745H27.83l2.042%2024.426%2032.681%209.106%2031.32-9.957%204-47.745H64.765l36.085-14.978z'%20fill='%23fff'/%3e%3c/svg%3e" alt="" className="techLogo"/>
                <span>CSS3</span></div>
              <div className="singleSkill">
              <img src="data:image/svg+xml,%3csvg%20fill='none'%20height='2500'%20width='2183'%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20124%20141.53199999999998'%3e%3cpath%20d='M10.383%20126.894L0%200l124%20.255-10.979%20126.639-50.553%2014.638z'%20fill='%23e9ca32'/%3e%3cpath%20d='M62.468%20129.277V12.085l51.064.17-9.106%20104.851z'%20fill='%23ffde25'/%3e%3cg%20fill='%23fff'%3e%3cpath%20d='M57%2026H43.5v78L33%20102V91.5l-12.5-2V113l36.5%209.5zM67.127%2026H104.5L102%2040.95H81.394v24.533H102L99.5%20115l-32.373%207.5V107L89%2099.5%2090.263%2079l-23.136%203.35z'/%3e%3c/g%3e%3c/svg%3e" alt="" className="techLogo"/>
                <span>JavaScript</span></div>
              <div className="singleSkill">
               <img src="data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22utf-8%22%3F%3E%3C!--%20License%3A%20MIT.%20Made%20by%20Garuda%20Technology%3A%20https%3A%2F%2Fgithub.com%2Fgarudatechnologydevelopers%2Fsketch-icons%20--%3E%3Csvg%20width%3D%22800px%22%20height%3D%22800px%22%20viewBox%3D%220%200%2032%2032%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M16.0497%208.44062C22.6378%203.32607%2019.2566%200%2019.2566%200C19.7598%205.28738%2013.813%206.53583%2012.2189%2010.1692C11.1312%2012.6485%2012.9638%2014.8193%2016.0475%2017.5554C15.7749%2016.9494%2015.3544%2016.3606%2014.9288%2015.7645C13.4769%2013.7313%2011.9645%2011.6132%2016.0497%208.44062Z%22%20fill%3D%22%23E76F00%22%2F%3E%3Cpath%20d%3D%22M17.1015%2018.677C17.1015%2018.677%2019.0835%2017.0779%2017.5139%2015.3008C12.1931%209.27186%2023.3333%206.53583%2023.3333%206.53583C16.5317%209.8125%2017.5471%2011.7574%2019.2567%2014.1202C21.0871%2016.6538%2017.1015%2018.677%2017.1015%2018.677Z%22%20fill%3D%22%23E76F00%22%2F%3E%3Cpath%20d%3D%22M22.937%2023.4456C29.0423%2020.3258%2026.2195%2017.3278%2024.2492%2017.7317C23.7662%2017.8305%2023.5509%2017.9162%2023.5509%2017.9162C23.5509%2017.9162%2023.7302%2017.64%2024.0726%2017.5204C27.9705%2016.1729%2030.9682%2021.4949%2022.8143%2023.6028C22.8143%2023.6029%2022.9088%2023.5198%2022.937%2023.4456Z%22%20fill%3D%22%235382A1%22%2F%3E%3Cpath%20d%3D%22M10.233%2019.4969C6.41312%2018.9953%2012.3275%2017.6139%2012.3275%2017.6139C12.3275%2017.6139%2010.0307%2017.4616%207.20592%2018.8043C3.86577%2020.3932%2015.4681%2021.1158%2021.474%2019.5625C22.0984%2019.1432%2022.9614%2018.7798%2022.9614%2018.7798C22.9614%2018.7798%2020.5037%2019.2114%2018.0561%2019.4145C15.0612%2019.6612%2011.8459%2019.7093%2010.233%2019.4969Z%22%20fill%3D%22%235382A1%22%2F%3E%3Cpath%20d%3D%22M11.6864%2022.4758C9.55624%2022.2592%2010.951%2021.2439%2010.951%2021.2439C5.43898%2023.0429%2014.0178%2025.083%2021.7199%2022.8682C20.9012%2022.5844%2020.3806%2022.0653%2020.3806%2022.0653C16.6163%2022.7781%2014.441%2022.7553%2011.6864%2022.4758Z%22%20fill%3D%22%235382A1%22%2F%3E%3Cpath%20d%3D%22M12.6145%2025.6991C10.486%2025.4585%2011.7295%2024.7474%2011.7295%2024.7474C6.72594%2026.1222%2014.7729%2028.9625%2021.1433%2026.2777C20.0999%2025.8787%2019.3528%2025.4181%2019.3528%2025.4181C16.5111%2025.9469%2015.1931%2025.9884%2012.6145%2025.6991Z%22%20fill%3D%22%235382A1%22%2F%3E%3Cpath%20d%3D%22M25.9387%2027.3388C25.9387%2027.3388%2026.8589%2028.0844%2024.9252%2028.6612C21.2481%2029.7566%209.62093%2030.0874%206.39094%2028.7049C5.22984%2028.2082%207.40723%2027.5189%208.09215%2027.3742C8.80646%2027.2219%209.21466%2027.2503%209.21466%2027.2503C7.9234%2026.3558%200.868489%2029.0067%205.63111%2029.7659C18.6195%2031.8372%2029.3077%2028.8331%2025.9387%2027.3388Z%22%20fill%3D%22%235382A1%22%2F%3E%3Cpath%20d%3D%22M28%2028.9679C27.7869%2031.6947%2018.7877%2032.2683%2012.9274%2031.8994C9.10432%2031.6583%208.33812%2031.0558%208.32691%2031.047C11.9859%2031.6402%2018.1549%2031.7482%2023.1568%2030.8225C27.5903%2030.0016%2028%2028.9679%2028%2028.9679Z%22%20fill%3D%22%235382A1%22%2F%3E%3C%2Fsvg%3E" alt="" className="techLogo"/>
                <span>Java</span></div>
               <div className="singleSkill">
               <img src="data:image/svg+xml,%3csvg%20width='2500'%20height='2490'%20viewBox='0%200%20256%20255'%20xmlns='http://www.w3.org/2000/svg'%20preserveAspectRatio='xMinYMin%20meet'%3e%3cdefs%3e%3clinearGradient%20x1='12.959%25'%20y1='12.039%25'%20x2='79.639%25'%20y2='78.201%25'%20id='a'%3e%3cstop%20stop-color='%23387EB8'%20offset='0%25'/%3e%3cstop%20stop-color='%23366994'%20offset='100%25'/%3e%3c/linearGradient%3e%3clinearGradient%20x1='19.128%25'%20y1='20.579%25'%20x2='90.742%25'%20y2='88.429%25'%20id='b'%3e%3cstop%20stop-color='%23FFE052'%20offset='0%25'/%3e%3cstop%20stop-color='%23FFC331'%20offset='100%25'/%3e%3c/linearGradient%3e%3c/defs%3e%3cpath%20d='M126.916.072c-64.832%200-60.784%2028.115-60.784%2028.115l.072%2029.128h61.868v8.745H41.631S.145%2061.355.145%20126.77c0%2065.417%2036.21%2063.097%2036.21%2063.097h21.61v-30.356s-1.165-36.21%2035.632-36.21h61.362s34.475.557%2034.475-33.319V33.97S194.67.072%20126.916.072zM92.802%2019.66a11.12%2011.12%200%200%201%2011.13%2011.13%2011.12%2011.12%200%200%201-11.13%2011.13%2011.12%2011.12%200%200%201-11.13-11.13%2011.12%2011.12%200%200%201%2011.13-11.13z'%20fill='url(%23a)'/%3e%3cpath%20d='M128.757%20254.126c64.832%200%2060.784-28.115%2060.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486%204.705%2041.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165%2036.21-35.632%2036.21h-61.362s-34.475-.557-34.475%2033.32v56.013s-5.235%2033.897%2062.518%2033.897zm34.114-19.586a11.12%2011.12%200%200%201-11.13-11.13%2011.12%2011.12%200%200%201%2011.13-11.131%2011.12%2011.12%200%200%201%2011.13%2011.13%2011.12%2011.12%200%200%201-11.13%2011.13z'%20fill='url(%23b)'/%3e%3c/svg%3e" alt="" className="techLogo"/>
                <span>Python</span></div>
               <div className="singleSkill">
                <img src="data:image/svg+xml,%3csvg%20width='2500'%20height='1309'%20viewBox='0%200%20256%20134'%20xmlns='http://www.w3.org/2000/svg'%20preserveAspectRatio='xMinYMin%20meet'%3e%3cg%20fill-rule='evenodd'%3e%3cellipse%20fill='%238993BE'%20cx='128'%20cy='66.63'%20rx='128'%20ry='66.63'/%3e%3cpath%20d='M35.945%20106.082l14.028-71.014H82.41c14.027.877%2021.041%207.89%2021.041%2020.165%200%2021.041-16.657%2033.315-31.562%2032.438H56.11l-3.507%2018.411H35.945zm23.671-31.561L64%2048.219h11.397c6.137%200%2010.52%202.63%2010.52%207.89-.876%2014.905-7.89%2017.535-15.78%2018.412h-10.52zM100.192%2087.671l14.027-71.013h16.658l-3.507%2018.41h15.78c14.028.877%2019.288%207.89%2017.535%2016.658l-6.137%2035.945h-17.534l6.137-32.438c.876-4.384.876-7.014-5.26-7.014H124.74l-7.89%2039.452h-16.658zM153.425%20106.082l14.027-71.014h32.438c14.028.877%2021.042%207.89%2021.042%2020.165%200%2021.041-16.658%2033.315-31.562%2032.438h-15.781l-3.507%2018.411h-16.657zm23.67-31.561l4.384-26.302h11.398c6.137%200%2010.52%202.63%2010.52%207.89-.876%2014.905-7.89%2017.535-15.78%2018.412h-10.521z'%20fill='%23232531'/%3e%3c/g%3e%3c/svg%3e" alt="" className="techLogo"/>
                  <span>Php</span></div>
                <div className="singleSkill">
                <img src="data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22utf-8%22%3F%3E%3C!--%20License%3A%20MIT.%20Made%20by%20vscode-icons%3A%20https%3A%2F%2Fgithub.com%2Fvscode-icons%2Fvscode-icons%20--%3E%3Csvg%20width%3D%22800px%22%20height%3D%22800px%22%20viewBox%3D%220%200%2032%2032%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ctitle%3Efile_type_sql%3C%2Ftitle%3E%3Cpath%20d%3D%22M8.562%2C15.256A21.159%2C21.159%2C0%2C0%2C0%2C16%2C16.449a21.159%2C21.159%2C0%2C0%2C0%2C7.438-1.194c1.864-.727%2C2.525-1.535%2C2.525-2V9.7a10.357%2C10.357%2C0%2C0%2C1-2.084%2C1.076A22.293%2C22.293%2C0%2C0%2C1%2C16%2C12.078a22.36%2C22.36%2C0%2C0%2C1-7.879-1.3A10.28%2C10.28%2C0%2C0%2C1%2C6.037%2C9.7v3.55C6.037%2C13.724%2C6.7%2C14.528%2C8.562%2C15.256Z%22%20style%3D%22fill%3A%23ffda44%22%2F%3E%3Cpath%20d%3D%22M8.562%2C21.961a15.611%2C15.611%2C0%2C0%2C0%2C2.6.741A24.9%2C24.9%2C0%2C0%2C0%2C16%2C23.155a24.9%2C24.9%2C0%2C0%2C0%2C4.838-.452%2C15.614%2C15.614%2C0%2C0%2C0%2C2.6-.741c1.864-.727%2C2.525-1.535%2C2.525-2v-3.39a10.706%2C10.706%2C0%2C0%2C1-1.692.825A23.49%2C23.49%2C0%2C0%2C1%2C16%2C18.74a23.49%2C23.49%2C0%2C0%2C1-8.271-1.348%2C10.829%2C10.829%2C0%2C0%2C1-1.692-.825V19.96C6.037%2C20.426%2C6.7%2C21.231%2C8.562%2C21.961Z%22%20style%3D%22fill%3A%23ffda44%22%2F%3E%3Cpath%20d%3D%22M16%2C30c5.5%2C0%2C9.963-1.744%2C9.963-3.894V23.269a10.5%2C10.5%2C0%2C0%2C1-1.535.762l-.157.063A23.487%2C23.487%2C0%2C0%2C1%2C16%2C25.445a23.422%2C23.422%2C0%2C0%2C1-8.271-1.351c-.054-.02-.106-.043-.157-.063a10.5%2C10.5%2C0%2C0%2C1-1.535-.762v2.837C6.037%2C28.256%2C10.5%2C30%2C16%2C30Z%22%20style%3D%22fill%3A%23ffda44%22%2F%3E%3Cellipse%20cx%3D%2216%22%20cy%3D%225.894%22%20rx%3D%229.963%22%20ry%3D%223.894%22%20style%3D%22fill%3A%23ffda44%22%2F%3E%3C%2Fsvg%3E" alt="" className="techLogo"/>
                  <span>SQL</span></div>
                  <div className="singleSkill">
                    <img src="data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22utf-8%22%3F%3E%3C!--%20License%3A%20MIT.%20Made%20by%20vscode-icons%3A%20https%3A%2F%2Fgithub.com%2Fvscode-icons%2Fvscode-icons%20--%3E%3Csvg%20width%3D%22800px%22%20height%3D%22800px%22%20viewBox%3D%220%200%2032%2032%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22a%22%20x1%3D%2273.714%22%20y1%3D%22910.226%22%20x2%3D%22105.452%22%20y2%3D%22878.134%22%20gradientTransform%3D%22translate(-64.139%20-782.556)%20scale(0.893)%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%230296d8%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%238371d9%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22b%22%20x1%3D%2269.813%22%20y1%3D%22905.226%22%20x2%3D%22102.279%22%20y2%3D%22875.745%22%20gradientTransform%3D%22translate(-64.139%20-782.556)%20scale(0.893)%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23cb55c0%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23f28e0e%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Ctitle%3Efile_type_kotlin%3C%2Ftitle%3E%3Cpath%20d%3D%22M2%2C2V30H30v-.047l-6.95-7L16.1%2C15.946l6.95-7.012L29.938%2C2Z%22%20style%3D%22fill%3Aurl(%23a)%22%2F%3E%3Cpath%20d%3D%22M16.318%2C2%2C2%2C16.318V30h.124L16.132%2C15.992l-.031-.031L23.05%2C8.95%2C29.938%2C2Z%22%20style%3D%22fill%3Aurl(%23b)%22%2F%3E%3C%2Fsvg%3E" alt="" className="techLogo"/>
                      <span>Kotlin</span></div>
                  
        </div>
      </div>
      <div className="skillGroup">
        <h2 className="skillTitle">Frameworks & Libraries</h2>
        <div className="generalSkills">
        <div className="singleSkill">
            <img src="data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22%3F%3E%3C!--%20Made%20by%20gilbarbara%3A%20https%3A%2F%2Fgithub.com%2Fgilbarbara%2Flogos%20--%3E%3Csvg%20width%3D%22256px%22%20height%3D%22256px%22%20viewBox%3D%220%20-14%20256%20256%22%20version%3D%221.1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20preserveAspectRatio%3D%22xMidYMid%22%3E%3Cg%3E%3Cpath%20d%3D%22M210.483381%2C73.8236374%20C207.827698%2C72.9095503%20205.075867%2C72.0446761%20202.24247%2C71.2267368%20C202.708172%2C69.3261098%20203.135596%2C67.4500894%20203.515631%2C65.6059664%20C209.753843%2C35.3248922%20205.675082%2C10.9302478%20191.747328%2C2.89849283%20C178.392359%2C-4.80289661%20156.551327%2C3.22703567%20134.492936%2C22.4237776%20C132.371761%2C24.2697233%20130.244662%2C26.2241201%20128.118477%2C28.2723861%20C126.701777%2C26.917204%20125.287358%2C25.6075897%20123.876584%2C24.3549348%20C100.758745%2C3.82852863%2077.5866802%2C-4.82157937%2063.6725966%2C3.23341515%20C50.3303869%2C10.9571328%2046.3792156%2C33.8904224%2051.9945178%2C62.5880206%20C52.5367729%2C65.3599011%2053.1706189%2C68.1905639%2053.8873982%2C71.068617%20C50.6078941%2C71.9995641%2047.4418534%2C72.9920277%2044.4125156%2C74.0478303%20C17.3093297%2C83.497195%200%2C98.3066828%200%2C113.667995%20C0%2C129.533287%2018.5815786%2C145.446423%2046.8116526%2C155.095373%20C49.0394553%2C155.856809%2051.3511025%2C156.576778%2053.7333796%2C157.260293%20C52.9600965%2C160.37302%2052.2875179%2C163.423318%2051.7229345%2C166.398431%20C46.3687351%2C194.597975%2050.5500231%2C216.989464%2063.8566899%2C224.664425%20C77.6012619%2C232.590464%20100.66852%2C224.443422%20123.130185%2C204.809231%20C124.905501%2C203.257196%20126.687196%2C201.611293%20128.472081%2C199.886102%20C130.785552%2C202.113904%20133.095375%2C204.222319%20135.392897%2C206.199955%20C157.14963%2C224.922338%20178.637969%2C232.482469%20191.932332%2C224.786092%20C205.663234%2C216.837268%20210.125675%2C192.78347%20204.332202%2C163.5181%20C203.88974%2C161.283006%20203.374826%2C158.99961%20202.796573%2C156.675661%20C204.416503%2C156.196743%20206.006814%2C155.702335%20207.557482%2C155.188332%20C236.905331%2C145.46465%20256%2C129.745175%20256%2C113.667995%20C256%2C98.2510906%20238.132466%2C83.3418093%20210.483381%2C73.8236374%20L210.483381%2C73.8236374%20Z%20M204.118035%2C144.807565%20C202.718197%2C145.270987%20201.281904%2C145.718918%20199.818271%2C146.153177%20C196.578411%2C135.896354%20192.205739%2C124.989735%20186.854729%2C113.72131%20C191.961041%2C102.721277%20196.164656%2C91.9540963%20199.313837%2C81.7638014%20C201.93261%2C82.5215915%20204.474374%2C83.3208483%20206.923636%2C84.1643056%20C230.613348%2C92.3195488%20245.063763%2C104.377206%20245.063763%2C113.667995%20C245.063763%2C123.564379%20229.457753%2C136.411268%20204.118035%2C144.807565%20L204.118035%2C144.807565%20Z%20M193.603754%2C165.642007%20C196.165567%2C178.582766%20196.531475%2C190.282717%20194.834536%2C199.429057%20C193.309843%2C207.64764%20190.243595%2C213.12715%20186.452366%2C215.321689%20C178.384612%2C219.991462%20161.131788%2C213.921395%20142.525146%2C197.909832%20C140.392124%2C196.074366%20138.243609%2C194.114502%20136.088259%2C192.040261%20C143.301619%2C184.151133%20150.510878%2C174.979732%20157.54698%2C164.793993%20C169.922699%2C163.695814%20181.614905%2C161.900447%20192.218042%2C159.449363%20C192.740247%2C161.555956%20193.204126%2C163.621993%20193.603754%2C165.642007%20L193.603754%2C165.642007%20Z%20M87.2761866%2C214.514686%20C79.3938934%2C217.298414%2073.1160375%2C217.378157%2069.3211631%2C215.189998%20C61.2461189%2C210.532528%2057.8891498%2C192.554265%2062.4682434%2C168.438039%20C62.9927272%2C165.676183%2063.6170041%2C162.839142%2064.3365173%2C159.939216%20C74.8234575%2C162.258154%2086.4299951%2C163.926841%2098.8353334%2C164.932519%20C105.918826%2C174.899534%20113.336329%2C184.06091%20120.811247%2C192.08264%20C119.178102%2C193.65928%20117.551336%2C195.16028%20115.933685%2C196.574699%20C106.001303%2C205.256705%2096.0479605%2C211.41654%2087.2761866%2C214.514686%20L87.2761866%2C214.514686%20Z%20M50.3486141%2C144.746959%20C37.8658105%2C140.48046%2027.5570398%2C134.935332%2020.4908634%2C128.884403%20C14.1414664%2C123.446815%2010.9357817%2C118.048415%2010.9357817%2C113.667995%20C10.9357817%2C104.34622%2024.8334611%2C92.4562517%2048.0123604%2C84.3748281%20C50.8247961%2C83.3942121%2053.7689223%2C82.4701001%2056.8242337%2C81.6020363%20C60.0276398%2C92.0224477%2064.229889%2C102.917218%2069.3011135%2C113.93411%20C64.1642716%2C125.11459%2059.9023288%2C136.182975%2056.6674809%2C146.725506%20C54.489347%2C146.099407%2052.3791089%2C145.440499%2050.3486141%2C144.746959%20L50.3486141%2C144.746959%20Z%20M62.7270678%2C60.4878073%20C57.9160346%2C35.9004118%2061.1112387%2C17.3525532%2069.1516515%2C12.6982729%20C77.7160924%2C7.74005624%2096.6544653%2C14.8094222%20116.614922%2C32.5329619%20C117.890816%2C33.6657739%20119.171723%2C34.8514442%20120.456275%2C36.0781256%20C113.018267%2C44.0647686%20105.66866%2C53.1573386%2098.6480514%2C63.0655695%20C86.6081646%2C64.1815215%2075.0831931%2C65.9741531%2064.4868907%2C68.3746571%20C63.8206914%2C65.6948233%2063.2305903%2C63.0619242%2062.7270678%2C60.4878073%20L62.7270678%2C60.4878073%20Z%20M173.153901%2C87.7550367%20C170.620796%2C83.3796304%20168.020249%2C79.1076627%20165.369124%2C74.9523483%20C173.537126%2C75.9849113%20181.362914%2C77.3555864%20188.712066%2C79.0329319%20C186.505679%2C86.1041206%20183.755673%2C93.4974728%20180.518546%2C101.076741%20C178.196419%2C96.6680702%20175.740322%2C92.2229454%20173.153901%2C87.7550367%20L173.153901%2C87.7550367%20Z%20M128.122121%2C43.8938899%20C133.166461%2C49.3588189%20138.218091%2C55.4603279%20143.186789%2C62.0803968%20C138.179814%2C61.8439007%20133.110868%2C61.720868%20128.000001%2C61.720868%20C122.937434%2C61.720868%20117.905854%2C61.8411667%20112.929865%2C62.0735617%20C117.903575%2C55.515009%20122.99895%2C49.4217021%20128.122121%2C43.8938899%20L128.122121%2C43.8938899%20Z%20M82.8018984%2C87.830679%20C80.2715265%2C92.2183886%2077.8609975%2C96.6393627%2075.5753239%2C101.068539%20C72.3906004%2C93.5156998%2069.6661103%2C86.0886276%2067.440586%2C78.9171899%20C74.7446255%2C77.2826781%2082.5335049%2C75.9461789%2090.6495601%2C74.9332099%20C87.9610684%2C79.1268011%2085.3391054%2C83.4302106%2082.8018984%2C87.8297677%20L82.8018984%2C87.830679%20L82.8018984%2C87.830679%20Z%20M90.8833221%2C153.182899%20C82.4979621%2C152.247395%2074.5919739%2C150.979704%2067.289757%2C149.390303%20C69.5508242%2C142.09082%2072.3354636%2C134.505173%2075.5876271%2C126.789657%20C77.8792246%2C131.215644%2080.2993228%2C135.638441%2082.8451877%2C140.03572%20L82.8456433%2C140.03572%20C85.4388987%2C144.515476%2088.1255676%2C148.90364%2090.8833221%2C153.182899%20L90.8833221%2C153.182899%20Z%20M128.424691%2C184.213105%20C123.24137%2C178.620587%20118.071264%2C172.434323%20113.021912%2C165.780078%20C117.923624%2C165.972373%20122.921029%2C166.0708%20128.000001%2C166.0708%20C133.217953%2C166.0708%20138.376211%2C165.953235%20143.45336%2C165.727219%20C138.468257%2C172.501308%20133.434855%2C178.697141%20128.424691%2C184.213105%20L128.424691%2C184.213105%20Z%20M180.622896%2C126.396409%20C184.044571%2C134.195313%20186.929004%2C141.741317%20189.219234%2C148.9164%20C181.796719%2C150.609693%20173.782736%2C151.973534%20165.339049%2C152.986959%20C167.996555%2C148.775595%20170.619884%2C144.430263%20173.197646%2C139.960532%20C175.805484%2C135.438399%20178.28163%2C130.90943%20180.622896%2C126.396409%20L180.622896%2C126.396409%20Z%20M163.724586%2C134.496971%20C159.722835%2C141.435557%20155.614455%2C148.059271%20151.443648%2C154.311611%20C143.847063%2C154.854776%20135.998946%2C155.134562%20128.000001%2C155.134562%20C120.033408%2C155.134562%20112.284171%2C154.887129%20104.822013%2C154.402745%20C100.48306%2C148.068386%2096.285368%2C141.425078%2092.3091341%2C134.556664%20L92.3100455%2C134.556664%20C88.3442923%2C127.706935%2084.6943232%2C120.799333%2081.3870228%2C113.930466%20C84.6934118%2C107.045648%2088.3338117%2C100.130301%2092.276781%2C93.292874%20L92.2758697%2C93.294241%20C96.2293193%2C86.4385872%20100.390102%2C79.8276317%20104.688954%2C73.5329157%20C112.302398%2C72.9573964%20120.109505%2C72.6571055%20127.999545%2C72.6571055%20L128.000001%2C72.6571055%20C135.925583%2C72.6571055%20143.742714%2C72.9596746%20151.353879%2C73.5402067%20C155.587114%2C79.7888993%20159.719645%2C86.3784378%20163.688588%2C93.2350031%20C167.702644%2C100.168578%20171.389978%2C107.037901%20174.724618%2C113.77508%20C171.400003%2C120.627999%20167.720871%2C127.566587%20163.724586%2C134.496971%20L163.724586%2C134.496971%20Z%20M186.284677%2C12.3729198%20C194.857321%2C17.3165548%20198.191049%2C37.2542268%20192.804953%2C63.3986692%20C192.461372%2C65.0669011%20192.074504%2C66.7661189%20191.654369%2C68.4881206%20C181.03346%2C66.0374921%20169.500286%2C64.2138746%20157.425315%2C63.0810626%20C150.391035%2C53.0639249%20143.101577%2C43.9572289%20135.784778%2C36.073113%20C137.751934%2C34.1806885%20139.716356%2C32.3762092%20141.672575%2C30.673346%20C160.572216%2C14.2257007%20178.236518%2C7.73185406%20186.284677%2C12.3729198%20L186.284677%2C12.3729198%20Z%20M128.000001%2C90.8080696%20C140.624975%2C90.8080696%20150.859926%2C101.042565%20150.859926%2C113.667995%20C150.859926%2C126.292969%20140.624975%2C136.527922%20128.000001%2C136.527922%20C115.375026%2C136.527922%20105.140075%2C126.292969%20105.140075%2C113.667995%20C105.140075%2C101.042565%20115.375026%2C90.8080696%20128.000001%2C90.8080696%20L128.000001%2C90.8080696%20Z%22%20fill%3D%22%2300D8FF%22%3E%3C%2Fpath%3E%3C%2Fg%3E%3C%2Fsvg%3E" alt="" className="techLogo"/>
            <span>React.JS</span></div>
          <div className="singleSkill">
            <img src="data:image/svg+xml,%3csvg%20height='2500'%20viewBox='0%20-.11376601%2049.74245785%2051.31690859'%20width='2418'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='m49.626%2011.564a.809.809%200%200%201%20.028.209v10.972a.8.8%200%200%201%20-.402.694l-9.209%205.302v10.509c0%20.286-.152.55-.4.694l-19.223%2011.066c-.044.025-.092.041-.14.058-.018.006-.035.017-.054.022a.805.805%200%200%201%20-.41%200c-.022-.006-.042-.018-.063-.026-.044-.016-.09-.03-.132-.054l-19.219-11.066a.801.801%200%200%201%20-.402-.694v-32.916c0-.072.01-.142.028-.21.006-.023.02-.044.028-.067.015-.042.029-.085.051-.124.015-.026.037-.047.055-.071.023-.032.044-.065.071-.093.023-.023.053-.04.079-.06.029-.024.055-.05.088-.069h.001l9.61-5.533a.802.802%200%200%201%20.8%200l9.61%205.533h.002c.032.02.059.045.088.068.026.02.055.038.078.06.028.029.048.062.072.094.017.024.04.045.054.071.023.04.036.082.052.124.008.023.022.044.028.068a.809.809%200%200%201%20.028.209v20.559l8.008-4.611v-10.51c0-.07.01-.141.028-.208.007-.024.02-.045.028-.068.016-.042.03-.085.052-.124.015-.026.037-.047.054-.071.024-.032.044-.065.072-.093.023-.023.052-.04.078-.06.03-.024.056-.05.088-.069h.001l9.611-5.533a.801.801%200%200%201%20.8%200l9.61%205.533c.034.02.06.045.09.068.025.02.054.038.077.06.028.029.048.062.072.094.018.024.04.045.054.071.023.039.036.082.052.124.009.023.022.044.028.068zm-1.574%2010.718v-9.124l-3.363%201.936-4.646%202.675v9.124l8.01-4.611zm-9.61%2016.505v-9.13l-4.57%202.61-13.05%207.448v9.216zm-36.84-31.068v31.068l17.618%2010.143v-9.214l-9.204-5.209-.003-.002-.004-.002c-.031-.018-.057-.044-.086-.066-.025-.02-.054-.036-.076-.058l-.002-.003c-.026-.025-.044-.056-.066-.084-.02-.027-.044-.05-.06-.078l-.001-.003c-.018-.03-.029-.066-.042-.1-.013-.03-.03-.058-.038-.09v-.001c-.01-.038-.012-.078-.016-.117-.004-.03-.012-.06-.012-.09v-21.483l-4.645-2.676-3.363-1.934zm8.81-5.994-8.007%204.609%208.005%204.609%208.006-4.61-8.006-4.608zm4.164%2028.764%204.645-2.674v-20.096l-3.363%201.936-4.646%202.675v20.096zm24.667-23.325-8.006%204.609%208.006%204.609%208.005-4.61zm-.801%2010.605-4.646-2.675-3.363-1.936v9.124l4.645%202.674%203.364%201.937zm-18.422%2020.561%2011.743-6.704%205.87-3.35-8-4.606-9.211%205.303-8.395%204.833z'%20fill='%23ff2d20'/%3e%3c/svg%3e" alt="" className="techLogo"/>
            <span>Laravel</span></div>
            <div className="singleSkill">
              <img src="data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22utf-8%22%3F%3E%3C!--%20License%3A%20MIT.%20Made%20by%20vscode-icons%3A%20https%3A%2F%2Fgithub.com%2Fvscode-icons%2Fvscode-icons%20--%3E%3Csvg%20width%3D%22800px%22%20height%3D%22800px%22%20viewBox%3D%220%200%2032%2032%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ctitle%3Efile_type_django%3C%2Ftitle%3E%3Cpath%20d%3D%22M14.135%2C4H18.1V22.169a26.218%2C26.218%2C0%2C0%2C1-5.143.535c-4.842-.005-7.362-2.168-7.362-6.322%2C0-4%2C2.673-6.6%2C6.816-6.6a6.448%2C6.448%2C0%2C0%2C1%2C1.724.2V4Zm0%2C9.142a3.992%2C3.992%2C0%2C0%2C0-1.337-.2c-2%2C0-3.163%2C1.223-3.163%2C3.366%2C0%2C2.087%2C1.107%2C3.239%2C3.138%2C3.239a9.355%2C9.355%2C0%2C0%2C0%2C1.362-.1v-6.3Z%22%20style%3D%22fill%3A%2344b78b%22%2F%3E%3Cpath%20d%3D%22M24.4%2C10.059v9.1c0%2C3.133-.235%2C4.639-.923%2C5.938A6.316%2C6.316%2C0%2C0%2C1%2C20.237%2C28l-3.678-1.733A5.708%2C5.708%2C0%2C0%2C0%2C19.7%2C23.638c.566-1.121.745-2.42.745-5.837V10.059Z%22%20style%3D%22fill%3A%2344b78b%22%2F%3E%3Crect%20x%3D%2220.441%22%20y%3D%224.02%22%20width%3D%223.964%22%20height%3D%224.028%22%20style%3D%22fill%3A%2344b78b%22%2F%3E%3C%2Fsvg%3E" alt="" className="techLogo"/>
                <span>Django</span></div>
              <div className="singleSkill">
              <img src="data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22%20standalone%3D%22no%22%3F%3E%3C!--%20Made%20by%20gilbarbara%3A%20https%3A%2F%2Fgithub.com%2Fgilbarbara%2Flogos%20--%3E%3Csvg%20width%3D%22351px%22%20height%3D%22351px%22%20viewBox%3D%22-47.5%200%20351%20351%22%20version%3D%221.1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20preserveAspectRatio%3D%22xMidYMid%22%3E%3Cdefs%3E%3Cpath%20d%3D%22M1.25273437%2C280.731641%20L2.85834533%2C277.600858%20L102.211177%2C89.0833546%20L58.0613266%2C5.6082033%20C54.3920011%2C-1.28304578%2045.0741245%2C0.473674398%2043.8699203%2C8.18789086%20L1.25273437%2C280.731641%20Z%22%20id%3D%22path-1%22%3E%3C%2Fpath%3E%3Cfilter%20x%3D%22-50%25%22%20y%3D%22-50%25%22%20width%3D%22200%25%22%20height%3D%22200%25%22%20filterUnits%3D%22objectBoundingBox%22%20id%3D%22filter-2%22%3E%3CfeGaussianBlur%20stdDeviation%3D%2217.5%22%20in%3D%22SourceAlpha%22%20result%3D%22shadowBlurInner1%22%3E%3C%2FfeGaussianBlur%3E%3CfeOffset%20dx%3D%220%22%20dy%3D%220%22%20in%3D%22shadowBlurInner1%22%20result%3D%22shadowOffsetInner1%22%3E%3C%2FfeOffset%3E%3CfeComposite%20in%3D%22shadowOffsetInner1%22%20in2%3D%22SourceAlpha%22%20operator%3D%22arithmetic%22%20k2%3D%22-1%22%20k3%3D%221%22%20result%3D%22shadowInnerInner1%22%3E%3C%2FfeComposite%3E%3CfeColorMatrix%20values%3D%220%200%200%200%200%20%20%200%200%200%200%200%20%20%200%200%200%200%200%20%200%200%200%200.06%200%22%20type%3D%22matrix%22%20in%3D%22shadowInnerInner1%22%3E%3C%2FfeColorMatrix%3E%3C%2Ffilter%3E%3Cpath%20d%3D%22M134.417103%2C148.974235%20L166.455722%2C116.161738%20L134.417104%2C55.1546874%20C131.374828%2C49.3635911%20123.983911%2C48.7568362%20120.973828%2C54.5646483%20L103.26875%2C88.6738296%20L102.739423%2C90.4175473%20L134.417103%2C148.974235%20Z%22%20id%3D%22path-3%22%3E%3C%2Fpath%3E%3Cfilter%20x%3D%22-50%25%22%20y%3D%22-50%25%22%20width%3D%22200%25%22%20height%3D%22200%25%22%20filterUnits%3D%22objectBoundingBox%22%20id%3D%22filter-4%22%3E%3CfeGaussianBlur%20stdDeviation%3D%223.5%22%20in%3D%22SourceAlpha%22%20result%3D%22shadowBlurInner1%22%3E%3C%2FfeGaussianBlur%3E%3CfeOffset%20dx%3D%221%22%20dy%3D%22-9%22%20in%3D%22shadowBlurInner1%22%20result%3D%22shadowOffsetInner1%22%3E%3C%2FfeOffset%3E%3CfeComposite%20in%3D%22shadowOffsetInner1%22%20in2%3D%22SourceAlpha%22%20operator%3D%22arithmetic%22%20k2%3D%22-1%22%20k3%3D%221%22%20result%3D%22shadowInnerInner1%22%3E%3C%2FfeComposite%3E%3CfeColorMatrix%20values%3D%220%200%200%200%200%20%20%200%200%200%200%200%20%20%200%200%200%200%200%20%200%200%200%200.09%200%22%20type%3D%22matrix%22%20in%3D%22shadowInnerInner1%22%3E%3C%2FfeColorMatrix%3E%3C%2Ffilter%3E%3C%2Fdefs%3E%3Cg%3E%3Cpath%20d%3D%22M0%2C282.99762%20L2.12250746%2C280.0256%20L102.527363%2C89.5119284%20L102.739423%2C87.4951323%20L58.478806%2C4.35817711%20C54.7706269%2C-2.60604179%2044.3313035%2C-0.845245771%2043.1143483%2C6.95065473%20L0%2C282.99762%20Z%22%20fill%3D%22%23FFC24A%22%3E%3C%2Fpath%3E%3Cg%3E%3Cuse%20fill%3D%22%23FFA712%22%20fill-rule%3D%22evenodd%22%20xlink%3Ahref%3D%22%23path-1%22%3E%3C%2Fuse%3E%3Cuse%20fill%3D%22black%22%20fill-opacity%3D%221%22%20filter%3D%22url(%23filter-2)%22%20xlink%3Ahref%3D%22%23path-1%22%3E%3C%2Fuse%3E%3C%2Fg%3E%3Cpath%20d%3D%22M135.004975%2C150.380704%20L167.960199%2C116.629461%20L134.995423%2C53.6993114%20C131.866109%2C47.7425353%20123.128817%2C47.7253411%20120.032618%2C53.6993112%20L102.421015%2C87.2880848%20L102.421015%2C90.1487443%20L135.004975%2C150.380704%20Z%22%20fill%3D%22%23F4BD62%22%3E%3C%2Fpath%3E%3Cg%3E%3Cuse%20fill%3D%22%23FFA50E%22%20fill-rule%3D%22evenodd%22%20xlink%3Ahref%3D%22%23path-3%22%3E%3C%2Fuse%3E%3Cuse%20fill%3D%22black%22%20fill-opacity%3D%221%22%20filter%3D%22url(%23filter-4)%22%20xlink%3Ahref%3D%22%23path-3%22%3E%3C%2Fuse%3E%3C%2Fg%3E%3Cpolygon%20fill%3D%22%23F6820C%22%20points%3D%220%20282.99762%200.962097168%20282.030396%204.45771144%20280.60956%20132.935323%20152.60956%20134.563025%20148.178595%20102.513123%2087.1048584%22%3E%3C%2Fpolygon%3E%3Cpath%20d%3D%22M139.120971%2C347.551268%20L255.395916%2C282.703666%20L222.191698%2C78.2093373%20C221.153051%2C71.8112478%20213.303658%2C69.2818149%20208.724314%2C73.8694368%20L0.000254726368%2C282.997875%20L115.608454%2C347.545536%20C122.914643%2C351.624979%20131.812872%2C351.62689%20139.120971%2C347.551268%22%20fill%3D%22%23FDE068%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M254.354084%2C282.159837%20L221.401937%2C79.2179369%20C220.371175%2C72.8684188%20213.843792%2C70.2409553%20209.299213%2C74.79375%20L1.28945312%2C282.600785%20L115.627825%2C346.509458%20C122.878548%2C350.557931%20131.709226%2C350.559827%20138.961846%2C346.515146%20L254.354084%2C282.159837%20Z%22%20fill%3D%22%23FCCA3F%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M139.120907%2C345.64082%20C131.812808%2C349.716442%20122.914579%2C349.714531%20115.60839%2C345.635089%20L0.93134768%2C282.014551%20L0.000191044776%2C282.997875%20L115.60839%2C347.545536%20C122.914579%2C351.624979%20131.812808%2C351.62689%20139.120907%2C347.551268%20L255.395853%2C282.703666%20L255.111196%2C280.951785%20L139.120907%2C345.64082%20Z%22%20fill%3D%22%23EEAB37%22%3E%3C%2Fpath%3E%3C%2Fg%3E%3C%2Fsvg%3E" alt="" className="techLogo"/>
                <span>Firebase</span></div>
                <div className="singleSkill">
                  <img src="icons/jetpack.png" alt="" className="techLogo"/>
                    <span>Jetpack Compose</span></div>
              <div className="singleSkill">
               <img src="data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22%20standalone%3D%22no%22%20%3F%3E%3C!--%20Made%20by%20gilbarbara%3A%20https%3A%2F%2Fgithub.com%2Fgilbarbara%2Flogos%20--%3E%3Csvg%20width%3D%22256px%22%20height%3D%22256px%22%20viewBox%3D%220%200%20256%20256%22%20version%3D%221.1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20preserveAspectRatio%3D%22xMidYMid%22%3E%3Cg%3E%3Cpath%20d%3D%22M0%2C222.991225%20C0%2C241.223474%2014.7785318%2C256%2033.0087747%2C256%20L222.991225%2C256%20C241.223474%2C256%20256%2C241.221468%20256%2C222.991225%20L256%2C33.0087747%20C256%2C14.7765263%20241.221468%2C0%20222.991225%2C0%20L33.0087747%2C0%20C14.7765263%2C0%200%2C14.7785318%200%2C33.0087747%20L0%2C222.991225%20Z%22%20fill%3D%22%23563D7C%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M106.157563%2C113.238095%20L106.157563%2C76.9845938%20L138.069328%2C76.9845938%20C141.108559%2C76.9845938%20144.039202%2C77.2378593%20146.861345%2C77.7443978%20C149.683488%2C78.2509362%20152.179961%2C79.1554557%20154.35084%2C80.4579832%20C156.52172%2C81.7605107%20158.258397%2C83.5695496%20159.560924%2C85.8851541%20C160.863452%2C88.2007585%20161.514706%2C91.1675823%20161.514706%2C94.7857143%20C161.514706%2C101.298352%20159.560944%2C106.001853%20155.653361%2C108.896359%20C151.745779%2C111.790864%20146.752832%2C113.238095%20140.67437%2C113.238095%20L106.157563%2C113.238095%20L106.157563%2C113.238095%20Z%20M72.07493%2C50.5%20L72.07493%2C205.5%20L147.186975%2C205.5%20C154.133788%2C205.5%20160.899594%2C204.631661%20167.484594%2C202.894958%20C174.069594%2C201.158255%20179.93088%2C198.480877%20185.068627%2C194.862745%20C190.206375%2C191.244613%20194.294803%2C186.577293%20197.334034%2C180.860644%20C200.373264%2C175.143996%20201.892857%2C168.37819%20201.892857%2C160.563025%20C201.892857%2C150.866431%20199.541107%2C142.581033%20194.837535%2C135.706583%20C190.133963%2C128.832132%20183.00635%2C124.020088%20173.454482%2C121.270308%20C180.401295%2C117.941627%20185.647508%2C113.672295%20189.193277%2C108.462185%20C192.739047%2C103.252075%20194.511905%2C96.7395349%20194.511905%2C88.9243697%20C194.511905%2C81.6881057%20193.317939%2C75.6097352%20190.929972%2C70.6890756%20C188.542005%2C65.7684161%20185.177193%2C61.8247114%20180.835434%2C58.8578431%20C176.493676%2C55.8909749%20171.283644%2C53.756309%20165.205182%2C52.4537815%20C159.12672%2C51.151254%20152.397096%2C50.5%20145.016106%2C50.5%20L72.07493%2C50.5%20L72.07493%2C50.5%20Z%20M106.157563%2C179.015406%20L106.157563%2C136.466387%20L143.279412%2C136.466387%20C150.660401%2C136.466387%20156.594049%2C138.166883%20161.080532%2C141.567927%20C165.567016%2C144.968971%20167.810224%2C150.649353%20167.810224%2C158.609244%20C167.810224%2C162.661552%20167.122789%2C165.990183%20165.747899%2C168.595238%20C164.373009%2C171.200293%20162.527789%2C173.262597%20160.212185%2C174.782213%20C157.89658%2C176.301828%20155.219203%2C177.387252%20152.179972%2C178.038515%20C149.140741%2C178.689779%20145.956833%2C179.015406%20142.628151%2C179.015406%20L106.157563%2C179.015406%20L106.157563%2C179.015406%20Z%22%20fill%3D%22%23FFFFFF%22%3E%3C%2Fpath%3E%3C%2Fg%3E%3C%2Fsvg%3E" alt="" className="techLogo"/>
                <span>Bootstrap5</span></div>
               <div className="singleSkill">
               <img src="data:image/svg+xml,%3csvg%20height='1499'%20viewBox='.15%20.13%20799.7%20479.69'%20width='2500'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='m400%20.13c-106.63%200-173.27%2053.3-199.93%20159.89%2039.99-53.3%2086.64-73.28%20139.95-59.96%2030.42%207.6%2052.16%2029.67%2076.23%2054.09%2039.2%2039.78%2084.57%2085.82%20183.68%2085.82%20106.62%200%20173.27-53.3%20199.92-159.9-39.98%2053.3-86.63%2073.29-139.95%2059.97-30.41-7.6-52.15-29.67-76.22-54.09-39.2-39.78-84.58-85.82-183.68-85.82zm-199.93%20239.84c-106.62%200-173.27%2053.3-199.92%20159.9%2039.98-53.3%2086.63-73.29%20139.95-59.96%2030.41%207.61%2052.15%2029.67%2076.22%2054.08%2039.2%2039.78%2084.58%2085.83%20183.68%2085.83%20106.63%200%20173.27-53.3%20199.93-159.9-39.99%2053.3-86.64%2073.29-139.95%2059.96-30.42-7.59-52.16-29.67-76.23-54.08-39.2-39.78-84.57-85.83-183.68-85.83z'%20fill='%2306b6d4'/%3e%3c/svg%3e" alt="" className="techLogo"/>
                <span>Tailwind CSS</span></div>
        </div>
      </div>
      <div className="skillGroup">
        <h2 className="skillTitle">Developer Tools</h2>
        <div className="generalSkills">
          <div className="singleSkill">
            <img src="icons/android.svg" alt="" className="techLogo"/>
            <span>Android Studio</span></div>
            <div className="singleSkill">
              <img src="data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22utf-8%22%3F%3E%3C!--%20License%3A%20MIT.%20Made%20by%20vscode-icons%3A%20https%3A%2F%2Fgithub.com%2Fvscode-icons%2Fvscode-icons%20--%3E%3Csvg%20width%3D%22800px%22%20height%3D%22800px%22%20viewBox%3D%220%200%2032%2032%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ctitle%3Efile_type_mysql%3C%2Ftitle%3E%3Cpath%20d%3D%22M8.785%2C6.865a3.055%2C3.055%2C0%2C0%2C0-.785.1V7h.038a6.461%2C6.461%2C0%2C0%2C0%2C.612.785c.154.306.288.611.441.917.019-.019.038-.039.038-.039a1.074%2C1.074%2C0%2C0%2C0%2C.4-.957%2C4.314%2C4.314%2C0%2C0%2C1-.23-.4c-.115-.191-.364-.287-.517-.44%22%20style%3D%22fill%3A%235d87a1%3Bfill-rule%3Aevenodd%22%2F%3E%3Cpath%20d%3D%22M27.78%2C23.553a8.849%2C8.849%2C0%2C0%2C0-3.712.536c-.287.115-.745.115-.785.478.154.153.172.4.307.613a4.467%2C4.467%2C0%2C0%2C0%2C.995%2C1.167c.4.306.8.611%2C1.225.879.745.461%2C1.588.728%2C2.314%2C1.187.422.268.842.612%2C1.264.9.21.153.343.4.611.5v-.058a3.844%2C3.844%2C0%2C0%2C0-.291-.613c-.191-.19-.383-.363-.575-.554a9.118%2C9.118%2C0%2C0%2C0-1.99-1.932c-.613-.422-1.953-1-2.2-1.7l-.039-.039a7.69%2C7.69%2C0%2C0%2C0%2C1.321-.308c.65-.172%2C1.243-.133%2C1.912-.3.307-.077.862-.268.862-.268v-.3c-.342-.34-.587-.795-.947-1.116a25.338%2C25.338%2C0%2C0%2C0-3.122-2.328c-.587-.379-1.344-.623-1.969-.946-.226-.114-.6-.17-.737-.36a7.594%2C7.594%2C0%2C0%2C1-.776-1.457c-.548-1.04-1.079-2.193-1.551-3.293a20.236%2C20.236%2C0%2C0%2C0-.965-2.157A19.078%2C19.078%2C0%2C0%2C0%2C11.609%2C5a9.07%2C9.07%2C0%2C0%2C0-2.421-.776c-.474-.02-.946-.057-1.419-.075A7.55%2C7.55%2C0%2C0%2C1%2C6.9%2C3.485C5.818%2C2.8%2C3.038%2C1.328%2C2.242%2C3.277%2C1.732%2C4.508%2C3%2C5.718%2C3.435%2C6.343A8.866%2C8.866%2C0%2C0%2C1%2C4.4%2C7.762c.133.322.171.663.3%2C1A22.556%2C22.556%2C0%2C0%2C0%2C5.687%2C11.3a8.946%2C8.946%2C0%2C0%2C0%2C.7%2C1.172c.153.209.417.3.474.645a5.421%2C5.421%2C0%2C0%2C0-.436%2C1.419%2C8.336%2C8.336%2C0%2C0%2C0%2C.549%2C6.358c.3.473%2C1.022%2C1.514%2C1.987%2C1.116.851-.34.662-1.419.908-2.364.056-.229.019-.379.132-.53V19.3s.483%2C1.061.723%2C1.6a10.813%2C10.813%2C0%2C0%2C0%2C2.4%2C2.59A3.514%2C3.514%2C0%2C0%2C1%2C14%2C24.657V25h.427A1.054%2C1.054%2C0%2C0%2C0%2C14%2C24.212a9.4%2C9.4%2C0%2C0%2C1-.959-1.16%2C24.992%2C24.992%2C0%2C0%2C1-2.064-3.519c-.3-.6-.553-1.258-.793-1.857-.11-.231-.11-.58-.295-.7a7.266%2C7.266%2C0%2C0%2C0-.884%2C1.313%2C11.419%2C11.419%2C0%2C0%2C0-.517%2C2.921c-.073.02-.037%2C0-.073.038-.589-.155-.792-.792-1.014-1.332a8.756%2C8.756%2C0%2C0%2C1-.166-5.164c.128-.405.683-1.681.461-2.068-.111-.369-.48-.58-.682-.871a7.767%2C7.767%2C0%2C0%2C1-.663-1.237C5.912%2C9.5%2C5.69%2C8.3%2C5.212%2C7.216a10.4%2C10.4%2C0%2C0%2C0-.921-1.489A9.586%2C9.586%2C0%2C0%2C1%2C3.276%2C4.22c-.092-.213-.221-.561-.074-.793a.3.3%2C0%2C0%2C1%2C.259-.252c.238-.212.921.058%2C1.16.174a9.2%2C9.2%2C0%2C0%2C1%2C1.824.967c.258.194.866.685.866.685h.18c.612.133%2C1.3.037%2C1.876.21a12.247%2C12.247%2C0%2C0%2C1%2C2.755%2C1.32%2C16.981%2C16.981%2C0%2C0%2C1%2C5.969%2C6.545c.23.439.327.842.537%2C1.3.4.94.9%2C1.9%2C1.3%2C2.814a12.578%2C12.578%2C0%2C0%2C0%2C1.36%2C2.564c.286.4%2C1.435.612%2C1.952.822a13.7%2C13.7%2C0%2C0%2C1%2C1.32.535c.651.4%2C1.3.861%2C1.913%2C1.3.305.23%2C1.262.708%2C1.32%2C1.091%22%20style%3D%22fill%3A%2300758f%3Bfill-rule%3Aevenodd%22%2F%3E%3C%2Fsvg%3E" alt="" className="techLogo"/>
                <span>MySQL</span></div>
              <div className="singleSkill">

              <img src="icons/cisco.svg" alt="" className="techLogo"/>
                <span>Cisco packet tracer</span></div>

              <div className="singleSkill">
               <img src="data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22%3F%3E%3C!--%20Made%20by%20gilbarbara%3A%20https%3A%2F%2Fgithub.com%2Fgilbarbara%2Flogos%20--%3E%3Csvg%20width%3D%22291px%22%20height%3D%22291px%22%20viewBox%3D%22-17.5%200%20291%20291%22%20version%3D%221.1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20preserveAspectRatio%3D%22xMidYMid%22%3E%3Cg%3E%3Cpath%20d%3D%22M2.05386819%2C218.186819%20C3.37421203%2C220.534097%205.28137536%2C222.294556%207.6286533%2C223.6149%20L120.591404%2C288.751862%20L120.591404%2C288.751862%20C125.28596%2C291.539255%20131.00745%2C291.539255%20135.555301%2C288.751862%20L248.518052%2C223.6149%20C253.212607%2C220.974212%20256%2C215.986246%20256%2C210.558166%20L256%2C80.2842407%20L256%2C80.2842407%20C256%2C74.8561605%20253.212607%2C69.8681948%20248.518052%2C67.2275072%20L135.555301%2C2.09054441%20L135.555301%2C2.09054441%20C130.860745%2C-0.696848138%20125.139255%2C-0.696848138%20120.591404%2C2.09054441%20L120.591404%2C2.09054441%20L7.6286533%2C67.2275072%20C2.78739255%2C69.8681948%200%2C74.8561605%200%2C80.2842407%20L0%2C80.2842407%20L0%2C210.704871%20C0%2C213.345559%200.586819484%2C215.839542%202.05386819%2C218.186819%22%20fill%3D%22%23009639%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M91.8372493%2C195.154155%20C91.8372493%2C203.222923%2085.382235%2C209.677937%2077.313467%2C209.677937%20C69.2446991%2C209.677937%2062.7896848%2C203.222923%2062.7896848%2C195.154155%20L62.7896848%2C195.154155%20L62.7896848%2C95.5415473%20C62.7896848%2C87.7661891%2069.6848138%2C81.4578797%2079.2206304%2C81.4578797%20C86.1157593%2C81.4578797%2094.1845272%2C84.2452722%2099.025788%2C90.2601719%20L103.426934%2C95.5415473%20L164.162751%2C168.160458%20L164.162751%2C95.834957%20L164.162751%2C95.834957%20C164.162751%2C87.7661891%20170.617765%2C81.3111748%20178.686533%2C81.3111748%20C186.755301%2C81.3111748%20193.210315%2C87.7661891%20193.210315%2C95.834957%20L193.210315%2C95.834957%20L193.210315%2C195.447564%20C193.210315%2C203.222923%20186.315186%2C209.531232%20176.77937%2C209.531232%20C169.884241%2C209.531232%20161.815473%2C206.74384%20156.974212%2C200.72894%20L91.8372493%2C122.975358%20L91.8372493%2C195.154155%20L91.8372493%2C195.154155%20Z%22%20fill%3D%22%23FFFFFF%22%3E%3C%2Fpath%3E%3C%2Fg%3E%3C%2Fsvg%3E" alt="" className="techLogo"/>
                <span>Nginx</span></div>
               <div className="singleSkill">
               <img src="data:image/svg+xml,%3c?xml%20version=%271.0%27%20encoding=%27utf-8%27?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width=%27800px%27%20height=%27800px%27%20viewBox=%270%200%20256%20256%27%20xmlns=%27http://www.w3.org/2000/svg%27%20preserveAspectRatio=%27xMinYMin%20meet%27%3e%3cpath%20d=%27M251.172%20116.594L139.4%204.828c-6.433-6.437-16.873-6.437-23.314%200l-23.21%2023.21%2029.443%2029.443c6.842-2.312%2014.688-.761%2020.142%204.693%205.48%205.489%207.02%2013.402%204.652%2020.266l28.375%2028.376c6.865-2.365%2014.786-.835%2020.269%204.657%207.663%207.66%207.663%2020.075%200%2027.74-7.665%207.666-20.08%207.666-27.749%200-5.764-5.77-7.188-14.235-4.27-21.336l-26.462-26.462-.003%2069.637a19.82%2019.82%200%200%201%205.188%203.71c7.663%207.66%207.663%2020.076%200%2027.747-7.665%207.662-20.086%207.662-27.74%200-7.663-7.671-7.663-20.086%200-27.746a19.654%2019.654%200%200%201%206.421-4.281V94.196a19.378%2019.378%200%200%201-6.421-4.281c-5.806-5.798-7.202-14.317-4.227-21.446L81.47%2039.442l-76.64%2076.635c-6.44%206.443-6.44%2016.884%200%2023.322l111.774%20111.768c6.435%206.438%2016.873%206.438%2023.316%200l111.251-111.249c6.438-6.44%206.438-16.887%200-23.324%27%20fill=%27%23DE4C36%27/%3e%3c/svg%3e" alt="" className="techLogo"/>
                <span>Git</span></div>
               <div className="singleSkill">
                <img src="data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22utf-8%22%3F%3E%3C!--%20License%3A%20MIT.%20Made%20by%20Gitlab%3A%20https%3A%2F%2Fgitlab.com%2Fgitlab-org%2Fgitlab-svgs%3Fref%3Diconduck.com%20--%3E%3Csvg%20width%3D%22800px%22%20height%3D%22800px%22%20viewBox%3D%220%200%2016%2016%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M7.976%200A7.977%207.977%200%20000%207.976c0%203.522%202.3%206.507%205.431%207.584.392.049.538-.196.538-.392v-1.37c-2.201.49-2.69-1.076-2.69-1.076-.343-.93-.881-1.175-.881-1.175-.734-.489.048-.489.048-.489.783.049%201.224.832%201.224.832.734%201.223%201.859.88%202.3.685.048-.538.293-.88.489-1.076-1.762-.196-3.621-.881-3.621-3.964%200-.88.293-1.566.832-2.153-.05-.147-.343-.978.098-2.055%200%200%20.685-.196%202.201.832.636-.196%201.322-.245%202.007-.245s1.37.098%202.006.245c1.517-1.027%202.202-.832%202.202-.832.44%201.077.146%201.908.097%202.104a3.16%203.16%200%2001.832%202.153c0%203.083-1.86%203.719-3.62%203.915.293.244.538.733.538%201.467v2.202c0%20.196.146.44.538.392A7.984%207.984%200%200016%207.976C15.951%203.572%2012.38%200%207.976%200z%22%20fill%3D%22%23000000%22%2F%3E%3C%2Fsvg%3E" alt="" className="techLogo"/>
                  <span>GitHub</span></div>
                <div className="singleSkill">
                <img src="data:image/svg+xml,%3c?xml%20version=%271.0%27%20encoding=%27UTF-8%27?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width=%27800px%27%20height=%27800px%27%20viewBox=%27-64%200%20384%20384%27%20version=%271.1%27%20xmlns=%27http://www.w3.org/2000/svg%27%20xmlns:xlink=%27http://www.w3.org/1999/xlink%27%20preserveAspectRatio=%27xMidYMid%27%3e%3cg%3e%3cpath%20d=%27M64,384%20C99.328,384%20128,355.328%20128,320%20L128,256%20L64,256%20C28.672,256%200,284.672%200,320%20C0,355.328%2028.672,384%2064,384%20Z%27%20fill=%27%230ACF83%27%3e%3c/path%3e%3cpath%20d=%27M0,192%20C0,156.672%2028.672,128%2064,128%20L128,128%20L128,256%20L64,256%20C28.672,256%200,227.328%200,192%20Z%27%20fill=%27%23A259FF%27%3e%3c/path%3e%3cpath%20d=%27M0,64%20C0,28.672%2028.672,0%2064,0%20L128,0%20L128,128%20L64,128%20C28.672,128%200,99.328%200,64%20Z%27%20fill=%27%23F24E1E%27%3e%3c/path%3e%3cpath%20d=%27M128,0%20L192,0%20C227.328,0%20256,28.672%20256,64%20C256,99.328%20227.328,128%20192,128%20L128,128%20L128,0%20Z%27%20fill=%27%23FF7262%27%3e%3c/path%3e%3cpath%20d=%27M256,192%20C256,227.328%20227.328,256%20192,256%20C156.672,256%20128,227.328%20128,192%20C128,156.672%20156.672,128%20192,128%20C227.328,128%20256,156.672%20256,192%20Z%27%20fill=%27%231ABCFE%27%3e%3c/path%3e%3c/g%3e%3c/svg%3e" alt="" className="techLogo"/>
                  <span>Figma</span></div>
         </div>      
        </div>
      </div>
    </div> 
</section>

      <section id="experience" className="section experience">
        <div className="container projectTitle">
          <h2>Work Experience</h2>
           <div className="workGroup">
          <img src="pictures/iospoLogo.png" alt="IOSPO" className="companyLogo" style={{ height: '4rem' }} />
          <h3 className="workCompany"> International Online Subject and Project Olympiad (IOSPO)</h3>
          <span className="workLocation">Balkanabat, Turkmenistan</span>
          <div className="role">
            <h4 className="workTitle">Web Developer</h4>
            <span className="workDate">Apr. 2025 - Aug. 2025</span>
            <br />
            <br />
            <div className="project">
              <a href="https://iospo.org" target="_blank" className="projectLink"><h4 className="workTitle">IOSPO Student & Admin Portal Website</h4></a>
              <ul className="workResponsibilities">
                <li><strong className="highlight">Collaborated</strong> with a team to build the official IOSPO website completely from <strong className="highlight">scratch</strong>.</li>
                <li><strong className="highlight">Developed </strong>the student and admin portals, including a user-friendly and <strong className="highlight">secure dashboard </strong> interface.</li>
                <li>Implemented <strong className="highlight">login </strong> and <strong className="highlight">password authentication </strong>to strengthen system security.</li>
                <li>Built a full <strong className="highlight">CRUD system </strong>to manage users and data efficiently.</li>
                <li>Designed, managed, and optimized the project’s <strong className="highlight">MySQL database, </strong>ensuring stability and scalability.</li>
              </ul>
            </div>
          </div>

          <br />
          <br />
          <img src="pictures/logo.png" alt="GunbatarShapagy" className="companyLogo" />
          <h3 className="workCompany">Gunbatar Shapagy education center</h3>
          <span className="workLocation">Balkanabat, Turkmenistan</span>
          <div className="role">
            <h4 className="workTitle">Software Developer</h4>
            <span className="workDate">Jan. 2024 - Feb. 2025</span>
            <br />
            <br />
            <div className="project">
              <a href="https://peachpuff-marten-860555.hostingersite.com/" target="_blank" className="projectLink"><h4 className="workTitle">Full-Stack Web Application for Education Center Management</h4></a>
              <ul className="workResponsibilities">
                <li>Led a <strong className="highlight">team </strong>to deliver a full-featured website from scratch, implementing both frontend <strong className="highlight"> (HTML, CSS, JavaScript)</strong> and <strong className="highlight">backend (Laravel, PHP)</strong> components.</li>
                <li>Main <strong className="highlight">landing pages</strong> with <strong className="highlight">responsive </strong> design.</li>
                <li><strong className="highlight">Online registration form </strong> with validation and <strong className="highlight">secure data </strong> handling.</li>
                <li><strong className="highlight">Student </strong> and <strong className="highlight">Teacher </strong> portal with role-based access and full <strong className="highlight"> CRUD </strong>functionality in <strong className="highlight"> </strong> Laravel.</li>
                <li>Handled <strong className="highlight">server deployment </strong> and <strong className="highlight">hosting </strong>configuration, ensuring reliable uptime.</li>
              </ul>
            </div>
            <br />
            <div className="project">
              <h4 className="workTitle">Education Center Mobile Application</h4>
              <ul className="workResponsibilities">
                <li><strong className="highlight">Developed </strong>and <strong className="highlight">launched </strong>a mobile application using <strong className="highlight">Java (Android Studio) </strong>, integrating all <strong className="highlight">website features </strong>, connected to <strong className="highlight">Firebase </strong>, and successfully published it on the <strong className="highlight">Google Play Store </strong>.</li>
                <li>Designed and optimized the <strong className="highlight">MySQL</strong> database for the web platform, and used <strong className="highlight" >Firebase </strong>for managing real-time data in the <strong className="highlight" >mobile app.</strong></li>
              </ul>
            </div>
          </div>
          <br />
          <br />
          <img src="icons/elite.png" alt="EliteGroup" className="companyLogo" style={{ height: '5rem' }} />
          <h3 className="workCompany">Freelance IT & Cybersecurity services</h3>
          <span className="workLocation">Balkanabat, Turkmenistan</span>
          <div className="role">
            <h4 className="workTitle">Self employed</h4>
            <span className="workDate">Mar. 2022 - Aug. 2025</span>
            <br />
            <br />
            <div className="project">
              <ul className="workResponsibilities">
                <li><strong className="highlight">Hosted and managed </strong> a virtual private server on <strong className="highlight">Ubuntu (Linux)</strong>, deploying custom scripts and VPN solutions
                to <strong className="highlight">bypass censorship and enhance privacy for 200+ clients. </strong></li>
                <li>Oversaw server maintenance, <strong className="highlight">security protocols </strong>, and troubleshooting in a <strong className="highlight">Linux environment.</strong></li>
                <li><strong className="highlight">Collaborated with an international remote team </strong> to optimize service performance and scalability</li>
              </ul>
            </div>
          </div>
        </div>
        </div>
       
      </section>

      <section id="projects" className="section projects">
        <div className="container projectTitle">
          <h2>PROJECTS</h2>
          <div className="project-cards">
            <div className="card">
              <div className="external-links">
                <div className="WhatsAppIcon">
                  <a href="https://wa.me/36205021561" target="_blank">
                    <img src="icons/whatsApp.svg" alt="WhatsApp" style={{ height: '30px', width: '30px' }} />
                  </a>
                </div>
                <div className="GitHubIcon">
                  <a href="https://github.com/smile-web-tech/gunbatar-website" target="_blank"><img src="icons/githubIcon.svg" alt="GitHub" style={{ height: '30px', width: '30px' }} /> </a> </div>
              </div>
              <a href="https://peachpuff-marten-860555.hostingersite.com/" target="_blank">
                <img src="pictures/gunbatarWeb.png" alt="Gunbatarshapagy.com" />
              </a>
              <div className="info">
                <h3>Gunbatar Education Center Website</h3>
                <p>Developed a comprehensive and fully functional website for an education center, providing a seamless platform for both teachers and students to interact and access resources.</p>
              </div>

              <div className="technologies flex">
                <small>HTML</small>
                <small>CSS</small>
                <small>JavaScript</small>
                <small>PHP</small>
                <small>Laravel</small>
                <small>SQL</small>
              </div>
            </div>
            <div className="card">
              <div className="external-links">
                <div className="WhatsAppIcon">
                  <a href="https://wa.me/36205021561" target="_blank">
                    <img src="icons/whatsApp.svg" alt="WhatsApp" style={{ height: '30px', width: '30px' }} />
                  </a>
                </div>
                <div className="GitHubIcon">
                  <a href="https://github.com/smile-web-tech/gunbatar-app" target="_blank"><img src="icons/githubIcon.svg" alt="GitHub" style={{ height: '30px', width: '30px' }} /></a> </div>
              </div>
              <a href="https://play.google.com/store/apps/details?id=com.gunbatarshapagy.west_project&hl=en" target="_blank">
                <img src="pictures/gunbatarApp.png" alt="Gunbatar Shapagy APP" />
              </a>
              <div className="info">
                <h3>Gunbatar Education Center Mobile Application</h3>
                <p>Engineered a robust mobile application from the ground up for the education center using Kotlin and Firebase, enhancing accessibility and engagement for users on Android devices.</p>
              </div>
              <div className="technologies flex">
                <small>Java</small>
                <small>FireBase</small>
                <small>Android Studio</small>
              </div>
            </div>
            <div className="card">
              <div className="external-links">
                <div className="WhatsAppIcon">
                  <a href="https://wa.me/36205021561" target="_blank">
                    <img src="icons/whatsApp.svg" alt="WhatsApp" style={{ height: '30px', width: '30px' }} />
                  </a>
                </div>
                <div className="GitHubIcon">
                  <a href="https://github.com/smile-web-tech/iospo" target="_blank"><img src="icons/githubIcon.svg" alt="GitHub" style={{ height: '30px', width: '30px' }} /></a> </div>
              </div>
              <a href="https://iospo.org" target="_blank">
                <img src="pictures/iospo.png" alt="IOSPO" />
              </a>
              <div className="info">
                <h3>International Science Olympiad Portal (IOSPO)</h3>
                <p>Created with team an online portal for the International Science Olympiad, featuring a custom content management system (CMS) to efficiently manage and publish content related to the event.</p>
              </div>

              <div className="technologies flex">
                <small>HTML</small>
                <small>CSS</small>
                <small>JavaScript</small>
                <small>PHP</small>
                <small>MySQL</small>
              </div>
            </div>
            <div className="card">
              <div className="external-links">
                <div className="WhatsAppIcon">
                  <a href="https://wa.me/36205021561" target="_blank">
                    <img src="icons/whatsApp.svg" alt="WhatsApp" style={{ height: '30px', width: '30px' }} />
                  </a>
                </div>
                <div className="GitHubIcon">
                  <a href="https://github.com/smile-web-tech" target="_blank"><img src="icons/githubIcon.svg" alt="GitHub" style={{ height: '30px', width: '30px' }} /> </a> </div>
              </div>
              <a href="https://peachpuff-marten-860555.hostingersite.com/korpe" target="_blank">
                <img src="pictures/eCommerceWeb.png" alt="eCommerce" />
              </a>
              <div className="info">
                <h3>Comprehensive E-Commerce Platform</h3>
                <p>Designed and built a fully functional e-commerce website, offering powerful tools for businesses to manage their products, track inventory, and handle client information effectively.</p>
              </div>

              <div className="technologies flex">
                <small>HTML</small>
                <small>CSS</small>
                <small>JavaScript</small>
                <small>PHP</small>
                <small>Bootstrap5</small>
                <small>MySQL</small>
              </div>
            </div>

            <div className="card">
              <div className="external-links">
                <div className="WhatsAppIcon">
                  <a href="https://wa.me/36205021561" target="_blank">
                    <img src="icons/whatsApp.svg" alt="WhatsApp" style={{ height: '30px', width: '30px' }} />
                  </a>
                </div>
                <div className="GitHubIcon">
                  <a href="https://github.com/smile-web-tech/JetFurnitureApp" target="_blank"><img src="icons/githubIcon.svg" alt="GitHub" style={{ height: '30px', width: '30px' }} /></a> </div>
              </div>
              <a href="https://smiletech.dev/app/JetFurniture.apk" target="_blank">
                <img src="pictures/jetFurniture.png" alt="eCommerce" />
              </a>
              <div className="info">
                <h3>JetFurniture E-Commerce Ecosystem</h3>
                <p>Designed and developed a complete e-commerce solution featuring a native Android customer application and a responsive React.js admin dashboard. The system ensures real-time inventory synchronization, seamless order processing, and an intuitive shopping experience optimized for modern mobile devices.</p>
              </div>

              <div className="technologies flex">
                <small>Kotlin</small>
                <small>Jetpack Compose</small>
                <small>React.js</small>
                <small>Firebase</small>
                <small>Material Design 3</small>
              </div>
            </div>

          </div>
        </div>

      </section>

      <section id="education" className="section education">
        <div className="wave-bg"></div>
        <div className="container projectTitle">
          <h2>Work & Education</h2>
          <div className="exp-grid">
            <div className="exp-card">
              <img src="pictures/elte light.png" alt="Nokia Logo" />
              <div className="details">
                <h3>Eötvös Loránd University</h3>
                <p>Hungary - Budapest</p>
                <p>Bachelor of Science – BS, Computer Science.</p>
                <br />
                <span className="educationDate">Sep 2025 — Present</span>
              </div>
            </div>
            <div className="gunbatarLogo exp-card">
              <img src="pictures/logo.png" alt="GunbatarShapagy Logo" />
              <div className="details">
                <h3>"Gunbatar Shapagy" education center</h3>
                <p>Completed Web Development course inlucding DB</p>
                <p>Completed Python & Java course</p>
                <p>Mastered in Android app development</p>
                <span className="educationDate">Mar 2021 — Feb 2025</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="section-contact contact section">
  <div className="container contact-inner">
    <div className="contact-info flex">
      <div className="contact-title">
        <h2>SEND ME AN EMAIL</h2>
      </div>
      <div className="contact-forms">
        
        {/* Added ref and onSubmit */}
        <form ref={form} onSubmit={sendEmail}>
          <input 
            type="email" 
            name="user_email"
            placeholder="Your Email" 
            required 
          />
                    <input 
            type="name" 
            name="name"
            placeholder="Your name" 
            required 
          />
          <textarea 
            rows="4" 
            name="message" 
            placeholder="Your Message" 
            required
          ></textarea>

          
          <button type="submit" disabled={isSending}>
            {isSending ? 'Sending...' : 'Send'}
          </button>
          
        </form>
        
      </div>
    </div>
  </div>
</section>

      <section id="footer">
        <div className="footer-container">
          <div className="hero-image-wrap-footer">
            <div className="image-layer-footer">
              <img src="pictures/logoBack.png" alt="Background" className="background-img" />
            </div>
          </div>
          <div className="contact-links">
            <a href="#" ><div className="insta"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" className="icon" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z"></path></svg></div> @smile._.o7</a>
            <a href="tel:+36205190959">
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
                </svg></div>+36 20 519 0959</a>
            <a href="https://www.linkedin.com/in/ysmayyl-mammetgeldiyev-31b5b5383/" target="_blank"><div className="linkedin"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 1024 1024" className="icon" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zM349.3 793.7H230.6V411.9h118.7v381.8zm-59.3-434a68.8 68.8 0 1 1 68.8-68.8c-.1 38-30.9 68.8-68.8 68.8zm503.7 434H675.1V608c0-44.3-.8-101.2-61.7-101.2-61.7 0-71.2 48.2-71.2 98v188.9H423.7V411.9h113.8v52.2h1.6c15.8-30 54.5-61.7 112.3-61.7 120.2 0 142.3 79.1 142.3 181.9v209.4z"></path></svg></div> LinkedIn</a>
            <a href="mailto:smiletechweb@gmail.com"><div className="mail"><svg width="24px" height="24px" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="currentColor"><path strokeLinejoin="round" strokeWidth="12" d="M22 57.265V142c0 5.523 4.477 10 10 10h24V95.056l40 30.278 40-30.278V152h24c5.523 0 10-4.477 10-10V57.265c0-13.233-15.15-20.746-25.684-12.736L96 81.265 47.684 44.53C37.15 36.519 22 44.032 22 57.265Z" /></svg></div> smiletechweb@gmail.com</a>
            <div className="counter-wrapper">
              <div className="counter-icon">
                <i className="fa-solid fa-eye"></i> </div>
              <div className="counter-content">
                <span className="counter-label">Profile Views</span>
                <span id="view-count" className="counter-number">Loading...</span>
              </div>
            </div>
          </div>
        </div>
        <p className="mainFooter"><strong className="LightText">Design by: </strong>&nbsp; surai.tsa  &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; TrioWeb</p>

      </section>
    </div>
  )
}

export default App