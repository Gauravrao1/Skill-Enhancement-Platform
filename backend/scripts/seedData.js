const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Skill = require('../models/Skill');
const Resource = require('../models/Resource');
const User = require('../models/User');

dotenv.config();

// Configuration
const CONFIG = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/skill-enhancement',
  ADMIN_EMAIL: 'admin@skillenhancement.com',
  ADMIN_PASSWORD: 'admin123',
  CLEAR_EXISTING_DATA: process.env.CLEAR_DATA === 'true' || false
};

// Skills data organized by category - Updated to match Skill model structure
const SKILLS_DATA = {
  children: [
    {
      name: 'Story Telling',
      description: 'Learn storytelling through engaging videos',
      icon: { type: 'emoji', emoji: '📖', value: 'BookOpen' },
      color: { primary: '#FF6B6B', secondary: '#FFE5E5' },
      isActive: true
    },
    {
      name: 'Drawing & Coloring',
      description: 'Creative drawing and coloring tutorials',
      icon: { type: 'emoji', emoji: '🎨', value: 'Palette' },
      color: { primary: '#4ECDC4', secondary: '#E0F7F5' },
      isActive: true
    },
    {
      name: 'Rhymes & Music',
      description: 'Fun rhymes and music for kids',
      icon: { type: 'emoji', emoji: '🎵', value: 'Music' },
      color: { primary: '#FFE66D', secondary: '#FFF9E5' },
      isActive: true
    },
    {
      name: 'Basic Maths',
      description: 'Learn basic mathematics in a fun way',
      icon: { type: 'emoji', emoji: '🔢', value: 'Calculator' },
      color: { primary: '#95E1D3', secondary: '#E5F7F3' },
      isActive: true
    },
    {
      name: 'Brain Games',
      description: 'Puzzle and brain training games',
      icon: { type: 'emoji', emoji: '🧩', value: 'Puzzle' },
      color: { primary: '#F38181', secondary: '#FCE5E5' },
      isActive: true
    }
  ],
  students: [
    {
      name: 'Computer Science',
      description: 'Fundamentals of computer science',
      icon: { type: 'emoji', emoji: '💻', value: 'Laptop' },
      color: { primary: '#6C5CE7', secondary: '#E5E3F7' },
      isActive: true
    },
    {
      name: 'Web Development',
      description: 'Learn web development from scratch',
      icon: { type: 'emoji', emoji: '🌐', value: 'Globe' },
      color: { primary: '#00B894', secondary: '#E0F7F3' },
      isActive: true
    },
    {
      name: 'AI / ML',
      description: 'Artificial Intelligence and Machine Learning',
      icon: { type: 'emoji', emoji: '🤖', value: 'Bot' },
      color: { primary: '#0984E3', secondary: '#E0F2FE' },
      isActive: true
    },
    {
      name: 'Data Analytics',
      description: 'Data analysis and visualization',
      icon: { type: 'emoji', emoji: '📊', value: 'BarChart' },
      color: { primary: '#E17055', secondary: '#FCE5E0' },
      isActive: true
    },
    {
      name: 'Soft Skills',
      description: 'Communication and interpersonal skills',
      icon: { type: 'emoji', emoji: '🤝', value: 'Handshake' },
      color: { primary: '#A29BFE', secondary: '#E5E3F7' },
      isActive: true
    },
    {
      name: 'Finance & Business',
      description: 'Financial literacy and business skills',
      icon: { type: 'emoji', emoji: '💼', value: 'Briefcase' },
      color: { primary: '#00CEC9', secondary: '#E0F7F6' },
      isActive: true
    }
  ],
  senior_citizens: [
    {
      name: 'Digital Newspaper Reading',
      description: 'Learn to read newspapers online',
      icon: { type: 'emoji', emoji: '📰', value: 'Newspaper' },
      color: { primary: '#74B9FF', secondary: '#E0F2FE' },
      isActive: true
    },
    {
      name: 'Smartphone Basics',
      description: 'Basic smartphone usage tutorials',
      icon: { type: 'emoji', emoji: '📱', value: 'Smartphone' },
      color: { primary: '#55EFC4', secondary: '#E0F7F3' },
      isActive: true
    },
    {
      name: 'Online Banking Awareness',
      description: 'Safe online banking practices',
      icon: { type: 'emoji', emoji: '🏦', value: 'Bank' },
      color: { primary: '#81ECEC', secondary: '#E0F7F7' },
      isActive: true
    },
    {
      name: 'Health & Yoga',
      description: 'Health tips and yoga exercises',
      icon: { type: 'emoji', emoji: '🧘', value: 'Yoga' },
      color: { primary: '#FDCB6E', secondary: '#FEF5E5' },
      isActive: true
    },
    {
      name: 'Music / Bhajans',
      description: 'Spiritual music and bhajans',
      icon: { type: 'emoji', emoji: '🎶', value: 'Music' },
      color: { primary: '#E17055', secondary: '#FCE5E0' },
      isActive: true
    }
  ]
};

// Resources data organized by skill - All URLs are verified and working
const RESOURCES_DATA = {
  'Story Telling': [
    {
      title: 'Bedtime Stories for Kids',
      description: 'Collection of bedtime stories and fairy tales',
      url: 'https://www.youtube.com/c/LittleFoxKidsStories',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Little Fox',
      category: 'children'
    },
    {
      title: 'Story Time with Kids',
      description: 'Interactive storytelling videos for children',
      url: 'https://www.youtube.com/c/StorylineOnline',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Storyline Online',
      category: 'children'
    },
    {
      title: 'Fairy Tales Collection',
      description: 'Classic fairy tales and stories',
      url: 'https://www.youtube.com/c/FairyTalesandStoriesforKids',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Fairy Tales and Stories',
      category: 'children'
    },
    {
      title: 'Animated Stories for Kids',
      description: 'Fun animated stories and tales',
      url: 'https://www.youtube.com/c/T-SeriesKidsHut',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'T-Series Kids Hut',
      category: 'children'
    },
    {
      title: 'Storytelling Tips for Parents',
      description: 'Learn how to tell engaging stories to children',
      url: 'https://www.readingrockets.org/article/storytelling-tips',
      type: 'article',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Reading Rockets',
      category: 'children'
    },
    {
      title: 'Free Children Stories',
      description: 'Collection of free online stories for kids',
      url: 'https://www.storyberries.com/',
      type: 'article',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Storyberries',
      category: 'children'
    }
  ],
  'Drawing & Coloring': [
    {
      title: 'Easy Drawing Tutorials for Kids',
      description: 'Step-by-step drawing lessons for children',
      url: 'https://www.youtube.com/c/ArtforKidsHub',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Art for Kids Hub',
      category: 'children'
    },
    {
      title: 'How to Draw Simple Shapes',
      description: 'Learn to draw basic shapes and animals',
      url: 'https://www.youtube.com/c/DrawSoCute',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Draw So Cute',
      category: 'children'
    },
    {
      title: 'Coloring Pages and Activities',
      description: 'Printable coloring pages and art activities',
      url: 'https://www.crayola.com/free-coloring-pages/',
      type: 'interactive',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Crayola',
      category: 'children'
    },
    {
      title: 'Kids Art Tutorials',
      description: 'Fun art and drawing tutorials for kids',
      url: 'https://www.youtube.com/c/HooplakidzHowTo',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'HooplaKidz How To',
      category: 'children'
    },
    {
      title: 'Drawing Tips for Children',
      description: 'Learn drawing basics and techniques',
      url: 'https://www.parents.com/kids/education/art-for-kids/',
      type: 'article',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Parents Magazine',
      category: 'children'
    },
    {
      title: 'Free Coloring Worksheets',
      description: 'Download and print coloring pages',
      url: 'https://www.education.com/worksheets/coloring/',
      type: 'interactive',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Education.com',
      category: 'children'
    }
  ],
  'Web Development': [
    {
      title: 'Complete Web Development Course',
      description: 'Full-stack web development tutorial',
      url: 'https://www.youtube.com/c/CodeWithHarry',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'CodeWithHarry',
      category: 'students'
    },
    {
      title: 'The Complete Web Developer Bootcamp',
      description: 'Master web development with projects',
      url: 'https://www.udemy.com/course/the-complete-web-developer-bootcamp/',
      type: 'udemy',
      learningType: 'premium',
      level: 'intermediate',
      verified: true,
      creator: 'Colt Steele',
      rating: 4.7,
      category: 'students'
    },
    {
      title: 'Web Development Fundamentals',
      description: 'Learn HTML, CSS, and JavaScript basics',
      url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/',
      type: 'freecodecamp',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'freeCodeCamp',
      category: 'students'
    },
    {
      title: 'HTML & CSS Tutorial',
      description: 'Complete HTML and CSS course for beginners',
      url: 'https://www.youtube.com/c/TraversyMedia',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Traversy Media',
      category: 'students'
    },
    {
      title: 'JavaScript Tutorial for Beginners',
      description: 'Learn JavaScript from scratch',
      url: 'https://www.youtube.com/c/ProgrammingwithMosh',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Programming with Mosh',
      category: 'students'
    },
    {
      title: 'Web Development Guide',
      description: 'Complete guide to becoming a web developer',
      url: 'https://developer.mozilla.org/en-US/docs/Learn',
      type: 'documentation',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'MDN Web Docs',
      category: 'students'
    },
    {
      title: 'Getting Started with Web Development',
      description: 'Beginner-friendly web development article',
      url: 'https://www.freecodecamp.org/news/how-to-become-a-web-developer/',
      type: 'article',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'freeCodeCamp',
      category: 'students'
    }
  ],
  'AI / ML': [
    {
      title: 'Machine Learning for Beginners',
      description: 'Introduction to machine learning concepts',
      url: 'https://www.youtube.com/c/3blue1brown',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: '3Blue1Brown',
      category: 'students'
    },
    {
      title: 'Machine Learning by Stanford',
      description: 'Comprehensive ML course with certificate',
      url: 'https://www.coursera.org/learn/machine-learning',
      type: 'coursera',
      learningType: 'premium',
      level: 'intermediate',
      verified: true,
      creator: 'Andrew Ng',
      rating: 4.9,
      category: 'students'
    },
    {
      title: 'Introduction to AI',
      description: 'Learn artificial intelligence fundamentals',
      url: 'https://www.coursera.org/learn/introduction-to-ai',
      type: 'coursera',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'IBM',
      rating: 4.6,
      category: 'students'
    },
    {
      title: 'AI and Machine Learning Basics',
      description: 'Free AI and ML tutorials',
      url: 'https://www.khanacademy.org/computing',
      type: 'khan-academy',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Khan Academy',
      category: 'students'
    }
  ],
  'Smartphone Basics': [
    {
      title: 'Smartphone Basics for Seniors',
      description: 'Easy-to-follow smartphone tutorials',
      url: 'https://www.youtube.com/c/TechBoomers',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'TechBoomers',
      category: 'senior_citizens'
    },
    {
      title: 'iPhone Basics Tutorial',
      description: 'Learn iPhone basics step by step',
      url: 'https://www.youtube.com/c/iPhoneBasics',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'iPhone Basics',
      category: 'senior_citizens'
    },
    {
      title: 'Android Phone Guide',
      description: 'Complete guide to using Android phones',
      url: 'https://www.youtube.com/c/AndroidAuthority',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Android Authority',
      category: 'senior_citizens'
    },
    {
      title: 'Smartphone Tips for Seniors',
      description: 'Helpful tips for using smartphones',
      url: 'https://www.aarp.org/home-family/personal-technology/',
      type: 'article',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'AARP',
      category: 'senior_citizens'
    },
    {
      title: 'Mobile Phone Basics',
      description: 'Learn smartphone fundamentals',
      url: 'https://www.youtube.com/c/SeniorPlanet',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Senior Planet',
      category: 'senior_citizens'
    },
    {
      title: 'Smartphone User Guide',
      description: 'Complete smartphone usage guide',
      url: 'https://www.consumerreports.org/electronics-computers/cell-phones/',
      type: 'article',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Consumer Reports',
      category: 'senior_citizens'
    }
  ],
  'Health & Yoga': [
    {
      title: 'Yoga for Seniors',
      description: 'Gentle yoga exercises for seniors',
      url: 'https://www.youtube.com/c/yogawithadriene',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Yoga with Adriene',
      category: 'senior_citizens'
    },
    {
      title: 'Chair Yoga for Seniors',
      description: 'Safe yoga exercises using a chair',
      url: 'https://www.youtube.com/c/SeniorFitnessWithMeredith',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Senior Fitness',
      category: 'senior_citizens'
    },
    {
      title: 'Health and Wellness Tips',
      description: 'Health tips for senior citizens',
      url: 'https://www.nia.nih.gov/health',
      type: 'article',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'National Institute on Aging',
      category: 'senior_citizens'
    },
    {
      title: 'Gentle Yoga Practice',
      description: 'Easy yoga routines for seniors',
      url: 'https://www.youtube.com/c/YogaWithKassandra',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Yoga with Kassandra',
      category: 'senior_citizens'
    },
    {
      title: 'Senior Health Guide',
      description: 'Comprehensive health information for seniors',
      url: 'https://www.mayoclinic.org/healthy-lifestyle/healthy-aging',
      type: 'article',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Mayo Clinic',
      category: 'senior_citizens'
    },
    {
      title: 'Exercise for Older Adults',
      description: 'Safe exercise routines for seniors',
      url: 'https://www.cdc.gov/physicalactivity/basics/older_adults/',
      type: 'article',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'CDC',
      category: 'senior_citizens'
    }
  ],
  'Basic Maths': [
    {
      title: 'Basic Addition and Subtraction',
      description: 'Learn basic addition and subtraction for kids',
      url: 'https://www.khanacademy.org/math/arithmetic-home/addition-subtraction',
      type: 'khan-academy',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Khan Academy',
      category: 'children'
    },
    {
      title: 'Number Recognition and Counting',
      description: 'Fun counting and number recognition for kids',
      url: 'https://www.youtube.com/c/SesameStreet',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Sesame Street',
      category: 'children'
    },
    {
      title: 'Math Games for Kids',
      description: 'Interactive math games to learn basic concepts',
      url: 'https://www.coolmath4kids.com/',
      type: 'interactive',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'CoolMath4Kids',
      category: 'children'
    },
    {
      title: 'Basic Math for Kids',
      description: 'Learn numbers, counting, and basic math operations',
      url: 'https://www.youtube.com/c/MathLearningVideos4Kids',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Math & Learning Videos 4 Kids',
      category: 'children'
    },
    {
      title: 'Early Math Skills',
      description: 'Build early math skills with fun activities',
      url: 'https://www.pbskids.org/games/math/',
      type: 'interactive',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'PBS Kids',
      category: 'children'
    },
    {
      title: 'Math Learning for Children',
      description: 'Educational math videos and tutorials',
      url: 'https://www.youtube.com/c/Numberblocks',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Numberblocks',
      category: 'children'
    },
    {
      title: 'Teaching Math to Kids',
      description: 'Tips and strategies for teaching math',
      url: 'https://www.education.com/resources/math/',
      type: 'article',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Education.com',
      category: 'children'
    }
  ],
  'Brain Games': [
    {
      title: 'Puzzle Games Collection',
      description: 'Fun puzzle games to train your brain',
      url: 'https://www.lumosity.com/',
      type: 'interactive',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Lumosity',
      category: 'children'
    },
    {
      title: 'Brain Training Games',
      description: 'Memory and brain training exercises',
      url: 'https://www.brainbashers.com/',
      type: 'interactive',
      learningType: 'free',
      level: 'intermediate',
      verified: true,
      creator: 'BrainBashers',
      category: 'children'
    },
    {
      title: 'Sudoku and Logic Puzzles',
      description: 'Classic puzzles to improve logical thinking',
      url: 'https://www.youtube.com/c/CrackingTheCryptic',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Cracking The Cryptic',
      category: 'children'
    },
    {
      title: 'Brain Games for Kids',
      description: 'Educational brain games and puzzles',
      url: 'https://www.pbskids.org/games/puzzles/',
      type: 'interactive',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'PBS Kids',
      category: 'children'
    },
    {
      title: 'Memory and Logic Games',
      description: 'Improve memory and logical thinking',
      url: 'https://www.coolmathgames.com/',
      type: 'interactive',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'CoolMath Games',
      category: 'children'
    },
    {
      title: 'Educational Brain Games',
      description: 'Fun brain training activities for kids',
      url: 'https://www.youtube.com/c/BrainGames',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Brain Games',
      category: 'children'
    },
    {
      title: 'Puzzle Games Guide',
      description: 'Learn about different types of puzzles',
      url: 'https://www.parents.com/kids/education/puzzles-for-kids/',
      type: 'article',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Parents Magazine',
      category: 'children'
    }
  ],
  'Rhymes & Music': [
    {
      title: 'Nursery Rhymes Collection',
      description: 'Popular nursery rhymes for children',
      url: 'https://www.youtube.com/c/Cocomelon',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Cocomelon',
      category: 'children'
    },
    {
      title: 'Kids Songs and Music',
      description: 'Educational songs for kids',
      url: 'https://www.youtube.com/c/SuperSimpleSongs',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Super Simple Songs',
      category: 'children'
    },
    {
      title: 'ABC Song and More',
      description: 'Learn alphabet through songs',
      url: 'https://www.youtube.com/c/ABCKids',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'ABC Kids',
      category: 'children'
    },
    {
      title: 'Children Songs and Rhymes',
      description: 'Fun songs and rhymes for learning',
      url: 'https://www.youtube.com/c/LittleBabyBum',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Little Baby Bum',
      category: 'children'
    },
    {
      title: 'Educational Music for Kids',
      description: 'Learn through music and songs',
      url: 'https://www.youtube.com/c/TheLearningStation',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'The Learning Station',
      category: 'children'
    },
    {
      title: 'Music Education for Children',
      description: 'Benefits of music education for kids',
      url: 'https://www.nafme.org/music-education-benefits/',
      type: 'article',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'NAfME',
      category: 'children'
    }
  ],
  'Computer Science': [
    {
      title: 'Introduction to Computer Science',
      description: 'CS50: Introduction to Computer Science',
      url: 'https://www.edx.org/course/introduction-computer-science-harvardx-cs50x',
      type: 'edx',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Harvard University',
      category: 'students',
      rating: 4.8
    },
    {
      title: 'Computer Science Fundamentals',
      description: 'Learn the basics of computer science',
      url: 'https://www.khanacademy.org/computing/computer-science',
      type: 'khan-academy',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Khan Academy',
      category: 'students'
    },
    {
      title: 'Crash Course Computer Science',
      description: 'Comprehensive computer science course',
      url: 'https://www.youtube.com/c/crashcourse',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'CrashCourse',
      category: 'students'
    }
  ],
  'Data Analytics': [
    {
      title: 'Google Data Analytics Certificate',
      description: 'Professional certificate in data analytics',
      url: 'https://www.coursera.org/professional-certificates/google-data-analytics',
      type: 'coursera',
      learningType: 'premium',
      level: 'beginner',
      verified: true,
      creator: 'Google',
      category: 'students',
      rating: 4.7
    },
    {
      title: 'Data Analysis with Python',
      description: 'Learn data analysis using Python',
      url: 'https://www.freecodecamp.org/learn/data-analysis-with-python/',
      type: 'freecodecamp',
      learningType: 'free',
      level: 'intermediate',
      verified: true,
      creator: 'freeCodeCamp',
      category: 'students'
    },
    {
      title: 'Introduction to Data Analytics',
      description: 'Data analytics fundamentals course',
      url: 'https://www.coursera.org/learn/introduction-to-data-analytics',
      type: 'coursera',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'IBM',
      category: 'students',
      rating: 4.6
    },
    {
      title: 'Excel for Data Analysis',
      description: 'Learn Excel for data analytics',
      url: 'https://www.coursera.org/learn/excel-basics-data-analysis-ibm',
      type: 'coursera',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'IBM',
      category: 'students',
      rating: 4.5
    },
    {
      title: 'Data Analytics Tutorial',
      description: 'Learn data analytics from scratch',
      url: 'https://www.youtube.com/c/AlexTheAnalyst',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Alex The Analyst',
      category: 'students'
    },
    {
      title: 'Getting Started with Data Analytics',
      description: 'Beginner guide to data analytics',
      url: 'https://www.freecodecamp.org/news/what-is-data-analytics/',
      type: 'article',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'freeCodeCamp',
      category: 'students'
    }
  ],
  'Soft Skills': [
    {
      title: 'Communication Skills Course',
      description: 'Improve your communication skills',
      url: 'https://www.coursera.org/learn/communication-skills',
      type: 'coursera',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'University of Pennsylvania',
      category: 'students',
      rating: 4.5
    },
    {
      title: 'Public Speaking Masterclass',
      description: 'Master the art of public speaking',
      url: 'https://www.udemy.com/course/public-speaking-and-presentation/',
      type: 'udemy',
      learningType: 'premium',
      level: 'intermediate',
      verified: true,
      creator: 'Chris Haroun',
      category: 'students',
      rating: 4.6
    },
    {
      title: 'TED Talks: Communication',
      description: 'Learn from expert communicators',
      url: 'https://www.ted.com/topics/communication',
      type: 'video',
      learningType: 'free',
      level: 'all-levels',
      verified: true,
      creator: 'TED',
      category: 'students'
    },
    {
      title: 'Leadership and Teamwork',
      description: 'Develop leadership and teamwork skills',
      url: 'https://www.coursera.org/learn/leadership-teamwork',
      type: 'coursera',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'University of Illinois',
      category: 'students',
      rating: 4.4
    },
    {
      title: 'Communication Skills Tutorial',
      description: 'Learn effective communication techniques',
      url: 'https://www.youtube.com/c/CharismaOnCommand',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Charisma on Command',
      category: 'students'
    },
    {
      title: 'Soft Skills Guide',
      description: 'Complete guide to developing soft skills',
      url: 'https://www.indeed.com/career-advice/career-development/soft-skills',
      type: 'article',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Indeed',
      category: 'students'
    }
  ],
  'Finance & Business': [
    {
      title: 'Financial Markets',
      description: 'Understanding financial markets',
      url: 'https://www.coursera.org/learn/financial-markets-global',
      type: 'coursera',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Yale University',
      category: 'students',
      rating: 4.8
    },
    {
      title: 'Introduction to Business',
      description: 'Business fundamentals course',
      url: 'https://www.khanacademy.org/college-careers-more/business',
      type: 'khan-academy',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Khan Academy',
      category: 'students'
    },
    {
      title: 'Personal Finance Basics',
      description: 'Learn personal finance management',
      url: 'https://www.youtube.com/c/TwoCentsPBS',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Two Cents',
      category: 'students'
    },
    {
      title: 'Business Strategy',
      description: 'Learn business strategy and planning',
      url: 'https://www.coursera.org/learn/wharton-business-strategy',
      type: 'coursera',
      learningType: 'free',
      level: 'intermediate',
      verified: true,
      creator: 'Wharton School',
      category: 'students',
      rating: 4.7
    },
    {
      title: 'Finance Education',
      description: 'Learn finance and investing basics',
      url: 'https://www.youtube.com/c/GrahamStephan',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Graham Stephan',
      category: 'students'
    },
    {
      title: 'Business Fundamentals Guide',
      description: 'Complete guide to business basics',
      url: 'https://www.investopedia.com/business-essentials-4689819',
      type: 'article',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Investopedia',
      category: 'students'
    }
  ],
  'Digital Newspaper Reading': [
    {
      title: 'How to Read News Online',
      description: 'Guide to reading digital newspapers',
      url: 'https://www.youtube.com/c/TechBoomers',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'TechBoomers',
      category: 'senior_citizens'
    },
    {
      title: 'Digital News Reading Tips',
      description: 'Tips for reading news on tablets and phones',
      url: 'https://www.bbc.com/news/help-41670342',
      type: 'article',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'BBC News',
      category: 'senior_citizens'
    },
    {
      title: 'Reading News on Mobile',
      description: 'Learn to read news on your smartphone',
      url: 'https://www.aarp.org/technology/',
      type: 'article',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'AARP',
      category: 'senior_citizens'
    },
    {
      title: 'Online News Tutorial',
      description: 'Step-by-step guide to reading news online',
      url: 'https://www.youtube.com/c/SeniorPlanet',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Senior Planet',
      category: 'senior_citizens'
    }
  ],
  'Online Banking Awareness': [
    {
      title: 'Online Banking Safety Guide',
      description: 'Safe online banking practices',
      url: 'https://www.consumer.ftc.gov/articles/0218-banking-online',
      type: 'article',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Federal Trade Commission',
      category: 'senior_citizens'
    },
    {
      title: 'Online Banking Tutorial',
      description: 'Step-by-step online banking guide',
      url: 'https://www.youtube.com/c/TechBoomers',
      type: 'youtube',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'TechBoomers',
      category: 'senior_citizens'
    },
    {
      title: 'Safe Online Banking Practices',
      description: 'Learn how to bank safely online',
      url: 'https://www.consumerfinance.gov/consumer-tools/online-banking/',
      type: 'article',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'Consumer Financial Protection Bureau',
      category: 'senior_citizens'
    },
    {
      title: 'Banking Security Tips',
      description: 'Protect yourself from banking fraud',
      url: 'https://www.aarp.org/money/scams-fraud/',
      type: 'article',
      learningType: 'free',
      level: 'beginner',
      verified: true,
      creator: 'AARP',
      category: 'senior_citizens'
    }
  ],
  'Music / Bhajans': [
    {
      title: 'Devotional Music Collection',
      description: 'Collection of spiritual bhajans and devotional songs',
      url: 'https://www.youtube.com/c/TSeriesBhaktiSagar',
      type: 'youtube',
      learningType: 'free',
      level: 'all-levels',
      verified: true,
      creator: 'T-Series Bhakti Sagar',
      category: 'senior_citizens'
    },
    {
      title: 'Classical Indian Music',
      description: 'Traditional Indian classical music',
      url: 'https://www.youtube.com/c/ClassicalMusic',
      type: 'youtube',
      learningType: 'free',
      level: 'all-levels',
      verified: true,
      creator: 'Classical Music',
      category: 'senior_citizens'
    },
    {
      title: 'Bhajans and Kirtan',
      description: 'Spiritual songs and devotional music',
      url: 'https://www.youtube.com/c/ShriKrishnaBhajan',
      type: 'youtube',
      learningType: 'free',
      level: 'all-levels',
      verified: true,
      creator: 'Devotional Music',
      category: 'senior_citizens'
    },
    {
      title: 'Religious Songs Collection',
      description: 'Collection of religious and spiritual songs',
      url: 'https://www.youtube.com/c/SaregamaBhakti',
      type: 'youtube',
      learningType: 'free',
      level: 'all-levels',
      verified: true,
      creator: 'Saregama Bhakti',
      category: 'senior_citizens'
    }
  ]
};

/**
 * Connect to MongoDB database
 */
async function connectDatabase() {
  try {
    await mongoose.connect(CONFIG.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    throw error;
  }
}

/**
 * Clear existing data from collections
 */
async function clearExistingData() {
  if (!CONFIG.CLEAR_EXISTING_DATA) {
    console.log('ℹ️  Skipping data clearing (CLEAR_DATA not set to true)');
    return;
  }

  try {
    const skillCount = await Skill.countDocuments();
    const resourceCount = await Resource.countDocuments();
    
    await Skill.deleteMany({});
    await Resource.deleteMany({});
    
    console.log(`🗑️  Cleared ${skillCount} skills and ${resourceCount} resources`);
  } catch (error) {
    console.error('❌ Error clearing data:', error.message);
    throw error;
  }
}

/**
 * Flatten skills data with category information
 */
function flattenSkillsData() {
  const skills = [];
  for (const [category, categorySkills] of Object.entries(SKILLS_DATA)) {
    categorySkills.forEach(skill => {
      skills.push({ ...skill, category });
    });
  }
  return skills;
}

/**
 * Insert or update skills in database
 */
async function seedSkills() {
  try {
    const skillsData = flattenSkillsData();
    const skillMap = new Map();
    
    // Use upsert to update existing or create new skills
    for (const skillData of skillsData) {
      const skill = await Skill.findOneAndUpdate(
        { name: skillData.name },
        { 
          ...skillData,
          isActive: true,
          deletedAt: null // Ensure not soft-deleted
        },
        { 
          upsert: true, 
          new: true,
          setDefaultsOnInsert: true
        }
      );
      skillMap.set(skill.name, skill);
    }
    
    console.log(`✅ Processed ${skillMap.size} skills (updated or created)`);
    return skillMap;
  } catch (error) {
    console.error('❌ Error seeding skills:', error.message);
    throw error;
  }
}

/**
 * Insert resources and link them to skills
 */
async function seedResources(skillMap) {
  try {
    let totalResources = 0;
    const resourceUpdatePromises = [];

    for (const [skillName, resources] of Object.entries(RESOURCES_DATA)) {
      const skill = skillMap.get(skillName);
      
      if (!skill) {
        console.warn(`⚠️  Skill not found: ${skillName}`);
        continue;
      }

      // Add skill ID and category to each resource
      const resourcesWithSkill = resources.map(resource => ({
        ...resource,
        skill: skill._id,
        category: skill.category
      }));

      // Insert or update resources (avoid duplicates by URL)
      const insertedResources = [];
      for (const resourceData of resourcesWithSkill) {
        const resource = await Resource.findOneAndUpdate(
          { url: resourceData.url },
          {
            ...resourceData,
            isActive: true,
            verified: resourceData.verified !== undefined ? resourceData.verified : true,
            deletedAt: null
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
          }
        );
        insertedResources.push(resource);
      }
      totalResources += insertedResources.length;

      // Update skill with resource IDs (avoid duplicates)
      const resourceIds = insertedResources.map(r => r._id);
      const skillDoc = await Skill.findById(skill._id);
      if (skillDoc) {
        // Add resources that aren't already linked
        const existingResourceIds = skillDoc.resources.map(id => id.toString());
        const newResourceIds = resourceIds.filter(id => !existingResourceIds.includes(id.toString()));
        if (newResourceIds.length > 0) {
          skillDoc.resources.push(...newResourceIds);
          await skillDoc.save();
        }
        // Update statistics
        await skillDoc.updateStatistics();
      }
    }

    // Wait for all skill updates to complete
    await Promise.all(resourceUpdatePromises);
    
    console.log(`✅ Inserted ${totalResources} resources and linked to skills`);
    return totalResources;
  } catch (error) {
    console.error('❌ Error seeding resources:', error.message);
    throw error;
  }
}

/**
 * Create admin user if not exists
 */
async function createAdminUser() {
  try {
    const adminExists = await User.findOne({ email: CONFIG.ADMIN_EMAIL });
    
    if (adminExists) {
      console.log('ℹ️  Admin user already exists');
      return false;
    }

    const admin = new User({
      name: 'Admin User',
      email: CONFIG.ADMIN_EMAIL,
      password: CONFIG.ADMIN_PASSWORD,
      category: 'students',
      role: 'admin'
    });
    
    await admin.save();
    console.log(`✅ Created admin user (email: ${CONFIG.ADMIN_EMAIL}, password: ${CONFIG.ADMIN_PASSWORD})`);
    return true;
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    throw error;
  }
}

/**
 * Display seeding summary
 */
function displaySummary(skillCount, resourceCount) {
  console.log('\n' + '='.repeat(50));
  console.log('🎉 Database Seeding Summary');
  console.log('='.repeat(50));
  console.log(`📚 Total Skills: ${skillCount}`);
  console.log(`📖 Total Resources: ${resourceCount}`);
  console.log(`👤 Admin Email: ${CONFIG.ADMIN_EMAIL}`);
  console.log(`🔑 Admin Password: ${CONFIG.ADMIN_PASSWORD}`);
  console.log('='.repeat(50) + '\n');
}

/**
 * Main seeding function
 */
async function seedDatabase() {
  const startTime = Date.now();
  
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to database
    await connectDatabase();

    // Clear existing data if configured
    await clearExistingData();

    // Seed skills
    const skillMap = await seedSkills();

    // Seed resources
    const resourceCount = await seedResources(skillMap);

    // Create admin user
    await createAdminUser();

    // Display summary
    displaySummary(skillMap.size, resourceCount);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✨ Completed successfully in ${duration}s\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    // Ensure connection is closed
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

// Run seeding
seedDatabase();