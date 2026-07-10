# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.ts >> EdgeTalent Complete E2E User Journeys >> Talent Journey: register, onboard, update profile, run AI analyzer, check courses, and apply for a project
- Location: test\e2e.spec.ts:10:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h2').filter({ hasText: 'Select Your Persona' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('h2').filter({ hasText: 'Select Your Persona' })

```

```yaml
- button "← Back to Home"
- heading "Create Account" [level=2]
- paragraph: Join the EdgeTalent ecosystem today
- text: Failed to fetch Full Name
- textbox "Full Name":
  - /placeholder: John Doe
  - text: Alex Developer
- text: Email Address
- textbox "Email Address":
  - /placeholder: name@example.com
  - text: talent.1783680089573@edgetalent.com
- text: Password
- textbox "Password":
  - /placeholder: ••••••••
  - text: supersecret123
- button "Sign Up"
- text: Already have an account?
- button "Log In"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('EdgeTalent Complete E2E User Journeys', () => {
  4   |   // Clear localStorage before each test to ensure state is clean
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await page.goto('/');
  7   |     await page.evaluate(() => localStorage.removeItem('edgetalent_mock_db'));
  8   |   });
  9   | 
  10  |   test('Talent Journey: register, onboard, update profile, run AI analyzer, check courses, and apply for a project', async ({ page }) => {
  11  |     // 1. Visit Landing Page and Navigate to Auth
  12  |     await page.goto('/');
  13  |     await expect(page).toHaveTitle(/EdgeTalent/);
  14  |     const getStartedBtn = page.locator('button.btn-primary', { hasText: 'Get Started' });
  15  |     await getStartedBtn.click();
  16  | 
  17  |     // 2. Register a new user
  18  |     const toggleToSignUpBtn = page.locator('button', { hasText: 'Register' });
  19  |     await toggleToSignUpBtn.click();
  20  | 
  21  |     const fullNameInput = page.locator('input#fullName');
  22  |     const emailInput = page.locator('input#email');
  23  |     const passwordInput = page.locator('input#password');
  24  |     const submitBtn = page.locator('button[type="submit"]', { hasText: 'Sign Up' });
  25  | 
  26  |     const testEmail = `talent.${Date.now()}@edgetalent.com`;
  27  |     await fullNameInput.fill('Alex Developer');
  28  |     await emailInput.fill(testEmail);
  29  |     await passwordInput.fill('supersecret123');
  30  |     await submitBtn.click();
  31  | 
  32  |     // 3. Complete Persona Onboarding
  33  |     const onboardingHeader = page.locator('h2', { hasText: 'Select Your Persona' });
> 34  |     await expect(onboardingHeader).toBeVisible();
      |                                    ^ Error: expect(locator).toBeVisible() failed
  35  | 
  36  |     const selectTalentBtn = page.locator('button', { hasText: 'Select Talent Profile' });
  37  |     await selectTalentBtn.click();
  38  | 
  39  |     // 4. Verify Dashboard Welcome message
  40  |     const welcomeHeader = page.locator('.user-profile-menu', { hasText: 'Alex Developer' });
  41  |     await expect(welcomeHeader).toBeVisible();
  42  | 
  43  |     // 5. Navigate to Profile Builder and update info
  44  |     const profileTabBtn = page.locator('button', { hasText: 'My Profile' });
  45  |     await profileTabBtn.click();
  46  | 
  47  |     const bioInput = page.locator('label:has-text("Biography Summary") + textarea');
  48  |     await bioInput.fill('Senior React engineer with a focus on high-performance SPAs.');
  49  |     const saveProfileBtn = page.locator('button', { hasText: 'Update Profile' });
  50  |     await saveProfileBtn.click();
  51  | 
  52  |     const successBadge = page.locator('.badge', { hasText: 'Profile updated successfully!' });
  53  |     await expect(successBadge).toBeVisible();
  54  | 
  55  |     // 6. Navigate to AI Skill-Gap Analyzer
  56  |     const analyzerTabBtn = page.locator('button', { hasText: 'AI Skill-Gap' });
  57  |     await analyzerTabBtn.click();
  58  | 
  59  |     const cvInput = page.locator('label:has-text("CV / Resume Text") + textarea');
  60  |     await cvInput.fill('Experience building apps with React, TypeScript, and standard HTML/CSS. Looking for opportunities.');
  61  |     const startAnalysisBtn = page.locator('button', { hasText: 'Start Analysis' });
  62  |     await startAnalysisBtn.click();
  63  | 
  64  |     // Verify AI analysis results render
  65  |     const resultsHeader = page.locator('h3', { hasText: 'Analyzer Results' });
  66  |     await expect(resultsHeader).toBeVisible();
  67  |     const verifiedSkillBadge = page.locator('.badge-emerald', { hasText: 'React' });
  68  |     await expect(verifiedSkillBadge).toBeVisible();
  69  |     const gapBadge = page.locator('.badge-rose', { hasText: 'pgvector' });
  70  |     await expect(gapBadge).toBeVisible();
  71  | 
  72  |     // 7. Check Upskilling Hub (should list recommended courses based on gaps)
  73  |     const upskillingTabBtn = page.locator('button', { hasText: 'Upskilling' });
  74  |     await upskillingTabBtn.click();
  75  |     const coursesTitle = page.locator('h3', { hasText: 'Recommended Upskilling Paths' });
  76  |     await expect(coursesTitle).toBeVisible();
  77  |     const courseCard = page.locator('h4', { hasText: 'PostgreSQL & pgvector Deep Dive' });
  78  |     await expect(courseCard).toBeVisible();
  79  | 
  80  |     // 8. Go to Marketplace and apply for a project
  81  |     const marketplaceTabBtn = page.locator('button', { hasText: 'Marketplace' });
  82  |     await marketplaceTabBtn.click();
  83  | 
  84  |     const applyBtn = page.locator('button', { hasText: 'Apply' }).first();
  85  |     await expect(applyBtn).toBeVisible();
  86  |     await applyBtn.click();
  87  | 
  88  |     // Verify button state changes to "Applied"
  89  |     const appliedBtn = page.locator('button', { hasText: 'Applied' }).first();
  90  |     await expect(appliedBtn).toBeVisible();
  91  | 
  92  |     // 9. Go back to Overview and verify applications count and list
  93  |     const overviewTabBtn = page.locator('button', { hasText: 'Overview' });
  94  |     await overviewTabBtn.click();
  95  | 
  96  |     const activeAppBadge = page.locator('p', { hasText: '1 Active' });
  97  |     await expect(activeAppBadge).toBeVisible();
  98  |     const appItem = page.locator('h4', { hasText: 'EdgeTalent AI Matching Engine' });
  99  |     await expect(appItem).toBeVisible();
  100 | 
  101 |     // 10. Sign out and return home
  102 |     const signOutBtn = page.locator('button', { hasText: 'Sign Out' });
  103 |     await signOutBtn.click();
  104 | 
  105 |     const welcomeBackHeader = page.locator('h2', { hasText: 'Welcome Back' });
  106 |     await expect(welcomeBackHeader).toBeVisible();
  107 | 
  108 |     const backToHomeBtn = page.locator('button', { hasText: '← Back to Home' });
  109 |     await backToHomeBtn.click();
  110 | 
  111 |     const landingBadge = page.locator('.badge', { hasText: 'EdgeTalent Ecosystem' });
  112 |     await expect(landingBadge).toBeVisible();
  113 |   });
  114 | 
  115 |   test('Partner Journey: register, onboard, post project and check AI candidate matches', async ({ page }) => {
  116 |     // 1. Visit Landing Page and Navigate to Auth
  117 |     await page.goto('/');
  118 |     const getStartedBtn = page.locator('button.btn-primary', { hasText: 'Get Started' });
  119 |     await getStartedBtn.click();
  120 | 
  121 |     // 2. Register a new partner user
  122 |     const toggleToSignUpBtn = page.locator('button', { hasText: 'Register' });
  123 |     await toggleToSignUpBtn.click();
  124 | 
  125 |     const fullNameInput = page.locator('input#fullName');
  126 |     const emailInput = page.locator('input#email');
  127 |     const passwordInput = page.locator('input#password');
  128 |     const submitBtn = page.locator('button[type="submit"]', { hasText: 'Sign Up' });
  129 | 
  130 |     const testEmail = `partner.${Date.now()}@edgetalent.com`;
  131 |     await fullNameInput.fill('Google DeepMind Partner');
  132 |     await emailInput.fill(testEmail);
  133 |     await passwordInput.fill('supersecret123');
  134 |     await submitBtn.click();
```