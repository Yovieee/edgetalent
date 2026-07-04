import { createClient } from "@supabase/supabase-js";

const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are valid
const useMock = !supabaseUrl || supabaseUrl === "" || supabaseUrl.includes("placeholder-url");

if (useMock) {
  console.log("🛠️ Running EdgeTalent with In-Memory / LocalStorage Mock Supabase Client!");
} else {
  console.log("🔌 Connecting to live Supabase Instance at:", supabaseUrl);
}

// UUID generator compliant with RFC 4122
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// In-Memory Database Structure backed by LocalStorage for E2E persistence
interface MockDB {
  profiles: any[];
  projects: any[];
  applications: any[];
  courses: any[];
  users: any[];
  currentSession: any;
}

const DEFAULT_COURSES = [
  {
    id: "c1",
    title: "PostgreSQL & pgvector Deep Dive",
    description: "Learn vector similarity search, embeddings, and database scaling.",
    skills_taught: ["pgvector", "PostgreSQL", "Database"],
    provider: "EdgeTalent Academy",
    link: "https://example.com/pgvector",
    created_at: new Date().toISOString()
  },
  {
    id: "c2",
    title: "Mastering Deno & Edge Functions",
    description: "Deploy fast, globally-distributed serverless functions.",
    skills_taught: ["Deno", "TypeScript", "Edge Functions"],
    provider: "Deno Land",
    link: "https://example.com/deno",
    created_at: new Date().toISOString()
  },
  {
    id: "c3",
    title: "React & Vite Modern Architectures",
    description: "Build high-performance single page apps with Vite.",
    skills_taught: ["React", "TypeScript", "Vite"],
    provider: "Frontend Masters",
    link: "https://example.com/react",
    created_at: new Date().toISOString()
  }
];

const DEFAULT_PROJECTS = [
  {
    id: generateUUID(),
    partner_id: generateUUID(),
    title: "EdgeTalent AI Matching Engine",
    description: "Build an end-to-end vector matching pipeline inside PostgreSQL using pgvector, TypeScript, and Deno edge functions.",
    required_skills: ["TypeScript", "Supabase", "pgvector"],
    budget: 1500,
    scope: "medium-term",
    created_at: new Date().toISOString()
  },
  {
    id: generateUUID(),
    partner_id: generateUUID(),
    title: "Enterprise Inventory Dashboard",
    description: "Create a beautiful React dashboard for stock tracking and predictive order optimization.",
    required_skills: ["React", "TypeScript"],
    budget: 800,
    scope: "short-term",
    created_at: new Date().toISOString()
  }
];

function getMockDB(): MockDB {
  const data = localStorage.getItem("edgetalent_mock_db");
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }
  const db: MockDB = {
    profiles: [],
    projects: DEFAULT_PROJECTS,
    applications: [],
    courses: DEFAULT_COURSES,
    users: [],
    currentSession: null
  };
  saveMockDB(db);
  return db;
}

function saveMockDB(db: MockDB) {
  localStorage.setItem("edgetalent_mock_db", JSON.stringify(db));
}

// Global listeners for auth changes
const authListeners: ((event: string, session: any) => void)[] = [];

// Helper to notify listeners
function notifyAuthChange(event: string, session: any) {
  authListeners.forEach(listener => {
    try {
      listener(event, session);
    } catch (e) {
      console.error("Auth listener error", e);
    }
  });
}

// Fluent Mock Query Builder
class MockQueryBuilder {
  private table: string;
  private currentData: any[];

  constructor(table: string, currentData: any[]) {
    this.table = table;
    this.currentData = currentData;
  }

  select(columns: string = "*", options?: { count?: string; head?: boolean }) {
    // Return this builder for chainability
    return this;
  }

  eq(column: string, value: any) {
    this.currentData = this.currentData.filter(item => item[column] === value);
    return this;
  }

  in(column: string, values: any[]) {
    this.currentData = this.currentData.filter(item => values.includes(item[column]));
    return this;
  }

  overlaps(column: string, values: any[]) {
    this.currentData = this.currentData.filter(item => {
      const arr = item[column];
      if (Array.isArray(arr) && Array.isArray(values)) {
        return arr.some(v => values.includes(v));
      }
      return false;
    });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.currentData.sort((a, b) => {
      const valA = a[column];
      const valB = b[column];
      if (valA < valB) return options?.ascending ? -1 : 1;
      if (valA > valB) return options?.ascending ? 1 : -1;
      return 0;
    });
    return this;
  }

  limit(n: number) {
    this.currentData = this.currentData.slice(0, n);
    return this;
  }

  // To support awaiting the query builder directly (like supabase-js)
  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    let resolvedData = [...this.currentData];
    if (this.table === "applications" && resolvedData.length > 0) {
      const db = getMockDB();
      resolvedData = resolvedData.map(app => {
        const proj = db.projects.find(p => p.id === app.project_id);
        return {
          ...app,
          projects: proj || null
        };
      });
    }

    return Promise.resolve({ data: resolvedData, error: null }).then(onfulfilled, onrejected);
  }

  async single() {
    let resolvedData = [...this.currentData];
    const item = resolvedData[0] || null;
    return { data: item, error: item ? null : { message: "Row not found" } };
  }
}

const mockSupabase = {
  auth: {
    async getSession() {
      const db = getMockDB();
      return { data: { session: db.currentSession }, error: null };
    },
    async signUp({ email, password, options }: any) {
      const db = getMockDB();
      const existingUser = db.users.find(u => u.email === email);
      if (existingUser) {
        return { data: { user: null, session: null }, error: { message: "User already registered" } };
      }
      const userId = generateUUID();
      const user = { id: userId, email, raw_user_meta_data: options?.data || {} };
      db.users.push({ ...user, password });
      
      // Auto create profile (database trigger simulation)
      const profile = {
        id: userId,
        full_name: options?.data?.full_name || "",
        email,
        avatar_url: "",
        role: null,
        skills: [],
        skill_gaps: [],
        portfolio_links: { github: "", linkedin: "", website: "" },
        created_at: new Date().toISOString()
      };
      db.profiles.push(profile);
      
      const session = { access_token: "mock-token", token_type: "bearer", expires_in: 3600, refresh_token: "mock-refresh", user };
      db.currentSession = session;
      saveMockDB(db);
      
      notifyAuthChange("SIGNED_IN", session);
      return { data: { user, session }, error: null };
    },
    async signInWithPassword({ email, password }: any) {
      const db = getMockDB();
      const userRecord = db.users.find(u => u.email === email && u.password === password);
      if (!userRecord) {
        return { data: { user: null, session: null }, error: { message: "Invalid login credentials" } };
      }
      const user = { id: userRecord.id, email: userRecord.email, raw_user_meta_data: userRecord.raw_user_meta_data };
      const session = { access_token: "mock-token", token_type: "bearer", expires_in: 3600, refresh_token: "mock-refresh", user };
      db.currentSession = session;
      saveMockDB(db);
      
      notifyAuthChange("SIGNED_IN", session);
      return { data: { user, session }, error: null };
    },
    onAuthStateChange(callback: any) {
      authListeners.push(callback);
      const db = getMockDB();
      // call immediately with current state
      setTimeout(() => {
        callback(db.currentSession ? "SIGNED_IN" : "SIGNED_OUT", db.currentSession);
      }, 0);
      return {
        data: {
          subscription: {
            unsubscribe() {
              const idx = authListeners.indexOf(callback);
              if (idx !== -1) authListeners.splice(idx, 1);
            }
          }
        }
      };
    },
    async signOut() {
      const db = getMockDB();
      db.currentSession = null;
      saveMockDB(db);
      notifyAuthChange("SIGNED_OUT", null);
      return { error: null };
    }
  },
  from(tableName: string) {
    return {
      select(columns: string = "*", options?: { count?: string; head?: boolean }) {
        const db = getMockDB();
        const records = (db as any)[tableName] || [];
        if (options?.count === "exact" && options?.head) {
          return {
            in(column: string, values: any[]) {
              const matched = records.filter((r: any) => values.includes(r[column]));
              return Promise.resolve({ count: matched.length, data: null, error: null });
            }
          };
        }
        return new MockQueryBuilder(tableName, records);
      },
      insert(data: any) {
        const db = getMockDB();
        const records = (db as any)[tableName] || [];
        const newRecord = {
          id: generateUUID(),
          created_at: new Date().toISOString(),
          ...data
        };
        records.push(newRecord);
        (db as any)[tableName] = records;
        saveMockDB(db);

        const result = { data: newRecord, error: null };
        const resultList = { data: [newRecord], error: null };

        return {
          select() {
            return {
              async single() {
                return result;
              },
              then(onfulfilled?: (value: any) => any) {
                return Promise.resolve(resultList).then(onfulfilled);
              }
            };
          },
          then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
            return Promise.resolve(resultList).then(onfulfilled, onrejected);
          }
        };
      },
      update(updateData: any) {
        return {
          eq(column: string, value: any) {
            const db = getMockDB();
            const records = (db as any)[tableName] || [];
            const updatedRecords = records.map((record: any) => {
              if (record[column] === value) {
                return { ...record, ...updateData };
              }
              return record;
            });
            (db as any)[tableName] = updatedRecords;
            saveMockDB(db);
            
            const resultList = { data: updatedRecords, error: null };
            return {
              then(onfulfilled?: (value: any) => any) {
                return Promise.resolve(resultList).then(onfulfilled);
              }
            };
          }
        };
      }
    };
  },
  rpc(fnName: string, args: any) {
    const db = getMockDB();
    if (fnName === "match_projects_for_talent") {
      const matches = db.projects.map((p, idx) => ({
        project_id: p.id,
        title: p.title,
        description: p.description,
        budget: p.budget,
        scope: p.scope,
        required_skills: p.required_skills,
        similarity: 0.95 - (idx * 0.1)
      }));
      return Promise.resolve({ data: matches.slice(0, args?.p_match_limit || 5), error: null });
    }
    if (fnName === "match_talents_for_project") {
      const talents = db.profiles.filter(p => p.role === "talent");
      if (talents.length === 0) {
        talents.push({
          id: generateUUID(),
          full_name: "Mock AI Expert",
          email: "expert@edgetalent.com",
          role: "talent",
          skills: ["TypeScript", "Supabase", "pgvector"],
          skill_gaps: [],
          bio: "Experienced AI specialist with pgvector and python background.",
          created_at: new Date().toISOString()
        });
      }
      const matches = talents.map((t, idx) => ({
        talent_id: t.id,
        full_name: t.full_name,
        email: t.email,
        skills: t.skills,
        bio: t.bio || "AI Engineer specializing in vector search pipelines.",
        similarity: 0.92 - (idx * 0.05)
      }));
      return Promise.resolve({ data: matches.slice(0, args?.p_match_limit || 5), error: null });
    }
    return Promise.resolve({ data: [], error: { message: "RPC not implemented in mock" } });
  },
  functions: {
    async invoke(fnName: string, options: any) {
      const db = getMockDB();
      if (fnName === "analyze-skill-gap") {
        const { targetRole } = options?.body || {};
        const result = {
          analysis: {
            extractedSkills: ["React", "TypeScript", "HTML"],
            skillGaps: ["pgvector", "Deno", "Supabase"],
            explanation: `Simulated AI Skill-Gap Analysis for role: ${targetRole}. Extracted current competencies and mapped gaps relative to industry demand.`
          },
          quiz: {
            question: "Which of the following is true about Deno?",
            options: [
              "It runs on Node.js core modules",
              "It supports TypeScript out of the box",
              "It uses npm package.json by default",
              "It is built in Python"
            ],
            correctAnswer: "It supports TypeScript out of the box"
          }
        };

        if (db.currentSession?.user?.id) {
          db.profiles = db.profiles.map(p => {
            if (p.id === db.currentSession.user.id) {
              return {
                ...p,
                skills: result.analysis.extractedSkills,
                skill_gaps: result.analysis.skillGaps,
                skills_embedding: Array(1536).fill(0.05)
              };
            }
            return p;
          });
          saveMockDB(db);
        }

        return { data: result, error: null };
      }
      if (fnName === "generate-project-embeddings") {
        const { projectId } = options?.body || {};
        if (projectId) {
          db.projects = db.projects.map(p => {
            if (p.id === projectId) {
              return {
                ...p,
                embedding: Array(1536).fill(0.04)
              };
            }
            return p;
          });
          saveMockDB(db);
        }
        return { data: { success: true }, error: null };
      }
      return { data: null, error: { message: "Function not implemented in mock" } };
    }
  }
};

export const supabase = useMock
  ? (mockSupabase as any)
  : createClient(supabaseUrl, supabaseAnonKey);
