-- Create funding_opportunities table
CREATE TABLE IF NOT EXISTS public.funding_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL,
    amount TEXT,
    eligibility TEXT,
    deadline TEXT,
    link TEXT,
    category TEXT CHECK (category IN ('Grants', 'Equity/VC', 'Accelerators', 'Loans/Debt')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.funding_opportunities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Funding opportunities are viewable by authenticated users"
ON public.funding_opportunities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage funding opportunities"
ON public.funding_opportunities FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Seed initial funding opportunities
INSERT INTO public.funding_opportunities (title, description, content, amount, eligibility, deadline, link, category)
VALUES
(
  'Y Combinator W27 Funding Program',
  'YC invests $500,000 in startup founders twice a year. We help startups build their product, talk to users, raise money, and scale.',
  'Y Combinator is a startup accelerator that launches twice a year. We invest a standard $500,000 in every startup we accept. The investment is split into two parts: $125,000 on a post-money safe in exchange for 7% of your company, and $375,000 on an uncapped safe with a MFN (Most Favored Nation) provision. Beyond funding, YC founders join an elite, lifetime network and get access to top-tier mentorship, resources, and demo day. Startups at any stage, from a mere idea to post-revenue, are welcome to apply.',
  '$500,000',
  'Open to founders globally across all tech and business verticals.',
  'September 15, 2026',
  'https://www.ycombinator.com/apply',
  'Accelerators'
),
(
  'Google for Startups Accelerator: AI First',
  'A three-month program for high-growth tech startups using Artificial Intelligence and Machine Learning in their core product.',
  'The Google for Startups Accelerator: AI First is designed for startups based in North America and Europe that are leveraging AI/ML technologies. Selected startups receive equity-free support, technical mentorship from Google''s AI experts, Google Cloud credits up to $100k, and access to Google''s product teams. The program helps startups solve their technical challenges, optimize their machine learning models, and design go-to-market strategies.',
  'Up to $100,000 in Cloud Credits + Equity-free support',
  'Seed to Series A startups with AI/ML integrated into their core product.',
  'August 20, 2026',
  'https://startup.google.com/accelerator/',
  'Accelerators'
),
(
  'Thiel Fellowship for Young Entrepreneurs',
  'Founded by technology entrepreneur Peter Thiel, the Thiel Fellowship gives $100,000 to young people who want to build new things instead of sitting in a classroom.',
  'The Thiel Fellowship is a two-year program for young people who want to build new things. Thiel Fellows are given $100,000 over two years, alongside mentorship and guidance from the Thiel Foundation''s network of founders, investors, and scientists. The only condition is that fellows must drop out of college to pursue their startup full-time. The fellowship is highly competitive and open to applicants under the age of 22.',
  '$100,000 (Equity-free)',
  'Anyone aged 22 or younger who is willing to drop out of university.',
  'Rolling applications',
  'https://www.thielfellowship.org/',
  'Grants'
),
(
  'Techstars Startup Accelerator Program',
  'Techstars runs 3-month accelerators in cities worldwide, providing $120,000 in funding, mentorship, and lifetime access to the Techstars network.',
  'Techstars is a global investment business that provides access to capital, one-on-one mentorship, and customized programming. Every year, Techstars selects more than 500 early-stage companies to join one of its 3-month accelerator programs. Techstars invests $120,000 in each company: $20,000 in exchange for 6% equity, and an optional $100,000 convertible note. Founders receive hands-on mentorship, access to hundreds of investors, and office space during the program.',
  '$120,000',
  'Early-stage startups with a strong founding team and initial prototype.',
  'November 1, 2026',
  'https://www.techstars.com/',
  'Accelerators'
),
(
  'National Science Foundation (NSF) SBIR/STTR Grants',
  'The NSF SBIR program focuses on transforming scientific and engineering discoveries into products and services with commercial potential.',
  'The National Science Foundation (NSF) Small Business Innovation Research (SBIR) program, also known as America''s Seed Fund, provides up to $2 million in equity-free funding for startups developing deep-tech and high-impact technologies. Phase I awards provide up to $275,000 for feasibility research, while Phase II awards provide up to $1,000,000 for prototype development. The funding is non-dilutive, meaning the government takes no equity and no intellectual property rights.',
  'Up to $2,000,000 (Equity-free)',
  'U.S.-based small businesses with fewer than 500 employees developing high-risk tech.',
  'October 10, 2026',
  'https://seedfund.nsf.gov/',
  'Grants'
);
