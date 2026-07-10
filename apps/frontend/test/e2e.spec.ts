import { test, expect } from '@playwright/test';

test.describe('EdgeTalent Complete E2E User Journeys', () => {
  // Clear localStorage before each test to ensure state is clean
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('edgetalent_mock_db'));
  });

  test('Talent Journey: register, onboard, update profile, run AI analyzer, check courses, and apply for a project', async ({ page }) => {
    // 1. Visit Landing Page and Navigate to Auth
    await page.goto('/');
    await expect(page).toHaveTitle(/EdgeTalent/);
    const getStartedBtn = page.locator('button.btn-primary', { hasText: 'Get Started' });
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

    // 6. Navigate to AI Skill-Gap Analyzer
    const analyzerTabBtn = page.locator('button', { hasText: 'AI Skill-Gap' });
    await analyzerTabBtn.click();

    const cvInput = page.locator('label:has-text("CV / Resume Text") + textarea');
    await cvInput.fill('Experience building apps with React, TypeScript, and standard HTML/CSS. Looking for opportunities.');
    const startAnalysisBtn = page.locator('button', { hasText: 'Start Analysis' });
    await startAnalysisBtn.click();

    // Verify AI analysis results render
    const resultsHeader = page.locator('h3', { hasText: 'Analyzer Results' });
    await expect(resultsHeader).toBeVisible();
    const verifiedSkillBadge = page.locator('.badge-emerald', { hasText: 'React' });
    await expect(verifiedSkillBadge).toBeVisible();
    const gapBadge = page.locator('.badge-rose', { hasText: 'pgvector' });
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
    const getStartedBtn = page.locator('button.btn-primary', { hasText: 'Get Started' });
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
