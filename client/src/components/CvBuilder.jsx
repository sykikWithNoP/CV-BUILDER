import { useMemo, useState } from 'react';
import { Box, Button, Stack } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import BoltIcon from '@mui/icons-material/Bolt';
import LanguageIcon from '@mui/icons-material/Language';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import InterestsIcon from '@mui/icons-material/Interests';
import PaletteIcon from '@mui/icons-material/Palette';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';

import SectionCard from './builder/SectionCard';
import PersonalSection from './builder/PersonalSection';
import SummarySection from './builder/SummarySection';
import ExperienceSection from './builder/ExperienceSection';
import EducationSection from './builder/EducationSection';
import RatedListSection from './builder/RatedListSection';
import CertificationsSection from './builder/CertificationsSection';
import HobbiesSection from './builder/HobbiesSection';
import ThemeSection from './builder/ThemeSection';
import useCvForm from '../hooks/useCvForm';
import { LANGUAGE_LEVELS, SKILL_LEVELS } from '../constants/cv';
import { hobbiesToList } from '../utils/cv';

/**
 * The CV editor. Each section is its own collapsible card so the form can be
 * worked through top to bottom without scrolling past everything at once.
 */
export default function CvBuilder({ data, setData }) {
  const form = useCvForm(setData);
  const [open, setOpen] = useState(() => new Set(['personal']));

  const list = (name) => (Array.isArray(data[name]) ? data[name] : []);

  const sections = useMemo(() => {
    const experience = list('experience');
    const education = list('education');
    const skills = list('skills');
    const languages = list('languages');
    const certifications = list('certifications');
    const hobbies = hobbiesToList(data.hobbies);

    return [
      {
        key: 'personal',
        title: 'Personal details',
        hint: 'Name, job title and how employers reach you',
        icon: <PersonIcon />,
        complete: !!(data.firstName?.trim() && data.lastName?.trim() && data.jobTitle?.trim() && data.email?.trim()),
        render: () => <PersonalSection data={data} setField={form.setField} />,
      },
      {
        key: 'summary',
        title: 'Professional summary',
        hint: 'The short pitch at the top of the page',
        icon: <DescriptionIcon />,
        complete: (data.summary || '').trim().length >= 40,
        render: () => <SummarySection data={data} setField={form.setField} />,
      },
      {
        key: 'experience',
        title: 'Experience',
        hint: 'Roles, dates and what you achieved',
        icon: <WorkIcon />,
        count: experience.length,
        complete: experience.some((e) => e.title?.trim() && e.company?.trim()),
        render: () => <ExperienceSection entries={experience} form={form} />,
      },
      {
        key: 'education',
        title: 'Education',
        hint: 'Degrees, diplomas and courses',
        icon: <SchoolIcon />,
        count: education.length,
        complete: education.some((e) => e.degree?.trim() || e.school?.trim()),
        render: () => <EducationSection entries={education} form={form} />,
      },
      {
        key: 'skills',
        title: 'Skills',
        hint: 'What you can do, and how well',
        icon: <BoltIcon />,
        count: skills.length,
        complete: skills.some((s) => s.name?.trim()),
        render: () => (
          <RatedListSection
            section="skills"
            entries={skills}
            form={form}
            levels={SKILL_LEVELS}
            nameLabel="Skill"
            levelLabel="Level"
            addLabel="Add skill"
            placeholder="React, SQL, Project management…"
            emptyHint="List the skills the job advert asks for, strongest first."
          />
        ),
      },
      {
        key: 'languages',
        title: 'Languages',
        hint: 'Spoken and written languages',
        icon: <LanguageIcon />,
        count: languages.length,
        complete: languages.some((l) => l.name?.trim()),
        render: () => (
          <RatedListSection
            section="languages"
            entries={languages}
            form={form}
            levels={LANGUAGE_LEVELS}
            nameLabel="Language"
            levelLabel="Proficiency"
            addLabel="Add language"
            placeholder="English, Nepali…"
            emptyHint="Add any language you can work in."
          />
        ),
      },
      {
        key: 'certifications',
        title: 'Certifications',
        hint: 'Credentials and their verification links',
        icon: <WorkspacePremiumIcon />,
        count: certifications.length,
        complete: certifications.some((c) => c.name?.trim()),
        render: () => <CertificationsSection entries={certifications} form={form} />,
      },
      {
        key: 'hobbies',
        title: 'Hobbies',
        hint: 'Optional — keep it short',
        icon: <InterestsIcon />,
        count: hobbies.length,
        complete: hobbies.length > 0,
        render: () => <HobbiesSection data={data} setField={form.setField} />,
      },
      {
        key: 'theme',
        title: 'Colour theme',
        hint: 'Accent colours used inside the CV',
        icon: <PaletteIcon />,
        complete: !!data.theme?.a,
        render: () => <ThemeSection data={data} setField={form.setField} />,
      },
    ];
  }, [data, form]);

  const allOpen = open.size === sections.length;

  const toggleSection = (key) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleAll = () =>
    setOpen(allOpen ? new Set() : new Set(sections.map((s) => s.key)));

  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
        <Button
          size="small"
          startIcon={allOpen ? <UnfoldLessIcon /> : <UnfoldMoreIcon />}
          onClick={toggleAll}
          sx={{ color: 'text.secondary' }}
        >
          {allOpen ? 'Collapse all' : 'Expand all'}
        </Button>
      </Stack>

      {sections.map((section) => (
        <SectionCard
          key={section.key}
          icon={section.icon}
          title={section.title}
          hint={section.hint}
          count={section.count}
          complete={section.complete}
          expanded={open.has(section.key)}
          onToggle={() => toggleSection(section.key)}
        >
          {section.render()}
        </SectionCard>
      ))}
    </Box>
  );
}
