import { prisma } from '../db.js'

async function main() {
  console.log('Start seeding...')

  // 1. General Settings
  await prisma.generalSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Ysmayyl Mammetgeldiyev',
      jobTitle: 'Full-Stack Developer, Software Developer',
      bio: 'Motivated and detail-oriented Software Engineer with strong skills in software development, system administration, and web technologies. Enjoys taking on challenges, building efficient solutions, and bringing technical precision and creativity to every project.',
      email: 'smiletechweb@gmail.com',
    },
  })

  // 2. Experience
  const experiences = [
    {
      company: 'StudentHub Mobile Application (Self-employed)',
      role: 'Full-Stack Developer',
      startDate: new Date('2026-01-01'),
      endDate: null,
      description: 'Collaborating with a backend developer to build a full-stack mobile app using Kotlin (Jetpack Compose), .NET 10/C# WebAPI, and PostgreSQL. Features Canvas API integration, schedule management, Explore marketplace, and JWT authentication.'
    },
    {
      company: 'International Online Subject and Project Olympiad (IOSPO)',
      role: 'Web Developer',
      startDate: new Date('2025-04-01'),
      endDate: new Date('2025-08-01'),
      description: 'Built official website, student/admin portals, authentication, and MySQL admin.'
    },
    {
      company: 'Gunbatar Shapagy Education Center',
      role: 'Software Developer',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-02-01'),
      description: 'Built full-stack web app with Laravel/PHP, online registration, and launched a mobile app using Java, Android Studio, and Firebase onto the Google Play Store.'
    },
    {
      company: 'Self-Employed (Remote)',
      role: 'IT & Cybersecurity Services',
      startDate: new Date('2022-03-01'),
      endDate: new Date('2025-08-01'),
      description: 'Hosted/managed Linux servers, deployed custom VPNs to bypass censorship, and worked with an international remote team.'
    }
  ];

  for (const exp of experiences) {
    await prisma.experience.create({ data: exp })
  }

  // 3. Projects
  const projects = [
    {
      title: 'StudentHub',
      description: 'Cross-Platform Student Companion App featuring Canvas API integration and smart dashboard.',
      techStack: ['Kotlin', 'Jetpack Compose', '.NET 10', 'PostgreSQL'],
      isFeatured: true
    },
    {
      title: 'Gunbatar Education Center Website',
      description: 'Full-stack web application with online registration and student portals.',
      techStack: ['HTML', 'CSS', 'JS', 'PHP', 'Laravel', 'SQL'],
      isFeatured: true
    },
    {
      title: 'Gunbatar Education Center Mobile App',
      description: 'Android application launched on Google Play store.',
      techStack: ['Java', 'Firebase', 'Android Studio'],
      isFeatured: true
    },
    {
      title: 'IOSPO Portal',
      description: 'Student and admin portals for Olympiad registrations and results.',
      techStack: ['HTML', 'CSS', 'JS', 'PHP', 'MySQL'],
      isFeatured: false
    },
    {
      title: 'Comprehensive E-Commerce Platform',
      description: 'Full featured online shop with shopping cart and auth.',
      techStack: ['HTML', 'CSS', 'JS', 'PHP', 'Bootstrap5', 'MySQL'],
      isFeatured: false
    },
    {
      title: 'JetFurniture E-Commerce Ecosystem',
      description: 'Modern mobile app front-end for online furniture ordering.',
      techStack: ['Kotlin', 'Jetpack Compose', 'React.js', 'Firebase'],
      isFeatured: false
    },
    {
      title: 'JetChat AI-Powered Personal Assistant',
      description: 'Mobile chat application powered by LLaMA 3.1.',
      techStack: ['Kotlin', 'Jetpack Compose', 'Firebase', 'RAG', 'LLaMA 3.1'],
      isFeatured: true
    }
  ];

  for (const proj of projects) {
    await prisma.project.create({ data: proj })
  }

  // 4. Education
  const educations = [
    {
      institution: 'Eötvös Loránd University (ELTE)',
      degree: 'BSc in Computer Science',
      startDate: new Date('2025-09-01'),
      endDate: null,
      gpa: ''
    },
    {
      institution: 'Gunbatar Shapagy Education Center',
      degree: 'Web Development, Java, Android App Development',
      startDate: new Date('2021-03-01'),
      endDate: new Date('2025-02-01'),
      gpa: ''
    }
  ];

  for (const edu of educations) {
    await prisma.education.create({ data: edu })
  }

  // 5. Skills
  const skills = [
    { category: 'Languages', name: 'HTML5' },
    { category: 'Languages', name: 'CSS3' },
    { category: 'Languages', name: 'JavaScript' },
    { category: 'Languages', name: 'Java' },
    { category: 'Languages', name: 'PHP' },
    { category: 'Languages', name: 'SQL' },
    { category: 'Languages', name: 'Kotlin' },
    { category: 'Frameworks', name: 'ReactJS' },
    { category: 'Frameworks', name: 'Laravel' },
    { category: 'Frameworks', name: 'Django' },
    { category: 'Frameworks', name: 'Jetpack Compose' },
    { category: 'Tools', name: 'Firebase' },
    { category: 'Tools', name: 'Docker' },
    { category: 'Tools', name: 'Nginx' },
    { category: 'Tools', name: 'Git' }
  ];

  for (const skill of skills) {
    await prisma.skill.create({ data: skill })
  }

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
