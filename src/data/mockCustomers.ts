/**
 * Internal raw dataset — never import this directly in components.
 * All data access must go through src/lib/mockApi.ts.
 */

export interface CustomerDocument {
  id: string;
  fileName: string;
  sizeBytes: number; // 1 MB – 2 MB
  pages: number;    // 10 – 50
  uploadedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  country: string;
  status: 'Active' | 'Inactive';
  joinedAt: string;
  document: CustomerDocument;
}

const FIRST_NAMES = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Lisa', 'Daniel', 'Nancy',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Dorothy', 'Paul', 'Kimberly', 'Andrew', 'Emily', 'Joshua', 'Donna',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen',
  'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera',
  'Campbell', 'Mitchell', 'Carter', 'Roberts',
];

const COMPANIES = [
  'Microsoft', 'Apple', 'Google', 'Amazon', 'Meta', 'Tesla', 'Netflix', 'Adobe',
  'Salesforce', 'Oracle', 'SAP', 'IBM', 'Intel', 'Cisco', 'Qualcomm', 'NVIDIA',
  'PayPal', 'Stripe', 'Square', 'Shopify', 'Zoom', 'Slack', 'Dropbox', 'Box',
  'HubSpot', 'Zendesk', 'Intercom', 'Atlassian', 'GitHub', 'GitLab',
  'Figma', 'Notion', 'Airtable', 'Webflow', 'Vercel', 'Twilio', 'MongoDB',
  'Snowflake', 'Databricks', 'Palantir', 'Cloudflare', 'Fastly', 'Confluent',
];

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France',
  'Japan', 'South Korea', 'Brazil', 'Mexico', 'India', 'China', 'Singapore',
  'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Switzerland', 'Austria',
  'Spain', 'Italy', 'Portugal', 'Poland', 'Czech Republic', 'Israel',
  'United Arab Emirates', 'South Africa', 'New Zealand', 'Argentina', 'Chile',
  'Colombia', 'Nigeria', 'Kenya', 'Romania', 'Hungary',
];

const DOC_PREFIXES = [
  'contract', 'agreement', 'proposal', 'report', 'invoice',
  'statement', 'policy', 'brief', 'amendment', 'addendum',
];

// Deterministic pseudo-random helpers (no Math.random — stable across reloads)
function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs((seed * 2654435761) >>> 0) % arr.length];
}

function seededInt(seed: number, min: number, max: number): number {
  return min + (Math.abs((seed * 1664525 + 1013904223) >>> 0) % (max - min + 1));
}

function zeroPad(n: number, len = 4): string {
  return String(n).padStart(len, '0');
}

function isoDate(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function generate(count: number): Customer[] {
  return Array.from({ length: count }, (_, i) => {
    const s = i + 1;
    const firstName = pick(FIRST_NAMES, s);
    const lastName  = pick(LAST_NAMES, s * 7 + 3);
    const company   = pick(COMPANIES, s * 13 + 5);
    const country   = pick(COUNTRIES, s * 17 + 9);
    const domain    = company.toLowerCase().replace(/\s+/g, '');
    const area      = seededInt(s * 3, 201, 989);
    const line      = zeroPad(seededInt(s * 5, 0, 9999), 4);
    const status: 'Active' | 'Inactive' = seededInt(s, 0, 2) === 0 ? 'Inactive' : 'Active';
    const joinY = 2020 + seededInt(s * 11, 0, 4);
    const joinM = seededInt(s * 19, 1, 12);
    const joinD = seededInt(s * 23, 1, 28);
    const docY  = seededInt(s * 29, 2023, 2025);
    const docM  = seededInt(s * 31, 1, 12);
    const docD  = seededInt(s * 37, 1, 28);

    return {
      id:       `cust-${zeroPad(s)}`,
      name:     `${firstName} ${lastName}`,
      company,
      phone:    `(${area}) 555-${line}`,
      email:    `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}.com`,
      country,
      status,
      joinedAt: isoDate(joinY, joinM, joinD),
      document: {
        id:         `doc-${zeroPad(s)}`,
        fileName:   `${pick(DOC_PREFIXES, s * 41)}_${zeroPad(s)}.pdf`,
        sizeBytes:  seededInt(s * 43, 1_000_000, 2_000_000),
        pages:      seededInt(s * 47, 10, 50),
        uploadedAt: isoDate(docY, docM, docD),
      },
    };
  });
}

export const _customers: Customer[] = generate(400);
