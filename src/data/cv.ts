// src/data/cv.ts
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for all site content.
// To update the site: edit this file, then git push.
//
// ANONYMISATION RULES (permanent — do not remove):
//   ✗ No employer or brand names
//   ✗ No personal contact details (email, phone, address)
//   ✓ All metrics preserved (£180k, 75%, 18-person, etc.)
//   ✓ All technology names preserved (AWS, ECS, GitHub Actions, etc.)
// ─────────────────────────────────────────────────────────────────────────────

export const meta = {
  name: 'Iain Morton',
  title: 'Head of Engineering · CTO',
  linkedin: 'https://www.linkedin.com/in/iain-morton-7b7485286/',
  github: 'https://github.com/impingu1984',
  domain: 'iainmorton.me',
};

export const hero = {
  summary:
    'Engineering leader with 15+ years of experience, currently heading an 18-person organisation spanning Web, Mobile, Backend, DevOps, Data and QA. Proven track record of reducing web lead times by 75%, cutting mobile release cycles from quarterly to 4–6 weeks, and delivering £180,000 in annual platform savings. Equally comfortable designing event-driven cloud architectures, directing ISO 27001 audits, and building the organisational structures that let high-performing teams thrive.',
};

export const about = {
  paragraphs: [
    'I am an engineering leader with over 15 years of experience spanning individual contribution, technical leadership, and executive engineering management. I currently head an 18-person engineering organisation structured across Web, Mobile, Backend, DevOps, Data and QA disciplines — with full accountability for engineering strategy, platform architecture, SDLC governance, cost management, and talent development.',
    'My career has progressed from BI and data engineering into platform and infrastructure leadership, giving me unusually broad technical depth across the full stack: from data warehouse design and event-driven cloud architecture through to CI/CD pipeline delivery and security compliance. I have led ISO 27001 (2017 and 2022 standard) and PCI DSS programmes, driven a 75% reduction in web deployment lead time, and delivered seven-figure infrastructure cost savings.',
    'I am motivated by building engineering cultures where autonomy, outcome-focus, and craft are the defaults — not the exceptions. I am targeting Head of Engineering or CTO roles where technical depth and strategic leadership can be applied in combination.',
  ],
};

export type SkillCluster = {
  name: string;
  skills: string[];
};

export const skillClusters: SkillCluster[] = [
  {
    name: 'Leadership',
    skills: [
      'Org Design',
      'SDLC Transformation',
      'DORA Metrics',
      'Team Building',
      'Stakeholder Management',
      'Release Management',
      'Roadmap Ownership',
    ],
  },
  {
    name: 'Cloud & Infrastructure',
    skills: [
      'AWS ECS',
      'Fargate',
      'Lambda',
      'EC2',
      'RDS',
      'Aurora',
      'DynamoDB',
      'CloudFront',
      'VPC',
      'IAM',
      'Terraform',
      'Kubernetes',
      'EKS',
    ],
  },
  {
    name: 'Data Platform',
    skills: [
      'Snowflake',
      'dbt',
      'Fivetran',
      'Airflow',
      'Kinesis',
      'Athena',
      'Power BI',
      'Alteryx',
      'Data Warehouse Design',
      'Lambda Architecture',
      'Data Mesh',
    ],
  },
  {
    name: 'DevOps & CI/CD',
    skills: [
      'GitHub Actions',
      'Jenkins',
      'SAST / DAST',
      'Feature Flagging (Unleash)',
      'Blue/Green Deployments',
      'Canary Deployments',
      'Automated Testing',
    ],
  },
  {
    name: 'Security',
    skills: [
      'ISO 27001 (2017 & 2022)',
      'PCI DSS',
      'Pen Test Remediation',
      'GitHub Advanced Security',
      'GuardDuty',
      'CloudTrail',
    ],
  },
  {
    name: 'Application Stack',
    skills: [
      'Next.js',
      'React',
      'Java',
      'Go',
      'PHP',
      'REST APIs',
      'GraphQL (AppSync)',
      'EventBridge',
      'SQS',
      'SNS',
      'Auth0',
    ],
  },
  {
    name: 'Methodology',
    skills: [
      'Agile (Scrum & Kanban)',
      'DORA Metrics',
      'Cycle / Lead Time Optimisation',
      '3 Amigos',
      'Release Management',
    ],
  },
];

export type Role = {
  title: string;
  period: string;
  company: string;
  bullets: string[];
};

export const experience: Role[] = [
  {
    title: 'Head of Engineering',
    period: 'Jun 2025 – Present',
    company: 'UK Membership & Loyalty Technology Business',
    bullets: [
      'Promoted to lead all engineering disciplines across an 18-person organisation (4 direct reports, 14 ICs) structured into Web, Mobile, Backend, DevOps, Data and QA teams — with full accountability for engineering strategy, SDLC governance, platform architecture, cost management, and talent development.',
      'Redesigned the engineering org structure from feature-based vertical teams to component teams, eliminating chronic context-switching and enabling a standardised SDLC across all disciplines.',
      'Reduced web deployment lead time by 75% (8 weeks → 2 weeks) and cut batch size from 15 items to near-1 by introducing DORA metrics, decoupling deployment from release, and implementing feature flagging via Unleash.',
      'Accelerated mobile release cadence from quarterly to every 4–6 weeks, reducing lead time from 3 months+ to ~8 weeks through process redesign and improved CI/CD practices.',
      'Delivered £180k/year platform saving by migrating four brand websites from a costly, over-engineered CMS setup (£300k/year) to a lean headless CMS + CloudFront architecture (~£120k/year).',
      'Saved $120k/year in AWS costs (~17% reduction from $720k to $600k) through rightsizing, savings plans, EKS node optimisation, database consolidation, and a strategic shift toward serverless compute.',
      'Retained and upgraded ISO 27001 certification from the 2017 to the 2022 standard, directing introduction of GitHub Advanced Security for SAST and secrets scanning, and reducing penetration test vulnerabilities to a single legacy system across the estate.',
    ],
  },
  {
    title: 'DevOps Manager',
    period: 'Jan 2023 – Jun 2025',
    company: 'UK Membership & Loyalty Technology Business',
    bullets: [
      'Built the DevOps function from scratch — replaced an underperforming third-party managed service with a three-engineer in-house team.',
      'Initiated and led the migration from Jenkins/Bitbucket to GitHub Actions, modernising the CI/CD foundation across the entire engineering estate.',
      'Led a high-stakes 4-week infrastructure rescue when a critical container orchestration cluster failure threatened production; architected and executed a full migration of containerised services to ECS/Fargate using IaC, with zero production outage.',
      'Maintained platform availability and security across AWS, Salesforce, and Zuora, serving as the integration layer between core business systems.',
    ],
  },
  {
    title: 'Lead Data Engineer',
    period: 'Sep 2021 – Dec 2022',
    company: 'UK Membership & Loyalty Technology Business',
    bullets: [
      "Architected and built the organisation's data warehouse from the ground up on a Fivetran / dbt / Snowflake / Airflow stack, implementing Lambda architecture for in-day incremental processing alongside overnight batch loads.",
      'Evolved the data model from Star Schema to a Data Mesh model with domain-specific databases as the platform matured.',
      'Designed and implemented the CI/CD pipeline for the data stack in dbt, providing local, test, staging and production environments with automated model testing and promotion — eliminating manual data deployments.',
      'Mentored and led a team of two data engineers, establishing data modelling standards and engineering practices that underpinned the platform long-term.',
    ],
  },
  {
    title: 'Data & Insight Lead',
    period: 'Apr 2020 – Sep 2021',
    company: 'UK Membership & Loyalty Technology Business',
    bullets: [
      'Led a team of four analysts serving the entire business, integrating offline and digital data to produce commercial insight.',
      'Built a Customer Lifetime Value (CLTV) model based on churn rate dimensions that directly informed CAC targets and marketing budget allocation — giving the business its first quantitative basis for acquisition investment decisions.',
    ],
  },
  {
    title: 'Senior BI Analyst',
    period: 'Nov 2018 – Apr 2020',
    company: 'UK Membership & Loyalty Technology Business',
    bullets: [
      'Inherited a legacy reporting estate and modernised it using Alteryx for workflow automation and Power BI for self-service dashboards.',
      'Automated previously manual reporting workflows, creating repeatable, reliable pipelines that freed analyst time for insight generation over data preparation.',
    ],
  },
  {
    title: 'Management Information Manager',
    period: 'Jun 2010 – Nov 2018',
    company: 'Government-Contracted Training & Skills Provider',
    bullets: [
      'Managed all data, reporting and MI functions for a large Government-contracted training provider, producing compliance datasets and analysis for DWP, ESFA and Ofsted.',
      'Built and maintained a bespoke customer journey database tracking 30,000+ programme participants across a multi-million pound government contract over 6 years, enabling financial forecasting and performance management within strict data governance requirements (Access, SQL Server, Tableau).',
      'Directly contributed to retaining a business-critical contract by successfully challenging auditors on data interpretation during a formal inspection.',
      'Replaced manual spreadsheet processes with interactive Tableau dashboards consumed by the leadership board and directors, delivering a full suite of compliance and operational reports.',
    ],
  },
];
