import express from 'express';
import cors from 'cors';
import projectRoutes from './routes/projects.js';
import experienceRoutes from './routes/experience.js';
import educationRoutes from './routes/education.js';
import skillsRoutes from './routes/skills.js';
import settingsRoutes from './routes/settings.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/experience', experienceRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
