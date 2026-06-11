import experienceJson from './experience.json';
import educationJson from './education.json';
import skillsJson from './skills.json';
import societiesJson from './societies.json';
import interestsJson from './interests.json';

export type ExperienceEntry = {
  role: string;
  org: string;
  period: string;
  bullets: string[];
};

export type EducationEntry = {
  school: string;
  degree: string;
  period: string;
  detail: string;
};

export type Skill = {
  name: string;
  icon?: string;
  emoji?: string;
};

export type SkillGroup = {
  group: string;
  items: Skill[];
};

export type Society = {
  role: string;
  org: string;
  url?: string;
  logo?: string;
};

export type Interest = {
  name: string;
  emoji: string;
  category: 'Tech' | 'Creative' | 'Knowledge' | 'Lifestyle';
};

export const experience = experienceJson.entries as ExperienceEntry[];
export const education = educationJson.entries as EducationEntry[];
export const skills = skillsJson.groups as SkillGroup[];
export const societies = societiesJson.memberships as Society[];
export const interests = interestsJson.items as Interest[];
