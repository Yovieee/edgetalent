# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.ts >> EdgeTalent Complete E2E User Journeys >> Partner Journey: register, onboard, post project and check AI candidate matches
- Location: test\e2e.spec.ts:318:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.user-profile-menu').filter({ hasText: 'Google DeepMind Partner' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.user-profile-menu').filter({ hasText: 'Google DeepMind Partner' })

```

```yaml
- heading "Select Your Persona" [level=2]
- paragraph: Choose how you will engage with the EdgeTalent ecosystem. This determines your dashboard interface.
- text: Individual Growth
- heading "I am a Talent" [level=3]
- paragraph: Looking to level up my tech skills, analyze my coding gaps, explore learning paths, and match into commercial industrial projects.
- button "Select Talent Profile"
- text: Enterprise Execution
- heading "I am a Partner / Company" [level=3]
- paragraph: Looking to outsource industrial project deliverables, post job descriptions, and leverage AI vector similarity to source elite talent.
- button "Select Partner Profile"
```

# Test source

```ts
  245 |     await page.locator('.quiz-option-btn-3-0').click();
  246 |     await page.locator('#btn-quiz-next').click();
  247 | 
  248 |     // Question 5
  249 |     await page.locator('.quiz-option-btn-4-0').click();
  250 |     await page.locator('#btn-quiz-finish').click();
  251 | 
  252 |     // Configure Preferences
  253 |     const interestsBtn = page.locator('#btn-quiz-interests-start');
  254 |     await expect(interestsBtn).toBeVisible();
  255 |     await interestsBtn.click();
  256 |     await page.locator('#select-interest-role').selectOption('Fullstack Developer');
  257 |     await page.locator('#select-interest-arrangement').selectOption('Remote');
  258 |     await page.locator('#select-interest-experience').selectOption('Senior');
  259 |     await page.locator('#input-interest-goals').fill('Learn advanced backend and deployment strategies.');
  260 |     await page.locator('#btn-save-interests').click();
  261 | 
  262 |     // Submit Quiz & Interests
  263 |     const submitQuizBtn = page.locator('#btn-submit-quiz-interests');
  264 |     await expect(submitQuizBtn).toBeVisible();
  265 |     await submitQuizBtn.click();
  266 | 
  267 |     // Verify assessment results render
  268 |     const resultsHeader = page.locator('h3', { hasText: 'Assessment Results' });
  269 |     await expect(resultsHeader).toBeVisible();
  270 |     const verifiedSkillBadge = page.locator('.badge-emerald', { hasText: 'React' }).first();
  271 |     await expect(verifiedSkillBadge).toBeVisible();
  272 |     const gapBadge = page.locator('.badge-rose', { hasText: 'pgvector' }).first();
  273 |     await expect(gapBadge).toBeVisible();
  274 | 
  275 |     // 7. Check Upskilling Hub (should list recommended courses based on gaps)
  276 |     const upskillingTabBtn = page.locator('button', { hasText: 'Upskilling' });
  277 |     await upskillingTabBtn.click();
  278 |     const coursesTitle = page.locator('h3', { hasText: 'Recommended Upskilling Paths' });
  279 |     await expect(coursesTitle).toBeVisible();
  280 |     const courseCard = page.locator('h4', { hasText: 'PostgreSQL & pgvector Deep Dive' });
  281 |     await expect(courseCard).toBeVisible();
  282 | 
  283 |     // 8. Go to Marketplace and apply for a project
  284 |     const marketplaceTabBtn = page.locator('button', { hasText: 'Marketplace' });
  285 |     await marketplaceTabBtn.click();
  286 | 
  287 |     const applyBtn = page.locator('button', { hasText: 'Apply' }).first();
  288 |     await expect(applyBtn).toBeVisible();
  289 |     await applyBtn.click();
  290 | 
  291 |     // Verify button state changes to "Applied"
  292 |     const appliedBtn = page.locator('button', { hasText: 'Applied' }).first();
  293 |     await expect(appliedBtn).toBeVisible();
  294 | 
  295 |     // 9. Go back to Overview and verify applications count and list
  296 |     const overviewTabBtn = page.locator('button', { hasText: 'Overview' });
  297 |     await overviewTabBtn.click();
  298 | 
  299 |     const activeAppBadge = page.locator('p', { hasText: '1 Active' });
  300 |     await expect(activeAppBadge).toBeVisible();
  301 |     const appItem = page.locator('h4', { hasText: 'EdgeTalent AI Matching Engine' });
  302 |     await expect(appItem).toBeVisible();
  303 | 
  304 |     // 10. Sign out and return home
  305 |     const signOutBtn = page.locator('button', { hasText: 'Sign Out' });
  306 |     await signOutBtn.click();
  307 | 
  308 |     const welcomeBackHeader = page.locator('h2', { hasText: 'Welcome Back' });
  309 |     await expect(welcomeBackHeader).toBeVisible();
  310 | 
  311 |     const backToHomeBtn = page.locator('button', { hasText: '← Back to Home' });
  312 |     await backToHomeBtn.click();
  313 | 
  314 |     const landingBadge = page.locator('.badge', { hasText: 'EdgeTalent Ecosystem' });
  315 |     await expect(landingBadge).toBeVisible();
  316 |   });
  317 | 
  318 |   test('Partner Journey: register, onboard, post project and check AI candidate matches', async ({ page }) => {
  319 |     // 1. Visit Landing Page and Navigate to Auth
  320 |     await page.goto('/');
  321 |     const getStartedBtn = page.locator('button#nav-btn-register');
  322 |     await getStartedBtn.click();
  323 | 
  324 |     // 2. Register a new partner user
  325 |     const toggleToSignUpBtn = page.locator('button', { hasText: 'Register' });
  326 |     await toggleToSignUpBtn.click();
  327 | 
  328 |     const fullNameInput = page.locator('input#fullName');
  329 |     const emailInput = page.locator('input#email');
  330 |     const passwordInput = page.locator('input#password');
  331 |     const submitBtn = page.locator('button[type="submit"]', { hasText: 'Sign Up' });
  332 | 
  333 |     const testEmail = `partner.${Date.now()}@edgetalent.com`;
  334 |     await fullNameInput.fill('Google DeepMind Partner');
  335 |     await emailInput.fill(testEmail);
  336 |     await passwordInput.fill('supersecret123');
  337 |     await submitBtn.click();
  338 | 
  339 |     // 3. Complete Persona Onboarding as Partner
  340 |     const selectPartnerBtn = page.locator('button', { hasText: 'Select Partner Profile' });
  341 |     await selectPartnerBtn.click();
  342 | 
  343 |     // 4. Verify Dashboard Header
  344 |     const welcomeHeader = page.locator('.user-profile-menu', { hasText: 'Google DeepMind Partner' });
> 345 |     await expect(welcomeHeader).toBeVisible();
      |                                 ^ Error: expect(locator).toBeVisible() failed
  346 | 
  347 |     // 5. Navigate to Project Manager Portal and post a new project
  348 |     const portalTabBtn = page.locator('button', { hasText: 'Post New Project' });
  349 |     await portalTabBtn.click();
  350 | 
  351 |     const projTitleInput = page.locator('label:has-text("Project Title") + input');
  352 |     const projDescInput = page.locator('label:has-text("Description & Scope") + textarea');
  353 |     const projSkillsInput = page.locator('label:has-text("Required Skills") + input');
  354 |     const projBudgetInput = page.locator('label:has-text("Budget") + input');
  355 |     const postProjBtn = page.locator('button[type="submit"]', { hasText: 'Post Project Scope' });
  356 | 
  357 |     await projTitleInput.fill('Next-Gen Quantum Compiler');
  358 |     await projDescInput.fill('Build a compiler pipeline using web assembly, typescript, and vector optimization models.');
  359 |     await projSkillsInput.fill('WebAssembly, TypeScript, Quantum Computing');
  360 |     await projBudgetInput.fill('5000');
  361 |     await postProjBtn.click();
  362 | 
  363 |     // Verify project posted successfully
  364 |     const successMsg = page.locator('.badge', { hasText: 'Project posted successfully with vector embeddings!' });
  365 |     await expect(successMsg).toBeVisible();
  366 | 
  367 |     // 6. Go to Partner Overview and verify the project shows up
  368 |     const overviewTabBtn = page.locator('button', { hasText: 'Projects Dashboard' });
  369 |     await overviewTabBtn.click();
  370 | 
  371 |     const postedProjectTitle = page.locator('h4', { hasText: 'Next-Gen Quantum Compiler' });
  372 |     await expect(postedProjectTitle).toBeVisible();
  373 | 
  374 |     // 7. Expand matches inline on the dashboard
  375 |     const findMatchesBtn = page.locator('button', { hasText: 'Find Talent Matches' }).first();
  376 |     await expect(findMatchesBtn).toBeVisible();
  377 |     await findMatchesBtn.click();
  378 | 
  379 |     // Verify candidate matches list is displayed
  380 |     const candidateName = page.locator('h6', { hasText: 'Mock AI Expert' });
  381 |     await expect(candidateName).toBeVisible();
  382 |     const contactBtn = page.locator('a', { hasText: 'Contact' });
  383 |     await expect(contactBtn).toBeVisible();
  384 |     await expect(contactBtn).toHaveAttribute('href', 'mailto:expert@edgetalent.com');
  385 | 
  386 |     // 8. Sign out and return home
  387 |     const signOutBtn = page.locator('button', { hasText: 'Sign Out' });
  388 |     await signOutBtn.click();
  389 | 
  390 |     const welcomeBackHeader = page.locator('h2', { hasText: 'Welcome Back' });
  391 |     await expect(welcomeBackHeader).toBeVisible();
  392 | 
  393 |     const backToHomeBtn = page.locator('button', { hasText: '← Back to Home' });
  394 |     await backToHomeBtn.click();
  395 | 
  396 |     const landingBadge = page.locator('.badge', { hasText: 'EdgeTalent Ecosystem' });
  397 |     await expect(landingBadge).toBeVisible();
  398 |   });
  399 | 
  400 |   test('Admin Journey: login/onboard as admin and manage quizzes, courses, jobs, and users', async ({ page }) => {
  401 |     // Intercept profile fetch to mock the admin role
  402 |     await page.route('**/rest/v1/profiles**', async (route) => {
  403 |       const url = route.request().url();
  404 |       const method = route.request().method();
  405 |       if (method === 'GET') {
  406 |         if (url.includes('select=role')) {
  407 |           // Stats query
  408 |           await route.fulfill({
  409 |             status: 200,
  410 |             contentType: 'application/json',
  411 |             body: JSON.stringify([
  412 |               { role: "admin" },
  413 |               { role: "talent" },
  414 |               { role: "partner" }
  415 |             ])
  416 |           });
  417 |         } else if (url.includes('order=created_at')) {
  418 |           // Users list query
  419 |           await route.fulfill({
  420 |             status: 200,
  421 |             contentType: 'application/json',
  422 |             body: JSON.stringify([
  423 |               {
  424 |                 id: "00000000-0000-0000-0000-000000000003",
  425 |                 full_name: "Mock Administrator",
  426 |                 email: "admin@edgetalent.com",
  427 |                 role: "admin",
  428 |                 skills: [],
  429 |                 skill_gaps: [],
  430 |                 created_at: new Date().toISOString()
  431 |               },
  432 |               {
  433 |                 id: "00000000-0000-0000-0000-000000000001",
  434 |                 full_name: "Alex Developer",
  435 |                 email: "talent.test@edgetalent.com",
  436 |                 role: "talent",
  437 |                 skills: ["React"],
  438 |                 skill_gaps: ["pgvector"],
  439 |                 created_at: new Date().toISOString()
  440 |               }
  441 |             ])
  442 |           });
  443 |         } else {
  444 |           // Single profile query (for context/auth check)
  445 |           await route.fulfill({
```