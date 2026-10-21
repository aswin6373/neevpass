/**
 * Database seed.
 *
 * Three concerns, in dependency order:
 *   1. The skill/role taxonomy — the hidden dependency of every career feature.
 *      Versioned reference data; safe to run in any environment.
 *   2. Curated learning resources and the opportunity catalog. Reference data,
 *      same as the taxonomy.
 *   3. A demo account with a fully populated profile, ONLY outside production.
 *      It exists so a fresh clone has something real to look at; a production
 *      database must never contain a known-password account.
 *
 * The seed is idempotent: reference data is upserted by slug, demo content is
 * skipped when the demo account already exists. Running it twice changes
 * nothing except opportunity deadlines that are recomputed relative to now.
 */

import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import type { ScryptOptions } from 'node:crypto';

import { disconnectDatabase, prisma } from './index';

/**
 * Same digest format as apps/web/src/lib/password.ts. Duplicated rather than
 * imported because the web app is a Next.js workspace and @neevpass/db must
 * not depend on it. A format change has to be mirrored in both places — the
 * self-describing digest means a mismatch fails verification safely, never
 * silently.
 */
type ScryptFn = (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: ScryptOptions,
) => Promise<Buffer>;

const scrypt = promisify(scryptCallback) as unknown as ScryptFn;
async function hashPassword(plaintext: string): Promise<string> {
  const N = 32768;
  const r = 8;
  const p = 1;
  const salt = randomBytes(16);
  const derived = (await scrypt(plaintext.normalize('NFKC'), salt, 64, {
    N,
    r,
    p,
    maxmem: 128 * N * r * 2,
  })) as Buffer;

  return ['scrypt', N, r, p, salt.toString('base64'), derived.toString('base64')].join('$');
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function monthStart(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1));
}

// ---------------------------------------------------------------------------
// Taxonomy data
// ---------------------------------------------------------------------------

interface CategorySeed {
  readonly slug: string;
  readonly name: string;
}

const CATEGORIES: readonly CategorySeed[] = [
  { slug: 'programming-languages', name: 'Programming Languages' },
  { slug: 'frontend', name: 'Frontend' },
  { slug: 'backend', name: 'Backend' },
  { slug: 'data', name: 'Data & Analytics' },
  { slug: 'ai-ml', name: 'AI & Machine Learning' },
  { slug: 'devops-cloud', name: 'DevOps & Cloud' },
  { slug: 'databases', name: 'Databases' },
  { slug: 'mobile', name: 'Mobile' },
  { slug: 'cs-fundamentals', name: 'CS Fundamentals' },
  { slug: 'design', name: 'Design' },
  { slug: 'product', name: 'Product' },
  { slug: 'testing', name: 'Testing & Quality' },
  { slug: 'security', name: 'Security' },
  { slug: 'professional', name: 'Professional Skills' },
];

/** [slug, name, categorySlug, aliases, prerequisiteSlugs] */
type SkillSeed = readonly [string, string, string, readonly string[], readonly string[]];

const SKILLS: readonly SkillSeed[] = [
  // Programming languages
  ['python', 'Python', 'programming-languages', ['py'], []],
  ['javascript', 'JavaScript', 'programming-languages', ['js', 'es6'], []],
  ['typescript', 'TypeScript', 'programming-languages', ['ts'], ['javascript']],
  ['java', 'Java', 'programming-languages', [], []],
  ['cpp', 'C++', 'programming-languages', ['c-plus-plus'], ['c']],
  ['c', 'C', 'programming-languages', [], []],
  ['go', 'Go', 'programming-languages', ['golang'], []],
  ['rust', 'Rust', 'programming-languages', [], []],
  ['kotlin', 'Kotlin', 'programming-languages', [], []],
  ['swift', 'Swift', 'programming-languages', [], []],
  ['csharp', 'C#', 'programming-languages', ['c-sharp', 'dotnet'], []],
  ['php', 'PHP', 'programming-languages', [], []],
  ['ruby', 'Ruby', 'programming-languages', [], []],
  ['sql', 'SQL', 'programming-languages', ['structured query language'], []],
  ['bash', 'Bash', 'programming-languages', ['shell scripting'], []],

  // Frontend
  ['html', 'HTML', 'frontend', ['html5'], []],
  ['css', 'CSS', 'frontend', ['css3'], ['html']],
  ['react', 'React', 'frontend', ['reactjs'], ['javascript']],
  ['nextjs', 'Next.js', 'frontend', ['nextjs'], ['react']],
  ['vue', 'Vue.js', 'frontend', ['vuejs', 'vue'], ['javascript']],
  ['angular', 'Angular', 'frontend', [], ['typescript']],
  ['svelte', 'Svelte', 'frontend', ['sveltekit'], ['javascript']],
  ['tailwind-css', 'Tailwind CSS', 'frontend', ['tailwind'], ['css']],
  ['redux', 'Redux', 'frontend', ['redux toolkit'], ['react']],
  ['web-accessibility', 'Web Accessibility', 'frontend', ['a11y', 'wcag'], ['html']],

  // Backend
  ['nodejs', 'Node.js', 'backend', ['node'], ['javascript']],
  ['express', 'Express.js', 'backend', ['expressjs'], ['nodejs']],
  ['django', 'Django', 'backend', [], ['python']],
  ['flask', 'Flask', 'backend', [], ['python']],
  ['fastapi', 'FastAPI', 'backend', [], ['python']],
  ['spring-boot', 'Spring Boot', 'backend', ['spring'], ['java']],
  ['ruby-on-rails', 'Ruby on Rails', 'backend', ['rails', 'ror'], ['ruby']],
  ['laravel', 'Laravel', 'backend', [], ['php']],
  ['rest-api-design', 'REST API Design', 'backend', ['rest', 'api design'], []],
  ['graphql', 'GraphQL', 'backend', ['apollo'], []],
  ['microservices', 'Microservices Architecture', 'backend', [], ['rest-api-design']],

  // Data & analytics
  ['pandas', 'pandas', 'data', [], ['python']],
  ['numpy', 'NumPy', 'data', [], ['python']],
  ['data-cleaning', 'Data Cleaning', 'data', ['data wrangling'], []],
  ['statistics', 'Statistics', 'data', ['probability'], []],
  ['excel', 'Excel', 'data', ['spreadsheets', 'microsoft excel'], []],
  ['power-bi', 'Power BI', 'data', ['powerbi'], []],
  ['tableau', 'Tableau', 'data', [], []],
  ['data-visualization', 'Data Visualization', 'data', ['dataviz', 'charts'], []],

  // AI & ML
  ['machine-learning', 'Machine Learning', 'ai-ml', ['ml'], ['python', 'statistics']],
  ['scikit-learn', 'scikit-learn', 'ai-ml', ['sklearn'], ['machine-learning']],
  ['deep-learning', 'Deep Learning', 'ai-ml', ['neural networks'], ['machine-learning']],
  ['tensorflow', 'TensorFlow', 'ai-ml', ['keras'], ['deep-learning']],
  ['pytorch', 'PyTorch', 'ai-ml', [], ['deep-learning']],
  ['nlp', 'Natural Language Processing', 'ai-ml', ['nlp', 'text processing'], ['deep-learning']],
  ['computer-vision', 'Computer Vision', 'ai-ml', ['cv', 'opencv'], ['deep-learning']],
  ['prompt-engineering', 'Prompt Engineering', 'ai-ml', ['llm', 'genai'], []],

  // DevOps & cloud
  ['git', 'Git', 'devops-cloud', ['version control', 'github'], []],
  ['github-actions', 'GitHub Actions', 'devops-cloud', [], ['git']],
  ['docker', 'Docker', 'devops-cloud', ['containers'], ['linux']],
  ['kubernetes', 'Kubernetes', 'devops-cloud', ['k8s'], ['docker']],
  ['aws', 'AWS', 'devops-cloud', ['amazon web services'], []],
  ['gcp', 'Google Cloud', 'devops-cloud', ['gcloud', 'google cloud platform'], []],
  ['azure', 'Azure', 'devops-cloud', ['microsoft azure'], []],
  ['linux', 'Linux', 'devops-cloud', ['unix', 'shell'], []],
  ['ci-cd', 'CI/CD', 'devops-cloud', ['continuous integration'], ['git']],
  ['terraform', 'Terraform', 'devops-cloud', ['infrastructure as code'], []],
  ['nginx', 'Nginx', 'devops-cloud', ['web servers'], ['linux']],

  // Databases
  ['postgresql', 'PostgreSQL', 'databases', ['postgres'], ['sql']],
  ['mysql', 'MySQL', 'databases', [], ['sql']],
  ['mongodb', 'MongoDB', 'databases', ['mongo', 'nosql'], []],
  ['redis', 'Redis', 'databases', ['caching'], []],
  ['sqlite', 'SQLite', 'databases', [], ['sql']],

  // Mobile
  ['android-development', 'Android Development', 'mobile', ['android', 'jetpack compose'], ['kotlin']],
  ['ios-development', 'iOS Development', 'mobile', ['swiftui', 'uikit'], ['swift']],
  ['react-native', 'React Native', 'mobile', [], ['react']],
  ['flutter', 'Flutter', 'mobile', ['dart'], []],

  // CS fundamentals
  ['data-structures', 'Data Structures', 'cs-fundamentals', ['dsa', 'linked lists', 'trees'], []],
  ['algorithms', 'Algorithms', 'cs-fundamentals', ['dsa', 'complexity'], ['data-structures']],
  ['oop', 'Object-Oriented Programming', 'cs-fundamentals', ['oop'], []],
  ['operating-systems', 'Operating Systems', 'cs-fundamentals', ['os', 'processes'], []],
  ['computer-networks', 'Computer Networks', 'cs-fundamentals', ['tcp/ip', 'networking'], []],
  ['dbms', 'Database Management Systems', 'cs-fundamentals', ['dbms', 'normalisation'], []],
  ['system-design', 'System Design', 'cs-fundamentals', ['scalability'], ['algorithms', 'dbms']],

  // Design
  ['figma', 'Figma', 'design', [], []],
  ['ui-design', 'UI Design', 'design', ['visual design', 'interface design'], []],
  ['ux-research', 'UX Research', 'design', ['user research', 'usability'], []],
  ['prototyping', 'Prototyping', 'design', ['wireframing'], ['figma']],
  ['design-systems', 'Design Systems', 'design', ['component libraries'], ['ui-design']],

  // Product
  ['product-management', 'Product Management', 'product', ['pm'], []],
  ['agile', 'Agile', 'product', ['agile methodology'], []],
  ['scrum', 'Scrum', 'product', ['sprints'], ['agile']],
  ['jira', 'Jira', 'product', ['atlassian'], []],
  ['market-research', 'Market Research', 'product', ['competitive analysis'], []],

  // Testing
  ['unit-testing', 'Unit Testing', 'testing', ['test-driven development', 'tdd'], []],
  ['jest', 'Jest', 'testing', ['vitest'], ['javascript']],
  ['playwright', 'Playwright', 'testing', ['e2e testing'], ['javascript']],
  ['selenium', 'Selenium', 'testing', ['webdriver'], []],

  // Security
  ['network-security', 'Network Security', 'security', ['firewalls'], ['computer-networks']],
  ['application-security', 'Application Security', 'security', ['owasp', 'appsec'], ['network-security']],
  ['cryptography-basics', 'Cryptography Basics', 'security', ['encryption'], []],

  // Professional
  ['communication', 'Communication', 'professional', ['written communication'], []],
  ['teamwork', 'Teamwork', 'professional', ['collaboration'], []],
  ['public-speaking', 'Public Speaking', 'professional', ['presentations'], []],
  ['technical-writing', 'Technical Writing', 'professional', ['documentation'], []],
  ['leadership', 'Leadership', 'professional', ['team leading'], []],
  ['problem-solving', 'Problem Solving', 'professional', ['critical thinking'], []],
  ['time-management', 'Time Management', 'professional', ['prioritisation'], []],
];

/** [roleSlug, roleName, category, description, [[skillSlug, importance, minLevel]]] */
type RoleSeed = readonly [
  string,
  string,
  string,
  string,
  readonly (readonly [string, number, number])[],
];

const ROLES: readonly RoleSeed[] = [
  [
    'backend-engineer',
    'Backend Engineer',
    'Engineering',
    'Designs and builds the server side of products: APIs, services, data models and the infrastructure they run on.',
    [
      ['nodejs', 5, 4],
      ['python', 4, 3],
      ['rest-api-design', 5, 4],
      ['postgresql', 5, 3],
      ['docker', 4, 3],
      ['git', 4, 3],
      ['data-structures', 4, 4],
      ['algorithms', 3, 3],
      ['system-design', 3, 3],
      ['microservices', 3, 3],
      ['redis', 2, 2],
      ['linux', 3, 2],
      ['ci-cd', 3, 3],
      ['typescript', 3, 3],
      ['unit-testing', 2, 3],
    ],
  ],
  [
    'frontend-engineer',
    'Frontend Engineer',
    'Engineering',
    'Builds the user-facing layer of web products with a focus on correctness, accessibility and speed.',
    [
      ['html', 5, 4],
      ['css', 5, 4],
      ['javascript', 5, 4],
      ['react', 5, 4],
      ['typescript', 4, 3],
      ['tailwind-css', 3, 3],
      ['nextjs', 3, 3],
      ['web-accessibility', 3, 3],
      ['git', 4, 3],
      ['jest', 2, 2],
      ['ui-design', 2, 2],
      ['redux', 2, 2],
    ],
  ],
  [
    'fullstack-engineer',
    'Full-Stack Engineer',
    'Engineering',
    'Ships features end to end across the frontend, the backend and the database.',
    [
      ['javascript', 5, 4],
      ['react', 4, 3],
      ['nodejs', 4, 3],
      ['html', 4, 3],
      ['css', 4, 3],
      ['postgresql', 4, 3],
      ['git', 4, 3],
      ['rest-api-design', 4, 3],
      ['typescript', 3, 3],
      ['docker', 3, 2],
    ],
  ],
  [
    'data-analyst',
    'Data Analyst',
    'Data',
    'Turns raw data into decisions: queries, dashboards, reports and clear communication of what the numbers mean.',
    [
      ['sql', 5, 4],
      ['excel', 4, 3],
      ['statistics', 4, 3],
      ['data-visualization', 4, 3],
      ['power-bi', 3, 3],
      ['tableau', 3, 2],
      ['python', 3, 3],
      ['pandas', 3, 3],
      ['data-cleaning', 4, 3],
      ['communication', 3, 3],
    ],
  ],
  [
    'data-scientist',
    'Data Scientist',
    'Data',
    'Builds statistical and machine-learning models to explain behaviour and predict outcomes.',
    [
      ['python', 5, 4],
      ['pandas', 4, 3],
      ['statistics', 5, 4],
      ['machine-learning', 5, 4],
      ['scikit-learn', 4, 3],
      ['data-cleaning', 4, 3],
      ['sql', 4, 3],
      ['data-visualization', 3, 3],
      ['deep-learning', 2, 2],
      ['communication', 3, 3],
    ],
  ],
  [
    'ml-engineer',
    'Machine Learning Engineer',
    'Data',
    'Takes models out of notebooks and into production: training pipelines, serving, monitoring.',
    [
      ['python', 5, 4],
      ['machine-learning', 5, 4],
      ['deep-learning', 4, 4],
      ['pytorch', 4, 3],
      ['tensorflow', 3, 3],
      ['docker', 4, 3],
      ['aws', 3, 2],
      ['data-structures', 3, 3],
      ['statistics', 4, 3],
      ['computer-vision', 2, 2],
      ['nlp', 2, 2],
    ],
  ],
  [
    'mobile-developer',
    'Mobile Developer',
    'Engineering',
    'Builds applications for iOS and Android, natively or cross-platform.',
    [
      ['kotlin', 4, 3],
      ['swift', 3, 3],
      ['android-development', 4, 3],
      ['react-native', 3, 3],
      ['flutter', 3, 3],
      ['git', 4, 3],
      ['rest-api-design', 3, 3],
      ['ui-design', 2, 2],
      ['data-structures', 3, 3],
    ],
  ],
  [
    'devops-engineer',
    'DevOps Engineer',
    'Infrastructure',
    'Owns the path from commit to production: pipelines, containers, infrastructure and reliability.',
    [
      ['linux', 5, 4],
      ['docker', 5, 4],
      ['kubernetes', 4, 4],
      ['ci-cd', 5, 4],
      ['aws', 4, 3],
      ['terraform', 3, 3],
      ['github-actions', 4, 3],
      ['nginx', 2, 2],
      ['python', 2, 2],
      ['git', 5, 4],
    ],
  ],
  [
    'product-manager',
    'Product Manager',
    'Product',
    'Decides what gets built and why: discovery, prioritisation and alignment across teams.',
    [
      ['product-management', 5, 4],
      ['market-research', 4, 3],
      ['agile', 4, 3],
      ['scrum', 3, 3],
      ['communication', 5, 4],
      ['jira', 3, 2],
      ['data-visualization', 2, 2],
      ['ux-research', 3, 3],
      ['technical-writing', 3, 3],
    ],
  ],
  [
    'ui-ux-designer',
    'UI/UX Designer',
    'Design',
    'Designs interfaces and the research behind them, from flows to polished, accessible screens.',
    [
      ['figma', 5, 4],
      ['ui-design', 5, 4],
      ['ux-research', 4, 3],
      ['prototyping', 4, 3],
      ['design-systems', 3, 3],
      ['html', 2, 2],
      ['communication', 3, 3],
    ],
  ],
  [
    'qa-engineer',
    'QA Engineer',
    'Engineering',
    'Protects quality through automated and exploratory testing across the product.',
    [
      ['unit-testing', 5, 4],
      ['jest', 3, 3],
      ['playwright', 4, 3],
      ['selenium', 3, 3],
      ['javascript', 3, 3],
      ['git', 3, 3],
      ['communication', 3, 3],
      ['python', 2, 2],
    ],
  ],
];

/** [slug, title, url, provider, kind, skillSlug] */
type ResourceSeed = readonly [string, string, string, string, 'ARTICLE' | 'VIDEO' | 'COURSE' | 'DOCS' | 'BOOK', string];

const RESOURCES: readonly ResourceSeed[] = [
  ['mdn-web-docs', 'MDN Web Docs', 'https://developer.mozilla.org/en-US/', 'MDN', 'DOCS', 'html'],
  ['the-odin-project', 'The Odin Project', 'https://www.theodinproject.com/', 'The Odin Project', 'COURSE', 'css'],
  ['freecodecamp', 'freeCodeCamp Curriculum', 'https://www.freecodecamp.org/learn/', 'freeCodeCamp', 'COURSE', 'javascript'],
  ['typescript-handbook', 'TypeScript Handbook', 'https://www.typescriptlang.org/docs/handbook/intro.html', 'Microsoft', 'DOCS', 'typescript'],
  ['react-docs', 'React Documentation', 'https://react.dev/learn', 'React', 'DOCS', 'react'],
  ['nextjs-learn', 'Next.js Learn', 'https://nextjs.org/learn', 'Vercel', 'COURSE', 'nextjs'],
  ['tailwind-docs', 'Tailwind CSS Documentation', 'https://tailwindcss.com/docs', 'Tailwind Labs', 'DOCS', 'tailwind-css'],
  ['python-tutorial', 'The Official Python Tutorial', 'https://docs.python.org/3/tutorial/', 'Python Software Foundation', 'DOCS', 'python'],
  ['automate-the-boring-stuff', 'Automate the Boring Stuff with Python', 'https://automatetheboringstuff.com/', 'Al Sweigart', 'BOOK', 'python'],
  ['sqlbolt', 'SQLBolt', 'https://sqlbolt.com/', 'SQLBolt', 'COURSE', 'sql'],
  ['postgres-tutorial', 'PostgreSQL Tutorial', 'https://www.postgresqltutorial.com/', 'PostgreSQL Tutorial', 'COURSE', 'postgresql'],
  ['pro-git', 'Pro Git', 'https://git-scm.com/book/en/v2', 'Apress', 'BOOK', 'git'],
  ['docker-getting-started', 'Docker Getting Started', 'https://docs.docker.com/get-started/', 'Docker', 'DOCS', 'docker'],
  ['kubernetes-basics', 'Kubernetes Basics', 'https://kubernetes.io/docs/tutorials/', 'CNCF', 'DOCS', 'kubernetes'],
  ['aws-skill-builder', 'AWS Skill Builder', 'https://skillbuilder.aws/', 'AWS', 'COURSE', 'aws'],
  ['linux-journey', 'Linux Journey', 'https://linuxjourney.com/', 'Linux Journey', 'COURSE', 'linux'],
  ['kaggle-learn', 'Kaggle Learn', 'https://www.kaggle.com/learn', 'Kaggle', 'COURSE', 'machine-learning'],
  ['statquest', 'StatQuest', 'https://www.youtube.com/@statquest', 'Josh Starmer', 'VIDEO', 'statistics'],
  ['pandas-getting-started', 'pandas Getting Started', 'https://pandas.pydata.org/docs/getting_started/index.html', 'pandas', 'DOCS', 'pandas'],
  ['tensorflow-tutorials', 'TensorFlow Tutorials', 'https://www.tensorflow.org/tutorials', 'Google', 'DOCS', 'tensorflow'],
  ['pytorch-tutorials', 'PyTorch Tutorials', 'https://pytorch.org/tutorials/', 'PyTorch', 'DOCS', 'pytorch'],
  ['system-design-primer', 'System Design Primer', 'https://github.com/donnemartin/system-design-primer', 'GitHub', 'BOOK', 'system-design'],
  ['graphql-learn', 'GraphQL Learn', 'https://graphql.org/learn/', 'GraphQL Foundation', 'DOCS', 'graphql'],
  ['exceljet', 'ExcelJet', 'https://exceljet.net/', 'ExcelJet', 'DOCS', 'excel'],
  ['powerbi-learn', 'Power BI Learn', 'https://learn.microsoft.com/en-us/power-bi/', 'Microsoft', 'DOCS', 'power-bi'],
  ['flutter-docs', 'Flutter Documentation', 'https://docs.flutter.dev/', 'Google', 'DOCS', 'flutter'],
  ['android-basics-compose', 'Android Basics with Compose', 'https://developer.android.com/courses/android-basics-compose/course', 'Google', 'COURSE', 'android-development'],
  ['figma-learn', 'Figma Learn', 'https://help.figma.com/hc/en-us/categories/360002051633', 'Figma', 'COURSE', 'figma'],
  ['google-ux-certificate', 'Google UX Design Certificate', 'https://www.coursera.org/professional-certificates/google-ux-design', 'Coursera', 'COURSE', 'ux-research'],
  ['scrum-guide', 'The Scrum Guide', 'https://scrumguides.org/', 'Scrum.org', 'BOOK', 'scrum'],
  ['owasp-top-ten', 'OWASP Top 10', 'https://owasp.org/www-project-top-ten/', 'OWASP', 'DOCS', 'application-security'],
  ['javascript-info', 'The Modern JavaScript Tutorial', 'https://javascript.info/', 'javascript.info', 'COURSE', 'javascript'],
];

/** [slug, title, organiser, type, description, url, typeOfDayOffset, workMode, location, compensation] */
type OpportunitySeed = readonly [
  string,
  string,
  string,
  'INTERNSHIP' | 'JOB' | 'HACKATHON' | 'COMPETITION' | 'SCHOLARSHIP' | 'WORKSHOP',
  string,
  string,
  number,
  'REMOTE' | 'ONSITE' | 'HYBRID' | null,
  string | null,
  string | null,
  readonly string[],
];

const OPPORTUNITIES: readonly OpportunitySeed[] = [
  [
    'google-summer-of-code',
    'Google Summer of Code',
    'Google',
    'INTERNSHIP',
    'A global, remote program for new contributors to open source software. Work with a mentor organisation over the summer and be paid for accepted contributions.',
    'https://summerofcode.withgoogle.com/',
    45,
    'REMOTE',
    null,
    'Stipend paid by Google',
    ['git', 'python', 'javascript', 'cpp', 'go'],
  ],
  [
    'outreachy-internships',
    'Outreachy Internships',
    'Software Freedom Conservancy',
    'INTERNSHIP',
    'Paid, remote internships in open source for people subject to systemic bias and impacted by underrepresentation in technology.',
    'https://www.outreachy.org/',
    60,
    'REMOTE',
    null,
    'Stipend',
    ['python', 'javascript', 'git', 'linux'],
  ],
  [
    'mlh-hackathon-season',
    'MLH Hackathon Season',
    'Major League Hacking',
    'HACKATHON',
    'Weekend-long invention marathons where teams design and build something new. Beginners welcome at every event.',
    'https://mlh.io/seasons',
    20,
    'HYBRID',
    'Multiple cities',
    'Prizes per event',
    ['javascript', 'python', 'react', 'teamwork', 'problem-solving'],
  ],
  [
    'hacktoberfest',
    'Hacktoberfest',
    'DigitalOcean',
    'COMPETITION',
    'A month-long open-source celebration: raise four accepted pull requests during October and earn a digital reward set.',
    'https://hacktoberfest.com/',
    15,
    'REMOTE',
    null,
    'Digital rewards',
    ['git', 'javascript', 'python', 'technical-writing'],
  ],
  [
    'codeforces-weekly-rounds',
    'Codeforces Competitive Programming Rounds',
    'Codeforces',
    'COMPETITION',
    'Regular rated algorithm contests, twice most weeks. The standard arena for practicing interview-style problem solving.',
    'https://codeforces.com/',
    5,
    'REMOTE',
    null,
    'Rating and prizes for specials',
    ['algorithms', 'data-structures', 'cpp', 'python'],
  ],
  [
    'kaggle-community-competitions',
    'Kaggle Community Competitions',
    'Kaggle',
    'COMPETITION',
    'Ongoing machine-learning competitions on tabular, text and vision datasets, with public leaderboards and notebooks.',
    'https://www.kaggle.com/competitions',
    30,
    'REMOTE',
    null,
    'Medals and ranking',
    ['machine-learning', 'pandas', 'python', 'data-cleaning'],
  ],
  [
    'github-campus-experts',
    'GitHub Campus Experts',
    'GitHub',
    'COMPETITION',
    'A program for student leaders who build communities on campus: training, support and direct access to GitHub education resources.',
    'https://education.github.com/experts',
    75,
    'REMOTE',
    null,
    null,
    ['leadership', 'communication', 'git', 'public-speaking'],
  ],
  [
    'npmibus-winter-internship',
    'Nimbus Labs Winter Internship — Engineering',
    'Nimbus Labs',
    'INTERNSHIP',
    'A six-week winter internship pairing students with a product team to ship a real feature under mentorship. Demo intake for the seed catalog.',
    'https://example.com/opportunities/nimbus-winter-internship',
    35,
    'HYBRID',
    'Bengaluru, India',
    '₹25,000 per month',
    ['javascript', 'react', 'nodejs', 'git', 'unit-testing'],
  ],
  [
    'helios-data-internship',
    'Helios Analytics Summer Trainee',
    'Helios Analytics',
    'INTERNSHIP',
    'Eight weeks on the analytics team: SQL reporting, dashboard building and one end-to-end forecasting project.',
    'https://example.com/opportunities/helios-summer-trainee',
    50,
    'ONSITE',
    'Pune, India',
    '₹20,000 per month',
    ['sql', 'excel', 'power-bi', 'statistics', 'communication'],
  ],
  [
    'quanta-ml-residency',
    'Quanta AI Residency',
    'Quanta Research',
    'INTERNSHIP',
    'A one-year residency for students who want to move from coursework to published machine-learning research.',
    'https://example.com/opportunities/quanta-ai-residency',
    90,
    'REMOTE',
    null,
    '₹60,000 per month',
    ['python', 'machine-learning', 'pytorch', 'deep-learning', 'statistics'],
  ],
  [
    'embercloud-devops-bootcamp',
    'EmberCloud DevOps Bootcamp',
    'EmberCloud',
    'WORKSHOP',
    'Two weekends of hands-on labs: containers, pipelines and infrastructure as code, ending with a graded capstone.',
    'https://example.com/opportunities/embercloud-devops-bootcamp',
    25,
    'REMOTE',
    null,
    'Free for students',
    ['docker', 'kubernetes', 'ci-cd', 'terraform', 'linux'],
  ],
  [
    'meridian-product-fellowship',
    'Meridian Product Fellowship',
    'Meridian Ventures',
    'INTERNSHIP',
    'A ten-week fellowship where you shadow a product manager, run discovery on a live feature and present to the leadership team.',
    'https://example.com/opportunities/meridian-product-fellowship',
    40,
    'HYBRID',
    'Mumbai, India',
    '₹30,000 per month',
    ['product-management', 'market-research', 'communication', 'ux-research'],
  ],
  [
    'atlas-design-sprint-week',
    'Atlas Design Sprint Week',
    'Atlas Studio',
    'WORKSHOP',
    'A five-day guided design sprint: research, wireframe, prototype and user-test a feature with a real partner company.',
    'https://example.com/opportunities/atlas-design-sprint-week',
    18,
    'REMOTE',
    null,
    '₹1,500 registration',
    ['figma', 'prototyping', 'ux-research', 'ui-design', 'teamwork'],
  ],
  [
    'sable-bank-graduate-role',
    'Sable Bank Graduate Engineering Role',
    'Sable Bank',
    'JOB',
    'A two-year rotational graduate program across backend, data and platform teams, with a formal mentoring track.',
    'https://example.com/opportunities/sable-graduate-role',
    70,
    'ONSITE',
    'Hyderabad, India',
    'Competitive; stated on application',
    ['java', 'spring-boot', 'sql', 'data-structures', 'system-design'],
  ],
  [
    'ignite-security-school',
    'Ignite Application Security School',
    'Ignite Security',
    'WORKSHOP',
    'Three evenings on the OWASP Top 10, with deliberately vulnerable applications to attack and then fix.',
    'https://example.com/opportunities/ignite-security-school',
    12,
    'REMOTE',
    null,
    'Free',
    ['application-security', 'network-security', 'linux'],
  ],
  [
    'orbit-mobility-android-challenge',
    'Orbit Mobility Android Challenge',
    'Orbit Mobility',
    'COMPETITION',
    'Build an accessibility-first Android app for urban commuting. Shortlisted entries get mentorship and device support.',
    'https://example.com/opportunities/orbit-android-challenge',
    55,
    'REMOTE',
    null,
    '₹1,00,000 prize pool',
    ['android-development', 'kotlin', 'ui-design', 'web-accessibility'],
  ],
  [
    'northwind-scholarship',
    'Northwind Foundation Merit Scholarship',
    'Northwind Foundation',
    'SCHOLARSHIP',
    'Tuition support for second- and third-year students in computing disciplines, awarded on academic merit and a project portfolio.',
    'https://example.com/opportunities/northwind-scholarship',
    80,
    null,
    null,
    'Up to ₹2,00,000 per year',
    ['problem-solving', 'technical-writing'],
  ],
  [
    'vectorcloud-frontend-opening',
    'VectorCloud Frontend Engineer (Early Career)',
    'VectorCloud',
    'JOB',
    'An early-career frontend role on a design-systems team: components, accessibility and performance in production.',
    'https://example.com/opportunities/vectorcloud-frontend',
    65,
    'REMOTE',
    null,
    'Stated on application',
    ['react', 'typescript', 'css', 'web-accessibility', 'tailwind-css'],
  ],
  [
    'solstice-fullstack-internship',
    'Solstice Systems Full-Stack Internship',
    'Solstice Systems',
    'INTERNSHIP',
    'Work across the stack on a customer-facing product: React on the front, Node.js behind, Postgres underneath.',
    'https://example.com/opportunities/solstice-fullstack-internship',
    28,
    'HYBRID',
    'Chennai, India',
    '₹22,000 per month',
    ['react', 'nodejs', 'postgresql', 'typescript', 'git'],
  ],
  [
    'fable-press-technical-writing-contest',
    'Fable Press Technical Writing Contest',
    'Fable Press',
    'COMPETITION',
    'Write the best explained tutorial on any developer tool. Judged on clarity, correctness and originality.',
    'https://example.com/opportunities/fable-writing-contest',
    22,
    'REMOTE',
    null,
    '₹50,000 prize pool',
    ['technical-writing', 'communication'],
  ],
  [
    'crescent-qa-internship',
    'Crescent Software QA Internship',
    'Crescent Software',
    'INTERNSHIP',
    'Build automated regression suites and learn exploratory testing on a live SaaS product.',
    'https://example.com/opportunities/crescent-qa-internship',
    33,
    'ONSITE',
    'Noida, India',
    '₹18,000 per month',
    ['unit-testing', 'playwright', 'javascript', 'communication'],
  ],
  [
    'terrafirm-gcp-scholarship',
    'TerraFirm Cloud Scholarship',
    'TerraFirm',
    'SCHOLARSHIP',
    'Covers one Google Cloud certification exam plus a preparatory course, with a study group led by TerraFirm engineers.',
    'https://example.com/opportunities/terrafirm-gcp-scholarship',
    48,
    'REMOTE',
    null,
    'Exam fee + course',
    ['gcp', 'linux', 'ci-cd'],
  ],
  [
    'brightpath-mobile-hackathon',
    'BrightPath Mobile Hackathon',
    'BrightPath Foundation',
    'HACKATHON',
    'A 36-hour hackathon on apps for education access, with mentors from industry and a demo day in front of NGO partners.',
    'https://example.com/opportunities/brightpath-mobile-hackathon',
    26,
    'HYBRID',
    'Delhi, India',
    '₹75,000 prize pool',
    ['flutter', 'react-native', 'problem-solving', 'teamwork', 'ui-design'],
  ],
  [
    'harbourline-data-competition',
    'Harbourline Open Data Competition',
    'Harbourline City Council',
    'COMPETITION',
    'Use the city open-data portal to answer one civic question with evidence. Winning entries are published by the council.',
    'https://example.com/opportunities/harbourline-open-data',
    42,
    'REMOTE',
    null,
    '₹40,000 prize pool',
    ['python', 'pandas', 'data-visualization', 'sql'],
  ],
];

// ---------------------------------------------------------------------------
// Demo account (non-production only)
// ---------------------------------------------------------------------------

const DEMO_EMAIL = 'demo@neevpass.test';
const DEMO_PASSWORD = 'demo-password-123';
const SKILL_IDS = new Map<string, string>();

async function resolveSkillIds(): Promise<Map<string, string>> {
  const skills = await prisma.skill.findMany({ select: { id: true, slug: true } });
  return new Map(skills.map((skill) => [skill.slug, skill.id]));
}

async function seedTaxonomy(): Promise<void> {
  await prisma.skillCategory.createMany({
    data: CATEGORIES.map((category) => ({ slug: category.slug, name: category.name })),
    skipDuplicates: true,
  });

  const categories = await prisma.skillCategory.findMany({ select: { id: true, slug: true } });
  const categoryIds = new Map(categories.map((category) => [category.slug, category.id]));

  await prisma.skill.createMany({
    data: SKILLS.map(([slug, name, categorySlug, aliases]) => ({
      slug,
      name,
      aliases: [...aliases],
      categoryId: categoryIds.get(categorySlug) ?? null,
    })),
    skipDuplicates: true,
  });

  SKILL_IDS.clear();
  for (const [slug, id] of await resolveSkillIds()) {
    SKILL_IDS.set(slug, id);
  }

  const prerequisiteRows = SKILLS.flatMap(([slug, , , , prereqs]) =>
    prereqs
      .map((prereq) => ({
        skillId: SKILL_IDS.get(slug),
        prerequisiteId: SKILL_IDS.get(prereq),
      }))
      .filter(
        (row): row is { skillId: string; prerequisiteId: string } =>
          row.skillId !== undefined && row.prerequisiteId !== undefined,
      ),
  );

  if (prerequisiteRows.length > 0) {
    // createMany with a composite PK is not idempotent without skipDuplicates;
    // on PostgreSQL we get ON CONFLICT DO NOTHING semantics from that flag.
    await prisma.skillPrerequisite.createMany({ data: prerequisiteRows, skipDuplicates: true });
  }

  await prisma.role.createMany({
    data: ROLES.map(([slug, name, category, description]) => ({ slug, name, category, description })),
    skipDuplicates: true,
  });

  const roles = await prisma.role.findMany({ select: { id: true, slug: true } });
  const roleIds = new Map(roles.map((role) => [role.slug, role.id]));

  const requirementRows = ROLES.flatMap(([roleSlug, , , , requirements]) =>
    requirements
      .map(([skillSlug, importance, minLevel]) => ({
        roleId: roleIds.get(roleSlug),
        skillId: SKILL_IDS.get(skillSlug),
        importance,
        minLevel,
      }))
      .filter(
        (row): row is { roleId: string; skillId: string; importance: number; minLevel: number } =>
          row.roleId !== undefined && row.skillId !== undefined,
      ),
  );

  await prisma.roleSkillRequirement.createMany({ data: requirementRows, skipDuplicates: true });

  await prisma.resource.createMany({
    data: RESOURCES.map(([slug, title, url, provider, kind, skillSlug]) => ({
      slug,
      title,
      url,
      provider,
      kind,
      skillId: SKILL_IDS.get(skillSlug),
    })).filter((row): row is { slug: string; title: string; url: string; provider: string; kind: 'ARTICLE' | 'VIDEO' | 'COURSE' | 'DOCS' | 'BOOK'; skillId: string } => row.skillId !== undefined),
    skipDuplicates: true,
  });

  const resources = await prisma.resource.findMany({ select: { id: true, slug: true } });
  const resourceIds = new Map(resources.map((resource) => [resource.slug, resource.id]));
  void resourceIds;

  await prisma.opportunity.createMany({
    data: OPPORTUNITIES.map(([slug, title, organiser, type, description, url, daysAhead, workMode, location, compensation]) => ({
      slug,
      title,
      organiser,
      type,
      description,
      url,
      deadline: daysFromNow(daysAhead),
      workMode,
      location,
      compensation,
    })),
    skipDuplicates: true,
  });

  const opportunities = await prisma.opportunity.findMany({ select: { id: true, slug: true } });
  const opportunityIds = new Map(opportunities.map((opportunity) => [opportunity.slug, opportunity.id]));

  const opportunitySkillRows = OPPORTUNITIES.flatMap(([slug, , , , , , , , , , skills]) =>
    skills
      .map((skillSlug) => ({
        opportunityId: opportunityIds.get(slug),
        skillId: SKILL_IDS.get(skillSlug),
      }))
      .filter(
        (row): row is { opportunityId: string; skillId: string } =>
          row.opportunityId !== undefined && row.skillId !== undefined,
      ),
  );

  await prisma.opportunitySkill.createMany({ data: opportunitySkillRows, skipDuplicates: true });
}

async function seedDemoAccount(): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL }, select: { id: true } });
  if (existing) {
    console.log('  Demo account already exists — skipping demo content.');
    return;
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const user = await prisma.user.create({
    data: { name: 'Asha Verma', email: DEMO_EMAIL, passwordHash },
    select: { id: true },
  });

  const skill = (slug: string): string => {
    const id = SKILL_IDS.get(slug);
    if (!id) throw new Error(`Seed bug: unknown skill slug "${slug}"`);
    return id;
  };

  const profile = await prisma.profile.create({
    data: {
      userId: user.id,
      fullName: 'Asha Verma',
      headline: 'Final-year CS student · Full-stack and data',
      summary:
        'Final-year computer science student who has shipped three web products, one of them used by 4,000 students on my campus. I like the part where a rough idea becomes a thing people rely on, and I am looking for a full-stack engineering role after graduation.',
      location: 'Bengaluru, India',
      phone: '+91 90000 00000',
      publicSlug: 'asha-verma-demo',
      revision: 7,
    },
    select: { id: true },
  });

  const education = await prisma.education.createMany({
    data: [
      {
        profileId: profile.id,
        institution: 'RV College of Engineering',
        degree: 'B.Tech',
        field: 'Computer Science and Engineering',
        gradeType: 'CGPA_10',
        gradeValue: '8.7',
        location: 'Bengaluru, India',
        fromDate: monthStart(2022, 8),
        toDate: monthStart(2026, 6),
        isCurrent: true,
        order: 0,
        visibility: 'PUBLIC',
      },
      {
        profileId: profile.id,
        institution: 'Sri Chaitanya Pre-University',
        degree: 'PCMC (Pre-University)',
        field: 'Physics, Chemistry, Maths, Computer Science',
        gradeType: 'PERCENTAGE',
        gradeValue: '94',
        location: 'Hyderabad, India',
        fromDate: monthStart(2020, 6),
        toDate: monthStart(2022, 5),
        order: 1,
        visibility: 'PUBLIC',
      },
    ],
  });
  void education;

  const internship = await prisma.experience.create({
    data: {
      profileId: profile.id,
      type: 'INTERNSHIP',
      organisation: 'Nimbus Labs',
      title: 'Software Engineering Intern',
      location: 'Bengaluru, India',
      workMode: 'HYBRID',
      fromDate: monthStart(2025, 5),
      toDate: monthStart(2025, 8),
      summary:
        'Joined the four-person platform team and shipped the internal admin console used by the support team every day.',
      highlights: [
        'Built the admin console in React and TypeScript, replacing a spreadsheet workflow for 40 support staff.',
        'Designed the audit-log schema that every internal tool now writes to.',
      ],
      order: 0,
      visibility: 'PUBLIC',
    },
    select: { id: true },
  });

  const volunteerRole = await prisma.experience.create({
    data: {
      profileId: profile.id,
      type: 'VOLUNTEER',
      organisation: 'CodePath Bengaluru',
      title: 'Weekend Mentor',
      fromDate: monthStart(2024, 1),
      isCurrent: true,
      summary: 'Mentor first-year students through introductory web-development exercises on weekends.',
      highlights: [],
      order: 1,
      visibility: 'UNLISTED',
    },
    select: { id: true },
  });
  void volunteerRole;

  await prisma.experienceSkill.createMany({
    data: [
      { experienceId: internship.id, skillId: skill('react') },
      { experienceId: internship.id, skillId: skill('typescript') },
      { experienceId: internship.id, skillId: skill('postgresql') },
      { experienceId: internship.id, skillId: skill('rest-api-design') },
    ],
    skipDuplicates: true,
  });

  const projects = [
    {
      title: 'CampusCart',
      role: 'Creator and maintainer',
      summary:
        'A buy-and-sell board for hostel residents. Started as a weekend project; now it is the default way my block sells textbooks at term end.',
      fromDate: monthStart(2024, 3),
      isCurrent: true,
      repoUrl: 'https://github.com/asha-verma-demo/campuscart',
      liveUrl: 'https://campuscart.example.com',
      order: 0,
      skills: ['react', 'nodejs', 'postgresql', 'tailwind-css'],
    },
    {
      title: 'AttendanceLens',
      role: 'Backend and data',
      summary:
        'Attendance analytics for student clubs: uploads a register export and shows risk patterns before it is too late to act.',
      fromDate: monthStart(2024, 11),
      toDate: monthStart(2025, 2),
      repoUrl: 'https://github.com/asha-verma-demo/attendancelens',
      liveUrl: null,
      order: 1,
      skills: ['python', 'pandas', 'excel', 'data-visualization'],
    },
    {
      title: 'Rasa',
      role: 'Frontend contributor',
      summary:
        'An open-source recipe manager. I contributed the shopping-list offline mode and two accessibility fixes.',
      fromDate: monthStart(2025, 6),
      toDate: monthStart(2025, 7),
      repoUrl: 'https://github.com/asha-verma-demo/rasa',
      liveUrl: null,
      order: 2,
      skills: ['typescript', 'web-accessibility'],
    },
  ];

  for (const project of projects) {
    const created = await prisma.project.create({
      data: {
        profileId: profile.id,
        title: project.title,
        role: project.role,
        summary: project.summary,
        fromDate: project.fromDate,
        toDate: project.toDate ?? null,
        isCurrent: project.isCurrent ?? false,
        repoUrl: project.repoUrl,
        liveUrl: project.liveUrl,
        order: project.order,
        visibility: 'PUBLIC',
      },
      select: { id: true },
    });

    await prisma.projectSkill.createMany({
      data: project.skills.map((slug) => ({ projectId: created.id, skillId: skill(slug) })),
      skipDuplicates: true,
    });
  }

  const awsCertificate = await prisma.certificate.create({
    data: {
      profileId: profile.id,
      title: 'AWS Certified Cloud Practitioner',
      issuer: 'Amazon Web Services',
      issuedAt: monthStart(2025, 3),
      credentialId: 'AWS-CCP-2025-DEMO',
      credentialUrl: 'https://aws.amazon.com/certification/',
      order: 0,
      visibility: 'PUBLIC',
    },
    select: { id: true },
  });

  const mlCertificate = await prisma.certificate.create({
    data: {
      profileId: profile.id,
      title: 'Machine Learning Specialization',
      issuer: 'DeepLearning.AI',
      issuedAt: monthStart(2024, 9),
      credentialUrl: 'https://www.coursera.org/',
      summary: 'Three-course specialization covering supervised learning, advanced algorithms and unsupervised learning.',
      order: 1,
      visibility: 'UNLISTED',
    },
    select: { id: true },
  });
  void mlCertificate;

  await prisma.certificateSkill.createMany({
    data: [
      { certificateId: awsCertificate.id, skillId: skill('aws') },
      { certificateId: awsCertificate.id, skillId: skill('linux') },
    ],
    skipDuplicates: true,
  });

  await prisma.achievement.createMany({
    data: [
      {
        profileId: profile.id,
        title: 'Winner, Smart India Hackathon (regional round)',
        category: 'Competition',
        issuer: 'Smart India Hackathon',
        issuedAt: monthStart(2024, 12),
        description: 'Led a five-person team building a grievance-routing prototype for the municipal round.',
        order: 0,
        visibility: 'PUBLIC',
      },
      {
        profileId: profile.id,
        title: 'Dean\u2019s List, semesters 3\u20136',
        category: 'Academic',
        issuedAt: monthStart(2025, 1),
        description: null,
        order: 1,
        visibility: 'PRIVATE',
      },
    ],
  });

  await prisma.hackathon.createMany({
    data: [
      {
        profileId: profile.id,
        name: 'Smart India Hackathon',
        organiser: 'Ministry of Education',
        heldOn: monthStart(2024, 12),
        role: 'Team lead',
        teamSize: 5,
        projectName: 'JantaLine',
        result: 'Winner, regional round',
        summary: 'A grievance-routing prototype that triaged complaints by category and urgency.',
        order: 0,
        visibility: 'PUBLIC',
      },
      {
        profileId: profile.id,
        name: 'MLH Hacktx',
        organiser: 'Major League Hacking',
        heldOn: monthStart(2025, 10),
        role: 'Backend',
        teamSize: 4,
        projectName: 'StudyPact',
        result: 'Top 10',
        summary: null,
        order: 1,
        visibility: 'PRIVATE',
      },
    ],
  });

  await prisma.workshop.createMany({
    data: [
      {
        profileId: profile.id,
        title: 'Docker Fundamentals for Students',
        organiser: 'EmberCloud',
        heldOn: monthStart(2025, 2),
        durationHours: 8,
        mode: 'REMOTE',
        summary: 'Two-day hands-on workshop on containers and compose.',
        order: 0,
        visibility: 'UNLISTED',
      },
      {
        profileId: profile.id,
        title: 'Introduction to System Design',
        organiser: 'CS Department Society',
        heldOn: monthStart(2025, 4),
        durationHours: 4,
        mode: 'ONSITE',
        order: 1,
        visibility: 'PRIVATE',
      },
    ],
  });

  await prisma.profileLink.createMany({
    data: [
      { profileId: profile.id, label: 'GitHub', url: 'https://github.com/asha-verma-demo', order: 0, visibility: 'PUBLIC' },
      { profileId: profile.id, label: 'LinkedIn', url: 'https://www.linkedin.com/in/asha-verma-demo', order: 1, visibility: 'PUBLIC' },
      { profileId: profile.id, label: 'Blog', url: 'https://asha-verma-demo.example.com', order: 2, visibility: 'UNLISTED' },
    ],
  });

  const profileSkills: readonly [string, number, number][] = [
    ['javascript', 4, 3],
    ['typescript', 4, 2],
    ['react', 4, 2],
    ['nodejs', 3, 2],
    ['postgresql', 3, 1.5],
    ['python', 3, 2],
    ['pandas', 3, 1],
    ['git', 4, 3],
    ['tailwind-css', 4, 2],
    ['docker', 2, 1],
    ['rest-api-design', 3, 1.5],
    ['communication', 4, 3],
  ];

  await prisma.profileSkill.createMany({
    data: profileSkills.map(([slug, proficiency, yearsUsed], index) => ({
      profileId: profile.id,
      skillId: skill(slug),
      proficiency,
      yearsUsed,
      order: index,
      visibility: 'PUBLIC',
    })),
    skipDuplicates: true,
  });

  const backendRole = await prisma.role.findUnique({ where: { slug: 'backend-engineer' }, select: { id: true } });
  if (backendRole) {
    const goal = await prisma.careerGoal.create({
      data: {
        profileId: profile.id,
        roleId: backendRole.id,
        targetDate: monthStart(2026, 7),
        priority: 'HIGH',
        status: 'ACTIVE',
        note: 'Graduate into a backend role; product companies over services.',
      },
      select: { id: true },
    });
    void goal;
  }

  await prisma.resume.create({
    data: {
      profileId: profile.id,
      title: 'Backend Engineer Resume',
      templateKey: 'modern',
      config: {
        sectionOrder: ['SUMMARY', 'EDUCATION', 'INTERNSHIPS', 'PROJECTS', 'SKILLS', 'CERTIFICATES', 'ACHIEVEMENTS', 'HACKATHONS', 'LINKS', 'EXPERIENCE', 'WORKSHOPS'],
        hiddenSections: ['WORKSHOPS'],
        hiddenItemIds: [],
        pinnedItemIds: [],
        itemLimits: { PROJECTS: 3 },
        themeOverrides: {},
      },
      targetRoleId: backendRole?.id ?? null,
    },
    select: { id: true },
  });

  await prisma.portfolio.create({
    data: {
      profileId: profile.id,
      title: 'Asha Verma — Portfolio',
      templateKey: 'STUDIO',
      config: {
        hiddenSections: ['WORKSHOPS', 'LINKS'],
        accentColor: '#c8f169',
      },
      publicSlug: 'asha-verma-demo',
      published: true,
      publishedAt: new Date(),
    },
    select: { id: true },
  });

  const savedOpps = await prisma.opportunity.findMany({
    where: { slug: { in: ['npmibus-winter-internship', 'solstice-fullstack-internship', 'mlh-hackathon-season'] } },
    select: { id: true, slug: true },
  });

  const statuses = new Map<string, 'SAVED' | 'APPLIED' | 'DISMISSED'>([
    ['npmibus-winter-internship', 'SAVED'],
    ['solstice-fullstack-internship', 'APPLIED'],
    ['mlh-hackathon-season', 'DISMISSED'],
  ] as const);

  for (const opportunity of savedOpps) {
    const status = statuses.get(opportunity.slug);
    if (status) {
      await prisma.savedOpportunity.create({
        data: { profileId: profile.id, opportunityId: opportunity.id, status },
      });
    }
  }

  console.log('  Demo account created:');
  console.log(`    email:    ${DEMO_EMAIL}`);
  console.log(`    password: ${DEMO_PASSWORD}`);
  console.log('    (non-production data only — remove by deleting the user)');
}

async function main(): Promise<void> {
  const reachable = await check();
  if (!reachable) {
    console.error('✗ Cannot reach the database.');
    console.error('  Start the local cluster with:  npm run db:up');
    console.error('  Then apply migrations with:    npm run db:migrate');
    process.exitCode = 1;
    return;
  }

  console.log('✓ Database connection OK');

  await seedTaxonomy();
  console.log('✓ Taxonomy seeded (skills, roles, resources, opportunities)');

  if (process.env.NODE_ENV !== 'production') {
    await seedDemoAccount();
  }

  console.log('✓ Seed complete');
}

async function check(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

main()
  .catch((error: unknown) => {
    console.error('✗ Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void disconnectDatabase();
  });
