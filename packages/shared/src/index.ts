import { z } from "zod";

// 1. Auth Schemas
export const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long.")
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
  fullName: z.string().min(2, "Full name must be at least 2 characters long.")
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

// 2. Profile Schemas
export const PortfolioLinksSchema = z.object({
  github: z.string().url("Must be a valid URL").or(z.literal("")),
  linkedin: z.string().url("Must be a valid URL").or(z.literal("")),
  website: z.string().url("Must be a valid URL").or(z.literal(""))
}).default({ github: "", linkedin: "", website: "" });

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  updated_at: z.string().optional(),
  full_name: z.string().min(1, "Name cannot be empty"),
  email: z.string().email(),
  avatar_url: z.string().nullable().optional(),
  role: z.enum(["talent", "partner", "admin"]).nullable().optional(),
  bio: z.string().nullable().optional(),
  portfolio_links: PortfolioLinksSchema.optional(),
  skills: z.array(z.string()).default([]),
  skill_gaps: z.array(z.string()).default([]),
  skills_embedding: z.array(z.number()).nullable().optional()
});

export type Profile = z.infer<typeof ProfileSchema>;

// 3. Project Schemas
export const ProjectSchema = z.object({
  id: z.string().uuid().optional(),
  partner_id: z.string().uuid(),
  title: z.string().min(3, "Title must be at least 3 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  required_skills: z.array(z.string()).min(1, "Specify at least one required skill"),
  budget: z.number().nullable().optional(),
  scope: z.enum(["short-term", "medium-term", "long-term"]),
  created_at: z.string().optional()
});

export type Project = z.infer<typeof ProjectSchema>;

// 4. Application Schemas
export const ApplicationSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  talent_id: z.string().uuid(),
  status: z.enum(["applied", "reviewing", "shortlisted", "accepted", "rejected"]),
  match_percentage: z.number().nullable().optional(),
  match_breakdown: z.any().optional(),
  applied_at: z.string().optional()
});

export type Application = z.infer<typeof ApplicationSchema>;

// 5. Course Schema
export const CourseSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, "Title must be at least 3 characters long"),
  description: z.string().optional().nullable(),
  skills_taught: z.array(z.string()).default([]),
  provider: z.string().optional().nullable(),
  link: z.string().url("Must be a valid URL").or(z.literal("")).optional().nullable(),
  created_at: z.string().optional()
});

export type Course = z.infer<typeof CourseSchema>;

// 6. Quiz Question Schema
export const QuizQuestionSchema = z.object({
  id: z.string().uuid().optional(),
  category: z.enum(["frontend", "backend", "ai"]),
  question: z.string().min(5, "Question must be at least 5 characters long"),
  options: z.array(z.string()).min(2, "Provide at least two options"),
  answer: z.string().min(1, "Answer cannot be empty"),
  created_at: z.string().optional()
});

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

// 7. Course Lesson Schema
export const CourseLessonSchema = z.object({
  id: z.string().uuid().optional(),
  course_id: z.string().uuid(),
  title: z.string().min(3, "Title must be at least 3 characters long"),
  content: z.string().min(10, "Content must be at least 10 characters long"),
  sequence_order: z.number().int().nonnegative(),
  duration_minutes: z.number().int().positive().default(10),
  created_at: z.string().optional()
});

export type CourseLesson = z.infer<typeof CourseLessonSchema>;

// 8. Course Enrollment Schema
export const CourseEnrollmentSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  course_id: z.string().uuid(),
  completed_lessons: z.array(z.string().uuid()).default([]),
  completed_at: z.string().nullable().optional(),
  last_accessed_at: z.string().optional(),
  created_at: z.string().optional()
});

export type CourseEnrollment = z.infer<typeof CourseEnrollmentSchema>;

// 9. Funding Opportunity Schema
export const FundingOpportunitySchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, "Title must be at least 3 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  content: z.string().min(10, "Content must be at least 10 characters long"),
  amount: z.string().optional().nullable(),
  eligibility: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  link: z.string().url("Must be a valid URL").or(z.literal("")).optional().nullable(),
  category: z.enum(["Grants", "Equity/VC", "Accelerators", "Loans/Debt"]),
  created_at: z.string().optional()
});

export type FundingOpportunity = z.infer<typeof FundingOpportunitySchema>;

// 10. Event Schema
export const EventSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, "Title must be at least 3 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  content: z.string().min(10, "Content must be at least 10 characters long"),
  event_date: z.string().datetime("Must be a valid ISO datetime string").or(z.string().min(1, "Date cannot be empty")),
  location: z.string().min(1, "Location cannot be empty"),
  organizer: z.string().min(1, "Organizer cannot be empty"),
  organizer_id: z.string().uuid().optional().nullable(),
  category: z.enum(["Hackathon", "Webinar", "Workshop", "Networking", "Pitch Night"]),
  capacity: z.number().int().positive().nullable().optional(),
  link: z.string().url("Must be a valid URL").or(z.literal("")).optional().nullable(),
  created_at: z.string().optional()
});

export type Event = z.infer<typeof EventSchema>;

// 11. Event Registration Schema
export const EventRegistrationSchema = z.object({
  id: z.string().uuid().optional(),
  event_id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string().optional()
});

export type EventRegistration = z.infer<typeof EventRegistrationSchema>;
