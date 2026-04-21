import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

export function usePortfolioApi() {
  const [data, setData] = useState({
    projects: [],
    experience: [],
    education: [],
    skills: [],
    settings: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [projectsRes, expRes, eduRes, skillsRes, settingsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/projects`),
          fetch(`${API_BASE_URL}/experience`),
          fetch(`${API_BASE_URL}/education`),
          fetch(`${API_BASE_URL}/skills`),
          fetch(`${API_BASE_URL}/settings`)
        ]);

        const projects = projectsRes.ok ? await projectsRes.json() : [];
        const experience = expRes.ok ? await expRes.json() : [];
        const education = eduRes.ok ? await eduRes.json() : [];
        const skills = skillsRes.ok ? await skillsRes.json() : [];
        const settings = settingsRes.ok ? await settingsRes.json() : null;

        setData({ projects, experience, education, skills, settings });
      } catch (err) {
        console.error("Failed to fetch portfolio data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  return { ...data, loading };
}
