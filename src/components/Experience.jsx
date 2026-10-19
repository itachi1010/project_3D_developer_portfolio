import React, { useEffect, useState } from "react";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import { motion } from "framer-motion";

import "react-vertical-timeline-component/style.min.css";

import { styles } from "../styles";
import { experiences as fallbackExperiences } from "../constants";
import { SectionWrapper } from "../hoc";
import { textVariant } from "../utils/motion";
import { meta, shopify, starbucks, tesla } from "../assets";

const defaultIcons = [starbucks, tesla, shopify, meta];
const defaultColors = ["#383E56", "#E6DEDD", "#383E56", "#E6DEDD"];

const normalizeExperience = (experience, index) => ({
  ...experience,
  title: experience.title || 'Portfolio role',
  company_name: experience.company_name || 'Company',
  date: experience.date || 'Present',
  location: experience.location || '',
  points: Array.isArray(experience.points) && experience.points.length
    ? experience.points
    : [experience.description || 'Worked on meaningful portfolio work.'],
  icon: experience.icon || defaultIcons[index % defaultIcons.length],
  iconBg: experience.iconBg || defaultColors[index % defaultColors.length],
});

const ExperienceCard = ({ experience }) => {
  return (
    <VerticalTimelineElement
      contentStyle={{
        background: "#1d1836",
        color: "#fff",
      }}
      contentArrowStyle={{ borderRight: "7px solid  #232631" }}
      date={experience.date}
      iconStyle={{ background: experience.iconBg }}
      icon={
        <div className='flex justify-center items-center w-full h-full'>
          <img
            src={experience.icon}
            alt={experience.company_name}
            className='w-[60%] h-[60%] object-contain'
          />
        </div>
      }
    >
      <div>
        <h3 className='text-white text-[24px] font-bold'>{experience.title}</h3>
        <p
          className='text-secondary text-[16px] font-semibold'
          style={{ margin: 0 }}
        >
          {experience.company_name}
        </p>
      </div>

      <ul className='mt-5 list-disc ml-5 space-y-2'>
        {experience.points.map((point, index) => (
          <li
            key={`experience-point-${index}`}
            className='text-white-100 text-[14px] pl-1 tracking-wider'
          >
            {point}
          </li>
        ))}
      </ul>
    </VerticalTimelineElement>
  );
};

const Experience = () => {
  const [experiences, setExperiences] = useState(fallbackExperiences);

  useEffect(() => {
    const loadExperiences = async () => {
      try {
        const response = await fetch('/api/jobs');
        const data = await response.json();

        if (Array.isArray(data.jobs) && data.jobs.length > 0) {
          setExperiences(data.jobs.map(normalizeExperience));
        }
      } catch (error) {
        console.error('Failed to load portfolio jobs:', error);
      }
    };

    loadExperiences();
  }, []);

  const visibleExperiences = experiences.map((experience, index) => normalizeExperience(experience, index));

  return (
    <>
      <motion.div variants={textVariant()}>
        <p className={`${styles.sectionSubText} text-center`}>
          What I have done so far
        </p>
        <h2 className={`${styles.sectionHeadText} text-center`}>
          Work Experience.
        </h2>
      </motion.div>

      <div className='mt-20 flex flex-col'>
        <VerticalTimeline>
          {visibleExperiences.map((experience, index) => (
            <ExperienceCard
              key={`experience-${index}`}
              experience={experience}
            />
          ))}
        </VerticalTimeline>
      </div>
    </>
  );
};

export default SectionWrapper(Experience, "work");
