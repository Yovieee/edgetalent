-- Seed Entrepreneurship and Startup Training Courses
INSERT INTO public.courses (title, description, skills_taught, provider, link)
VALUES
(
  'Startup School: How to Start a Startup',
  'A free, 10-week online course for founders and aspiring entrepreneurs by Y Combinator. Learn from industry leaders how to build a product, talk to users, get product-market fit, and pitch investors.',
  ARRAY['Entrepreneurship', 'Product-Market Fit', 'Pitching', 'Startup Scaling'],
  'Y Combinator',
  'https://www.startupschool.org/'
),
(
  'Venture Capital & Deal Structuring',
  'An intensive course on how venture capital works, how to raise money for your startup, and how to structure investor term sheets and equity tables.',
  ARRAY['Venture Capital', 'Financial Modeling', 'Entrepreneurship', 'Business Strategy'],
  'Wharton School of Business',
  'https://online.wharton.upenn.edu/'
),
(
  'Product Strategy for Entrepreneurs',
  'Learn how to define your product vision, map customer segments, test value propositions, and design product roadmaps aligned with startup goals.',
  ARRAY['Product-Market Fit', 'Business Strategy', 'Entrepreneurship'],
  'Kellogg School of Management',
  'https://www.kellogg.northwestern.edu/'
),
(
  'Growth Marketing & Customer Acquisition',
  'A deep dive into performance marketing, viral loops, search engine optimization (SEO), and scalable growth frameworks for startup founders.',
  ARRAY['Marketing Strategy', 'Startup Scaling', 'Entrepreneurship'],
  'Reforge',
  'https://www.reforge.com/'
),
(
  'Strategic Leadership & Business Operations',
  'Master the fundamentals of team leadership, organizational design, business development, and scaling operations in high-growth companies.',
  ARRAY['Leadership', 'Business Strategy', 'Entrepreneurship', 'Startup Scaling'],
  'Harvard Business School',
  'https://online.hbs.edu/'
);
