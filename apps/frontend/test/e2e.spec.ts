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
});
