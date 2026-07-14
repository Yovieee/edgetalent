import { test, expect } from '@playwright/test';

test.describe('EdgeTalent Complete E2E User Journeys', () => {
  let hasApplied = false;

  // Clear localStorage and intercept edge function and database calls to run hermetic tests
  test.beforeEach(async ({ page }) => {
    hasApplied = false; // reset for each test run

    // Mock analyze-skill-gap Edge Function
    await page.route('**/functions/v1/analyze-skill-gap', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          skills: ["React", "TypeScript", "HTML5 & CSS3"],
          skill_gaps: ["pgvector", "AWS Cloud Deployments"],
          bio: "Senior React engineer with a focus on high-performance SPAs."
        })
      });
    });

    // Mock generate-project-embeddings Edge Function
    await page.route('**/functions/v1/generate-project-embeddings', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    // Mock courses database query
    await page.route('**/rest/v1/courses**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: "00000000-0000-0000-0000-000000000002",
            title: "PostgreSQL & pgvector Deep Dive",
            description: "Learn how to use pgvector for semantic search.",
            skills_taught: ["pgvector"],
            provider: "EdgeTalent Academy",
            link: "https://example.com"
          }
        ])
      });
    });

    // Mock projects database query
    await page.route('**/rest/v1/projects**', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: "00000000-0000-0000-0000-000000000003",
              partner_id: "00000000-0000-0000-0000-000000000004",
              title: "Next-Gen Quantum Compiler",
              description: "Build a compiler pipeline using web assembly, typescript, and vector optimization models.",
              required_skills: ["WebAssembly", "TypeScript", "Quantum Computing"],
              budget: 5000,
              scope: "medium-term",
              embedding: Array(1536).fill(0.025) // mock embedding is populated
            }
          ])
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: "00000000-0000-0000-0000-000000000003",
            title: "Next-Gen Quantum Compiler"
          })
        });
      }
    });

    // Mock match_talents_for_project RPC call
    await page.route('**/rest/v1/rpc/match_talents_for_project**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            talent_id: "00000000-0000-0000-0000-000000000001",
            full_name: "Mock AI Expert",
            email: "expert@edgetalent.com",
            skills: ["Python", "TensorFlow", "PyTorch"],
            bio: "Experienced AI/ML researcher specializing in deep neural networks.",
            similarity: 0.85
          }
        ])
      });
    });

    // Mock match_projects_for_talent RPC call
    await page.route('**/rest/v1/rpc/match_projects_for_talent**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            project_id: "00000000-0000-0000-0000-000000000003",
            title: "EdgeTalent AI Matching Engine",
            description: "Build an end-to-end vector matching pipeline inside PostgreSQL using pgvector, typescript, and deno edge functions.",
            budget: 1500,
            scope: "medium-term",
            required_skills: ["TypeScript", "Supabase", "pgvector"],
            similarity: 0.95
          }
        ])
      });
    });

    // Mock applications database query (stateful)
    await page.route('**/rest/v1/applications**', async (route) => {
      const method = route.request().method();
      if (method === 'HEAD') {
        await route.fulfill({
          status: 200,
          headers: {
            'content-range': hasApplied ? '0-0/1' : '0-0/0'
          }
        });
      } else if (method === 'GET') {
        if (hasApplied) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
              {
                id: "00000000-0000-0000-0000-000000000005",
                project_id: "00000000-0000-0000-0000-000000000003",
                talent_id: "00000000-0000-0000-0000-000000000001",
                status: "applied",
                match_percentage: 95,
                match_breakdown: { score_method: "pgvector cosine similarity" },
                applied_at: new Date().toISOString(),
                projects: {
                  id: "00000000-0000-0000-0000-000000000003",
                  title: "EdgeTalent AI Matching Engine",
                  description: "Build an end-to-end vector matching pipeline.",
                  required_skills: ["TypeScript", "Supabase", "pgvector"],
                  budget: 1500,
                  scope: "medium-term"
                }
              }
            ])
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
          });
        }
      } else if (method === 'POST') {
        hasApplied = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('edgetalent_mock_db'));
  });

  test('Talent Journey: register, onboard, update profile, run AI analyzer, check courses, and apply for a project', async ({ page }) => {
    // 1. Visit Landing Page and Navigate to Auth
    await page.goto('/');
    await expect(page).toHaveTitle(/EdgeTalent/);
    const getStartedBtn = page.locator('button#nav-btn-register');
    await getStartedBtn.click();

    // 2. Register a new user
    const toggleToSignUpBtn = page.locator('button', { hasText: 'Register' });
    await toggleToSignUpBtn.click();

    const fullNameInput = page.locator('input#fullName');
    const emailInput = page.locator('input#email');
    const passwordInput = page.locator('input#password');
    const submitBtn = page.locator('button[type="submit"]', { hasText: 'Sign Up' });

    const testEmail = `talent.${Date.now()}@edgetalent.com`;
    await fullNameInput.fill('Alex Developer');
    await emailInput.fill(testEmail);
    await passwordInput.fill('supersecret123');
    await submitBtn.click();

    // 3. Complete Persona Onboarding
    const onboardingHeader = page.locator('h2', { hasText: 'Select Your Persona' });
    await expect(onboardingHeader).toBeVisible();

    const selectTalentBtn = page.locator('button', { hasText: 'Select Talent Profile' });
    await selectTalentBtn.click();

    // 4. Verify Dashboard Welcome message
    const welcomeHeader = page.locator('.user-profile-menu', { hasText: 'Alex Developer' });
    await expect(welcomeHeader).toBeVisible();

    // 5. Navigate to Profile Builder and update info
    const profileTabBtn = page.locator('button', { hasText: 'My Profile' });
    await profileTabBtn.click();

    const bioInput = page.locator('label:has-text("Biography Summary") + textarea');
    await bioInput.fill('Senior React engineer with a focus on high-performance SPAs.');
    const saveProfileBtn = page.locator('button', { hasText: 'Update Profile' });
    await saveProfileBtn.click();

    const successBadge = page.locator('.badge', { hasText: 'Profile updated successfully!' });
    await expect(successBadge).toBeVisible();

    // 6. Navigate to Skills & Interests Quiz Center
    const analyzerTabBtn = page.locator('button', { hasText: 'Skills & Interests' }).first();
    await analyzerTabBtn.click();

    // Start Frontend Quiz
    const startQuizBtn = page.locator('#btn-quiz-frontend-start');
    await expect(startQuizBtn).toBeVisible();
    await startQuizBtn.click();

    // Question 1
    await page.locator('.quiz-option-btn-0-0').click();
    await page.locator('#btn-quiz-next').click();

    // Question 2
    await page.locator('.quiz-option-btn-1-0').click();
    await page.locator('#btn-quiz-next').click();

    // Question 3
    await page.locator('.quiz-option-btn-2-0').click();
    await page.locator('#btn-quiz-next').click();

    // Question 4
    await page.locator('.quiz-option-btn-3-0').click();
    await page.locator('#btn-quiz-next').click();

    // Question 5
    await page.locator('.quiz-option-btn-4-0').click();
    await page.locator('#btn-quiz-finish').click();

    // Configure Preferences
    const interestsBtn = page.locator('#btn-quiz-interests-start');
    await expect(interestsBtn).toBeVisible();
    await interestsBtn.click();
    await page.locator('#select-interest-role').selectOption('Fullstack Developer');
    await page.locator('#select-interest-arrangement').selectOption('Remote');
    await page.locator('#select-interest-experience').selectOption('Senior');
    await page.locator('#input-interest-goals').fill('Learn advanced backend and deployment strategies.');
    await page.locator('#btn-save-interests').click();

    // Submit Quiz & Interests
    const submitQuizBtn = page.locator('#btn-submit-quiz-interests');
    await expect(submitQuizBtn).toBeVisible();
    await submitQuizBtn.click();

    // Verify assessment results render
    const resultsHeader = page.locator('h3', { hasText: 'Assessment Results' });
    await expect(resultsHeader).toBeVisible();
    const verifiedSkillBadge = page.locator('.badge-emerald', { hasText: 'React' }).first();
    await expect(verifiedSkillBadge).toBeVisible();
    const gapBadge = page.locator('.badge-rose', { hasText: 'pgvector' }).first();
    await expect(gapBadge).toBeVisible();

    // 7. Check Upskilling Hub (should list recommended courses based on gaps)
    const upskillingTabBtn = page.locator('button', { hasText: 'Upskilling' });
    await upskillingTabBtn.click();
    const coursesTitle = page.locator('h3', { hasText: 'Recommended Upskilling Paths' });
    await expect(coursesTitle).toBeVisible();
    const courseCard = page.locator('h4', { hasText: 'PostgreSQL & pgvector Deep Dive' });
    await expect(courseCard).toBeVisible();

    // 8. Go to Marketplace and apply for a project
    const marketplaceTabBtn = page.locator('button', { hasText: 'Marketplace' });
    await marketplaceTabBtn.click();

    const applyBtn = page.locator('button', { hasText: 'Apply' }).first();
    await expect(applyBtn).toBeVisible();
    await applyBtn.click();

    // Verify button state changes to "Applied"
    const appliedBtn = page.locator('button', { hasText: 'Applied' }).first();
    await expect(appliedBtn).toBeVisible();

    // 9. Go back to Overview and verify applications count and list
    const overviewTabBtn = page.locator('button', { hasText: 'Overview' });
    await overviewTabBtn.click();

    const activeAppBadge = page.locator('p', { hasText: '1 Active' });
    await expect(activeAppBadge).toBeVisible();
    const appItem = page.locator('h4', { hasText: 'EdgeTalent AI Matching Engine' });
    await expect(appItem).toBeVisible();

    // 10. Sign out and return home
    const signOutBtn = page.locator('button', { hasText: 'Sign Out' });
    await signOutBtn.click();

    const welcomeBackHeader = page.locator('h2', { hasText: 'Welcome Back' });
    await expect(welcomeBackHeader).toBeVisible();

    const backToHomeBtn = page.locator('button', { hasText: '← Back to Home' });
    await backToHomeBtn.click();

    const landingBadge = page.locator('.badge', { hasText: 'EdgeTalent Ecosystem' });
    await expect(landingBadge).toBeVisible();
  });

  test('Partner Journey: register, onboard, post project and check AI candidate matches', async ({ page }) => {
    // 1. Visit Landing Page and Navigate to Auth
    await page.goto('/');
    const getStartedBtn = page.locator('button#nav-btn-register');
    await getStartedBtn.click();

    // 2. Register a new partner user
    const toggleToSignUpBtn = page.locator('button', { hasText: 'Register' });
    await toggleToSignUpBtn.click();

    const fullNameInput = page.locator('input#fullName');
    const emailInput = page.locator('input#email');
    const passwordInput = page.locator('input#password');
    const submitBtn = page.locator('button[type="submit"]', { hasText: 'Sign Up' });

    const testEmail = `partner.${Date.now()}@edgetalent.com`;
    await fullNameInput.fill('Google DeepMind Partner');
    await emailInput.fill(testEmail);
    await passwordInput.fill('supersecret123');
    await submitBtn.click();

    // 3. Complete Persona Onboarding as Partner
    const selectPartnerBtn = page.locator('button', { hasText: 'Select Partner Profile' });
    await selectPartnerBtn.click();

    // 4. Verify Dashboard Header
    const welcomeHeader = page.locator('.user-profile-menu', { hasText: 'Google DeepMind Partner' });
    await expect(welcomeHeader).toBeVisible();

    // 5. Navigate to Project Manager Portal and post a new project
    const portalTabBtn = page.locator('button', { hasText: 'Post New Project' });
    await portalTabBtn.click();

    const projTitleInput = page.locator('label:has-text("Project Title") + input');
    const projDescInput = page.locator('label:has-text("Description & Scope") + textarea');
    const projSkillsInput = page.locator('label:has-text("Required Skills") + input');
    const projBudgetInput = page.locator('label:has-text("Budget") + input');
    const postProjBtn = page.locator('button[type="submit"]', { hasText: 'Post Project Scope' });

    await projTitleInput.fill('Next-Gen Quantum Compiler');
    await projDescInput.fill('Build a compiler pipeline using web assembly, typescript, and vector optimization models.');
    await projSkillsInput.fill('WebAssembly, TypeScript, Quantum Computing');
    await projBudgetInput.fill('5000');
    await postProjBtn.click();

    // Verify project posted successfully
    const successMsg = page.locator('.badge', { hasText: 'Project posted successfully with vector embeddings!' });
    await expect(successMsg).toBeVisible();

    // 6. Go to Partner Overview and verify the project shows up
    const overviewTabBtn = page.locator('button', { hasText: 'Projects Dashboard' });
    await overviewTabBtn.click();

    const postedProjectTitle = page.locator('h4', { hasText: 'Next-Gen Quantum Compiler' });
    await expect(postedProjectTitle).toBeVisible();

    // 7. Expand matches inline on the dashboard
    const findMatchesBtn = page.locator('button', { hasText: 'Find Talent Matches' }).first();
    await expect(findMatchesBtn).toBeVisible();
    await findMatchesBtn.click();

    // Verify candidate matches list is displayed
    const candidateName = page.locator('h6', { hasText: 'Mock AI Expert' });
    await expect(candidateName).toBeVisible();
    const contactBtn = page.locator('a', { hasText: 'Contact' });
    await expect(contactBtn).toBeVisible();
    await expect(contactBtn).toHaveAttribute('href', 'mailto:expert@edgetalent.com');

    // 8. Sign out and return home
    const signOutBtn = page.locator('button', { hasText: 'Sign Out' });
    await signOutBtn.click();

    const welcomeBackHeader = page.locator('h2', { hasText: 'Welcome Back' });
    await expect(welcomeBackHeader).toBeVisible();

    const backToHomeBtn = page.locator('button', { hasText: '← Back to Home' });
    await backToHomeBtn.click();

    const landingBadge = page.locator('.badge', { hasText: 'EdgeTalent Ecosystem' });
    await expect(landingBadge).toBeVisible();
  });

  test('Admin Journey: login/onboard as admin and manage quizzes, courses, jobs, and users', async ({ page }) => {
    // Intercept profile fetch to mock the admin role
    await page.route('**/rest/v1/profiles**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      if (method === 'GET') {
        if (url.includes('select=role')) {
          // Stats query
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
              { role: "admin" },
              { role: "talent" },
              { role: "partner" }
            ])
          });
        } else if (url.includes('order=created_at')) {
          // Users list query
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
              {
                id: "00000000-0000-0000-0000-000000000003",
                full_name: "Mock Administrator",
                email: "admin@edgetalent.com",
                role: "admin",
                skills: [],
                skill_gaps: [],
                created_at: new Date().toISOString()
              },
              {
                id: "00000000-0000-0000-0000-000000000001",
                full_name: "Alex Developer",
                email: "talent.test@edgetalent.com",
                role: "talent",
                skills: ["React"],
                skill_gaps: ["pgvector"],
                created_at: new Date().toISOString()
              }
            ])
          });
        } else {
          // Single profile query (for context/auth check)
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: "00000000-0000-0000-0000-000000000003",
              full_name: "Mock Administrator",
              email: "admin@edgetalent.com",
              role: "admin",
              created_at: new Date().toISOString()
            })
          });
        }
      } else {
        await route.continue();
      }
    });

    // Intercept quiz questions endpoint (since the dashboard fetches questions, and does CRUD)
    let mockQuestions = [
      {
        id: "00000000-0000-0000-0000-000000000010",
        category: "frontend",
        question: "Which hook is used for state in React?",
        options: ["useState", "useEffect", "useRef", "useMemo"],
        answer: "useState",
        created_at: new Date().toISOString()
      }
    ];

    await page.route('**/rest/v1/quiz_questions**', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockQuestions)
        });
      } else if (method === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        const newQ = {
          id: `00000000-0000-0000-0000-${Date.now().toString().slice(-12)}`,
          category: body.category,
          question: body.question,
          options: body.options,
          answer: body.answer,
          created_at: new Date().toISOString()
        };
        mockQuestions.push(newQ);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(newQ)
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      }
    });

    // Intercept courses endpoint
    let mockCourses = [
      {
        id: "00000000-0000-0000-0000-000000000020",
        title: "Introduction to AI",
        description: "Basic artificial intelligence concepts.",
        skills_taught: ["AI", "Python"],
        provider: "EdgeTalent Academy",
        link: "https://example.com",
        created_at: new Date().toISOString()
      }
    ];
    await page.route('**/rest/v1/courses**', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockCourses)
        });
      } else if (method === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        const newC = {
          id: `00000000-0000-0000-0000-${Date.now().toString().slice(-12)}`,
          title: body.title,
          description: body.description,
          skills_taught: body.skills_taught,
          provider: body.provider,
          link: body.link,
          created_at: new Date().toISOString()
        };
        mockCourses.push(newC);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(newC)
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      }
    });

    // Users list queries are now handled by the unified profiles router above

    // 1. Visit Landing Page and Navigate to Auth
    await page.goto('/');
    const getStartedBtn = page.locator('button#nav-btn-register');
    await getStartedBtn.click();

    // 2. Register a new user (who will have mock admin role via routing intercept)
    const toggleToSignUpBtn = page.locator('button', { hasText: 'Register' });
    await toggleToSignUpBtn.click();

    const fullNameInput = page.locator('input#fullName');
    const emailInput = page.locator('input#email');
    const passwordInput = page.locator('input#password');
    const submitBtn = page.locator('button[type="submit"]', { hasText: 'Sign Up' });

    const testEmail = `admin.${Date.now()}@edgetalent.com`;
    await fullNameInput.fill('Mock Administrator');
    await emailInput.fill(testEmail);
    await passwordInput.fill('supersecret123');
    await submitBtn.click();

    // 3. Verify redirected to Admin Dashboard and check welcome/stats
    const welcomeHeader = page.locator('h2', { hasText: 'Overview Management' });
    await expect(welcomeHeader).toBeVisible();

    const welcomeBody = page.locator('p', { hasText: 'As an administrator, you have complete read and write access' });
    await expect(welcomeBody).toBeVisible();

    // 4. Navigate to Users tab
    const usersTabBtn = page.locator('button', { hasText: 'Users List' });
    await usersTabBtn.click();
    const usersTitle = page.locator('h3', { hasText: 'Users Accounts Profiles' });
    await expect(usersTitle).toBeVisible();
    const developerRow = page.locator('td', { hasText: 'Alex Developer' });
    await expect(developerRow).toBeVisible();

    // 5. Navigate to Quizzes tab and add a quiz question
    const quizzesTabBtn = page.locator('button', { hasText: 'Quizzes' });
    await quizzesTabBtn.click();
    const quizzesTitle = page.locator('h3', { hasText: 'Assessment Quiz Questions' });
    await expect(quizzesTitle).toBeVisible();

    // Add quiz question
    const addQuestionBtn = page.locator('button', { hasText: 'Add Question' });
    await addQuestionBtn.click();

    await page.locator('textarea[placeholder*="handles state"]').fill('Which React hook is used to run side effects?');
    await page.locator('input[placeholder="Option A"]').fill('useEffect');
    await page.locator('input[placeholder="Option B"]').fill('useState');
    await page.locator('input[placeholder="Option C"]').fill('useContext');
    await page.locator('input[placeholder="Option D"]').fill('useReducer');
    await page.locator('select:has-text("-- Select Answer --")').selectOption('useEffect');

    await page.locator('button', { hasText: 'Create Question' }).click();

    // Verify question is added in frontend
    const newQuestion = page.locator('p', { hasText: 'Which React hook is used to run side effects?' });
    await expect(newQuestion).toBeVisible();

    // 6. Navigate to Courses tab and add a course
    const coursesTabBtn = page.locator('button', { hasText: 'Upskilling Hub' });
    await coursesTabBtn.click();
    const coursesTitle = page.locator('h3', { hasText: 'Upskilling Courses Catalog' });
    await expect(coursesTitle).toBeVisible();

    const addCourseBtn = page.locator('button', { hasText: 'Add Course' });
    await addCourseBtn.click();

    await page.locator('input[placeholder*="React & Node"]').fill('Tailwind CSS Mastery');
    await page.locator('textarea[placeholder*="Summarize course"]').fill('Learn utility-first styling patterns.');
    await page.locator('input[placeholder="React, TypeScript, Node.js"]').fill('TailwindCSS, CSS');
    await page.locator('input[placeholder*="Coursera"]').fill('Frontend Masters');
    await page.locator('input[placeholder*="example.com"]').fill('https://example.com/tailwind');

    await page.locator('button', { hasText: 'Create Course' }).click();

    // Verify course added
    const newCourse = page.locator('h4', { hasText: 'Tailwind CSS Mastery' });
    await expect(newCourse).toBeVisible();

    // 7. Logout
    const logoutBtn = page.locator('button', { hasText: 'Logout' });
    await logoutBtn.click();

    const welcomeBackHeader = page.locator('h2', { hasText: 'Welcome Back' });
    await expect(welcomeBackHeader).toBeVisible();
  });
});

