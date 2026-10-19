// Seeds the CMS with the portfolio content that used to be hardcoded in the site.
// Safe to re-run: it does nothing if content already exists. `--force` wipes content first.
import { prisma } from '../db.js';

const force = process.argv.includes('--force');

const settings = {
  name: 'Ysmayyl Mammetgeldiyev',
  jobTitle: 'Full-Stack Developer, Software Developer',
  bio: 'Motivated and detail-oriented Software Engineer with strong skills in software development, system administration, and web technologies. I enjoy taking on challenges, building efficient solutions, and bringing both technical precision and creativity to every project. Whether it’s developing applications, managing IT systems, or collaborating with a team, I aim to deliver reliable, high-quality results.',
  email: 'smiletechweb@gmail.com',
  phone: '+36 20 519 0959',
  profilePicUrl: '/pictures/smile-web.webp',
  heroBackgroundUrl: '/pictures/logoBack.webp',
  aboutImageUrl: '/pictures/smile2.webp',
  resumeUrl: '/files/Ysmayyl_Mammetgeldiyev.pdf',
  githubUrl: 'https://github.com/smile-web-tech',
  linkedinUrl: 'https://linkedin.com/in/ysmayyldev',
  footerCredit: 'surai.tsa | TrioWeb',
};

const gh = (url) => ({ label: 'GitHub', url, kind: 'github' });

const projects = [
  {
    title: 'AeroClaim Autopilot',
    description: 'Fully Autonomous, Voice-Native EU261 Aviation Compensation AI Agent. Replacing tedious legal forms with a single microphone interaction to recover flight compensation.',
    techStack: ['.NET 10', 'React 18', 'Groq / Llama 3.3', 'ElevenLabs', 'Docker', 'Tailwind v4'],
    thumbnailUrl: '/pictures/aero.jpeg',
    links: [
      { label: 'Hackathon Winner', url: 'https://aero-claim-auto-pilot.vercel.app/#', kind: 'highlight' },
      gh('https://github.com/smile-web-tech/AeroClaimAuto'),
    ],
  },
  {
    title: 'Gunbatar Education Center Website',
    description: 'Developed a comprehensive and fully functional website for an education center, providing a seamless platform for both teachers and students to interact and access resources.',
    techStack: ['HTML', 'CSS', 'JavaScript', 'PHP', 'Laravel', 'SQL'],
    thumbnailUrl: '/pictures/gunbatarWeb.png',
    links: [
      { label: 'Live Demo', url: 'https://peachpuff-marten-860555.hostingersite.com/', kind: 'button' },
      gh('https://github.com/smile-web-tech/gunbatar-website'),
    ],
  },
  {
    title: 'Gunbatar Education Center Mobile Application',
    description: 'Engineered a robust mobile application from the ground up for the education center using Kotlin and Firebase, enhancing accessibility and engagement for users on Android devices.',
    techStack: ['Java', 'FireBase', 'Android Studio'],
    thumbnailUrl: '/pictures/gunbatarApp.png',
    links: [gh('https://github.com/smile-web-tech/gunbatar-app')],
  },
  {
    title: 'International Science Olympiad Portal (IOSPO)',
    description: 'Created with team an online portal for the International Science Olympiad, featuring a custom content management system (CMS) to efficiently manage and publish content related to the event.',
    techStack: ['HTML', 'CSS', 'JavaScript', 'PHP', 'MySQL'],
    thumbnailUrl: '/pictures/iospo.png',
    links: [{ label: 'Visit Site', url: 'https://iospo.org', kind: 'button' }],
  },
  {
    title: 'Comprehensive E-Commerce Platform',
    description: 'Designed and built a fully functional e-commerce website, offering powerful tools for businesses to manage their products, track inventory, and handle client information effectively.',
    techStack: ['HTML', 'CSS', 'JavaScript', 'PHP', 'Bootstrap5', 'MySQL'],
    thumbnailUrl: '/pictures/eCommerceWeb.png',
    links: [
      { label: 'Live Demo', url: 'https://peachpuff-marten-860555.hostingersite.com/korpe', kind: 'button' },
      gh('https://github.com/smile-web-tech'),
    ],
  },
  {
    title: 'JetFurniture E-Commerce Ecosystem',
    description: 'Designed and developed a complete e-commerce solution featuring a native Android customer application and a responsive React.js admin dashboard. The system ensures real-time inventory synchronization, seamless order processing, and an intuitive shopping experience optimized for modern mobile devices.',
    techStack: ['Kotlin', 'Jetpack Compose', 'React.js', 'Firebase', 'Material Design 3'],
    thumbnailUrl: '/pictures/jetFurniture.png',
    links: [
      { label: 'Download Demo', url: 'https://smiletech.dev/app/JetFurniture.apk', kind: 'button' },
      gh('https://github.com/smile-web-tech/JetFurnitureApp'),
    ],
  },
  {
    title: 'JetChat: AI-Powered Personal Assistant',
    description: 'Developed a high-performance conversational AI application using Jetpack Compose and the Groq SDK for near-instant Llama 3.1 inference. The system features a custom-built RAG (Retrieval-Augmented Generation) engine that allows the AI to provide context-aware responses based on local knowledge bases.',
    techStack: ['Kotlin', 'Jetpack Compose', 'Firebase', 'RAG & Prompt Engineering'],
    thumbnailUrl: '/pictures/JetTemplateAi.png',
    links: [
      { label: 'Download Demo', url: 'https://smiletech.dev/app/JetChat.apk', kind: 'button' },
      gh('https://github.com/smile-web-tech/JetChatAi'),
    ],
  },
];

// Bullets use **bold** for emphasis.
const experience = [
  {
    company: 'StudentHub Mobile Application',
    role: 'Self-employed',
    location: 'Budapest, Hungary',
    logoUrl: '/pictures/studenthub_logo.png',
    startDate: new Date('2026-01-01'),
    endDate: null,
    showProgress: true,
    details: [
      {
        bullets: [
          '**Collaborating** with a backend developer to build a **full-stack mobile application** using **Kotlin (Jetpack Compose)**, **.NET 10 / C#** WebAPI, and **PostgreSQL**.',
          'Engineering a **smart dashboard** with **Canvas API** integration for assignment notifications, a **schedule management** system, an **Explore marketplace**, and **secure JWT authentication** with email OTP.',
          'Designing a distinctive **Pastel Neo-Brutalist UI** with tactile animations and a curated pastel color palette. **Currently under active development.**',
        ],
      },
    ],
  },
  {
    company: 'International Online Subject and Project Olympiad (IOSPO)',
    role: 'Web Developer',
    location: 'Almaty, Kazakhstan (Remotely)',
    logoUrl: '/pictures/iospoLogo.png',
    startDate: new Date('2025-06-01'),
    endDate: new Date('2025-08-01'),
    details: [
      {
        title: 'IOSPO Student & Admin Portal Website',
        url: 'https://iospo.org',
        bullets: [
          '**Collaborated** with a team to build the official IOSPO website completely from **scratch**.',
          '**Developed** the student and admin portals, including a user-friendly and **secure dashboard** interface.',
          'Implemented **login** and **password authentication** to strengthen system security.',
          'Built a full **CRUD system** to manage users and data efficiently.',
          'Designed, managed, and optimized the project’s **MySQL database,** ensuring stability and scalability.',
        ],
      },
    ],
  },
  {
    company: 'Gunbatar Shapagy education center',
    role: 'Software Developer',
    location: 'Balkanabat, Turkmenistan',
    logoUrl: '/pictures/logo.png',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2025-02-01'),
    details: [
      {
        title: 'Full-Stack Web Application for Education Center Management',
        url: 'https://peachpuff-marten-860555.hostingersite.com/',
        bullets: [
          'Led a **team** to deliver a full-featured website from scratch, implementing both frontend **(HTML, CSS, JavaScript)** and **backend (Laravel, PHP)** components.',
          'Main **landing pages** with **responsive** design.',
          '**Online registration form** with validation and **secure data** handling.',
          '**Student** and **Teacher** portal with role-based access and full **CRUD** functionality in Laravel.',
          'Handled **server deployment** and **hosting** configuration, ensuring reliable uptime.',
        ],
      },
      {
        title: 'Education Center Mobile Application',
        bullets: [
          '**Developed** and **launched** a mobile application using **Java (Android Studio)**, integrating all **website features**, connected to **Firebase**, and successfully published it on the **Google Play Store**.',
          'Designed and optimized the **MySQL** database for the web platform, and used **Firebase** for managing real-time data in the **mobile app.**',
        ],
      },
    ],
  },
  {
    company: 'Freelance IT & Cybersecurity services',
    role: 'Self employed',
    location: 'Balkanabat, Turkmenistan',
    logoUrl: '/icons/elite.png',
    startDate: new Date('2022-03-01'),
    endDate: new Date('2025-08-01'),
    details: [
      {
        bullets: [
          '**Hosted and managed** a virtual private server on **Ubuntu (Linux)**, deploying custom scripts and VPN solutions to **bypass censorship and enhance privacy for 200+ clients.**',
          'Oversaw server maintenance, **security protocols**, and troubleshooting in a **Linux environment.**',
          '**Collaborated with an international remote team** to optimize service performance and scalability',
        ],
      },
    ],
  },
];

const education = [
  {
    institution: 'Eötvös Loránd University',
    degree: 'Bachelor of Science – BS, Computer Science.',
    location: 'Hungary - Budapest',
    logoUrl: '/pictures/elte light.png',
    startDate: new Date('2025-09-01'),
    endDate: null,
    bullets: [],
  },
  {
    institution: '"Gunbatar Shapagy" education center',
    degree: null,
    location: null,
    logoUrl: '/pictures/logo.png',
    startDate: new Date('2021-03-01'),
    endDate: new Date('2025-02-01'),
    bullets: [
      'Completed Web Development course including DB',
      'Completed Python & Java course',
      'Mastered in Android app development',
    ],
  },
];

const skillGroups = {
  Languages: [
    ['HTML5', '/icons/skills/html-5.svg'],
    ['CSS3', '/icons/skills/css3.svg'],
    ['JavaScript', '/icons/skills/javascript.svg'],
    ['Java', '/icons/skills/java.svg'],
    ['PHP', '/icons/skills/php.svg'],
    ['SQL', '/icons/skills/sql.svg'],
    ['Kotlin', '/icons/skills/kotlin.svg'],
  ],
  'Frameworks & Libraries': [
    ['React.JS', '/icons/skills/react-js.svg'],
    ['Laravel', '/icons/skills/laravel.svg'],
    ['Django', '/icons/skills/django.svg'],
    ['Firebase', '/icons/skills/firebase.svg'],
    ['Jetpack Compose', '/icons/jetpack.png'],
    ['Bootstrap5', '/icons/skills/bootstrap5.svg'],
    ['Tailwind CSS', '/icons/skills/tailwind-css.svg'],
  ],
  'Developer Tools': [
    ['Android Studio', '/icons/android.svg'],
    ['MySQL', '/icons/skills/mysql.svg'],
    ['Cisco Packet Tracer', '/icons/cisco.svg'],
    ['Nginx', '/icons/skills/nginx.svg'],
    ['Git', '/icons/skills/git.svg'],
    ['GitHub', '/icons/skills/github.svg'],
    ['Figma', '/icons/skills/figma.svg'],
    ['Docker', '/icons/skills/docker.svg'],
  ],
};

const withOrder = (rows) => rows.map((row, sortOrder) => ({ ...row, sortOrder }));

async function main() {
  const existing = await prisma.project.count() + (await prisma.experience.count()) + (await prisma.skill.count());
  if (existing > 0 && !force) {
    console.log('Content already exists, skipping seed. Use --force to wipe and reseed.');
    return;
  }

  const skills = Object.entries(skillGroups).flatMap(([category, items]) =>
    items.map(([name, iconUrl]) => ({ category, name, iconUrl })),
  );

  await prisma.$transaction([
    prisma.project.deleteMany(),
    prisma.experience.deleteMany(),
    prisma.education.deleteMany(),
    prisma.skill.deleteMany(),
    prisma.generalSettings.deleteMany(),
    prisma.generalSettings.create({ data: { id: 1, ...settings } }),
    prisma.project.createMany({ data: withOrder(projects) }),
    prisma.experience.createMany({ data: withOrder(experience) }),
    prisma.education.createMany({ data: withOrder(education) }),
    prisma.skill.createMany({ data: withOrder(skills) }),
  ]);
  console.log(`Seeded: ${projects.length} projects, ${experience.length} experience, ${education.length} education, ${skills.length} skills.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
