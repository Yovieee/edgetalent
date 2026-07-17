# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.ts >> EdgeTalent Complete E2E User Journeys >> Talent Journey: register, onboard, update profile, run AI analyzer, check courses, and apply for a project
- Location: test\e2e.spec.ts:291:3

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
- button "Back to Home"
- heading "Create Account" [level=2]
- paragraph: Join the EdgeTalent ecosystem today
- text: Registration successful! Check your email or try logging in. Full Name
- textbox "Full Name":
  - /placeholder: John Doe
  - text: Alex Developer
- text: Email Address
- textbox "Email Address":
  - /placeholder: name@example.com
  - text: talent.1784315637006@edgetalent.com
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
  215 |                 match_percentage: 95,
  216 |                 match_breakdown: { score_method: "pgvector cosine similarity" },
  217 |                 applied_at: new Date().toISOString(),
  218 |                 projects: {
  219 |                   id: "00000000-0000-0000-0000-000000000003",
  220 |                   title: "Next-Gen Quantum Compiler",
  221 |                   description: "Build a compiler pipeline using web assembly, typescript, and vector optimization models.",
  222 |                   required_skills: ["WebAssembly", "TypeScript", "Quantum Computing"],
  223 |                   budget: 5000,
  224 |                   scope: "medium-term"
  225 |                 },
  226 |                 profiles: {
  227 |                   id: "00000000-0000-0000-0000-000000000001",
  228 |                   full_name: "Mock Talent Candidate",
  229 |                   email: "candidate@edgetalent.com",
  230 |                   avatar_url: "",
  231 |                   bio: "React & TypeScript expert with compiler experience.",
  232 |                   skills: ["TypeScript", "React", "WebAssembly"]
  233 |                 }
  234 |               }
  235 |             ])
  236 |           });
  237 |         } else if (hasApplied) {
  238 |           await route.fulfill({
  239 |             status: 200,
  240 |             contentType: 'application/json',
  241 |             body: JSON.stringify([
  242 |               {
  243 |                 id: "00000000-0000-0000-0000-000000000005",
  244 |                 project_id: "00000000-0000-0000-0000-000000000003",
  245 |                 talent_id: "00000000-0000-0000-0000-000000000001",
  246 |                 status: "applied",
  247 |                 match_percentage: 95,
  248 |                 match_breakdown: { score_method: "pgvector cosine similarity" },
  249 |                 applied_at: new Date().toISOString(),
  250 |                 projects: {
  251 |                   id: "00000000-0000-0000-0000-000000000003",
  252 |                   title: "EdgeTalent AI Matching Engine",
  253 |                   description: "Build an end-to-end vector matching pipeline.",
  254 |                   required_skills: ["TypeScript", "Supabase", "pgvector"],
  255 |                   budget: 1500,
  256 |                   scope: "medium-term"
  257 |                 }
  258 |               }
  259 |             ])
  260 |           });
  261 |         } else {
  262 |           await route.fulfill({
  263 |             status: 200,
  264 |             contentType: 'application/json',
  265 |             body: JSON.stringify([])
  266 |           });
  267 |         }
  268 |       } else if (method === 'POST') {
  269 |         hasApplied = true;
  270 |         await route.fulfill({
  271 |           status: 200,
  272 |           contentType: 'application/json',
  273 |           body: JSON.stringify({ success: true })
  274 |         });
  275 |       } else if (method === 'PATCH') {
  276 |         const postData = JSON.parse(route.request().postData() || '{}');
  277 |         await route.fulfill({
  278 |           status: 200,
  279 |           contentType: 'application/json',
  280 |           body: JSON.stringify({ success: true, ...postData })
  281 |         });
  282 |       } else {
  283 |         await route.continue();
  284 |       }
  285 |     });
  286 | 
  287 |     await page.goto('/');
  288 |     await page.evaluate(() => localStorage.removeItem('edgetalent_mock_db'));
  289 |   });
  290 | 
  291 |   test('Talent Journey: register, onboard, update profile, run AI analyzer, check courses, and apply for a project', async ({ page }) => {
  292 |     // 1. Visit Landing Page and Navigate to Auth
  293 |     await page.goto('/');
  294 |     await expect(page).toHaveTitle(/EdgeTalent/);
  295 |     const getStartedBtn = page.locator('button#nav-btn-register');
  296 |     await getStartedBtn.click();
  297 | 
  298 |     // 2. Register a new user
  299 |     const toggleToSignUpBtn = page.locator('button', { hasText: 'Register' });
  300 |     await toggleToSignUpBtn.click();
  301 | 
  302 |     const fullNameInput = page.locator('input#fullName');
  303 |     const emailInput = page.locator('input#email');
  304 |     const passwordInput = page.locator('input#password');
  305 |     const submitBtn = page.locator('button[type="submit"]', { hasText: 'Sign Up' });
  306 | 
  307 |     const testEmail = `talent.${Date.now()}@edgetalent.com`;
  308 |     await fullNameInput.fill('Alex Developer');
  309 |     await emailInput.fill(testEmail);
  310 |     await passwordInput.fill('supersecret123');
  311 |     await submitBtn.click();
  312 | 
  313 |     // 3. Complete Persona Onboarding
  314 |     const onboardingHeader = page.locator('h2', { hasText: 'Select Your Persona' });
> 315 |     await expect(onboardingHeader).toBeVisible();
      |                                    ^ Error: expect(locator).toBeVisible() failed
  316 | 
  317 |     const selectTalentBtn = page.locator('button', { hasText: 'Select Talent Profile' });
  318 |     await selectTalentBtn.click();
  319 | 
  320 |     // 4. Verify Dashboard Welcome message
  321 |     const welcomeHeader = page.locator('.user-profile-menu', { hasText: 'Alex Developer' });
  322 |     await expect(welcomeHeader).toBeVisible({ timeout: 15000 });
  323 | 
  324 |     // 5. Navigate to Profile Builder and update info
  325 |     const profileTabBtn = page.locator('button', { hasText: 'My Profile' });
  326 |     await profileTabBtn.click();
  327 | 
  328 |     const bioInput = page.locator('label:has-text("Biography Summary") + textarea');
  329 |     await bioInput.fill('Senior React engineer with a focus on high-performance SPAs.');
  330 |     const saveProfileBtn = page.locator('button', { hasText: 'Update Profile' });
  331 |     await saveProfileBtn.click();
  332 | 
  333 |     const successBadge = page.locator('.badge', { hasText: 'Profile updated successfully!' });
  334 |     await expect(successBadge).toBeVisible();
  335 | 
  336 |     // 6. Navigate to Skills & Interests Quiz Center
  337 |     const analyzerTabBtn = page.locator('button', { hasText: 'Skills & Interests' }).first();
  338 |     await analyzerTabBtn.click();
  339 | 
  340 |     // Start Frontend Quiz
  341 |     const startQuizBtn = page.locator('#btn-quiz-frontend-start');
  342 |     await expect(startQuizBtn).toBeVisible();
  343 |     await startQuizBtn.click();
  344 | 
  345 |     // Question 1
  346 |     await page.locator('.quiz-option-btn-0-0').click();
  347 |     await page.locator('#btn-quiz-next').click();
  348 | 
  349 |     // Question 2
  350 |     await page.locator('.quiz-option-btn-1-0').click();
  351 |     await page.locator('#btn-quiz-next').click();
  352 | 
  353 |     // Question 3
  354 |     await page.locator('.quiz-option-btn-2-0').click();
  355 |     await page.locator('#btn-quiz-next').click();
  356 | 
  357 |     // Question 4
  358 |     await page.locator('.quiz-option-btn-3-0').click();
  359 |     await page.locator('#btn-quiz-next').click();
  360 | 
  361 |     // Question 5
  362 |     await page.locator('.quiz-option-btn-4-0').click();
  363 |     await page.locator('#btn-quiz-finish').click();
  364 | 
  365 |     // Configure Preferences
  366 |     const interestsBtn = page.locator('#btn-quiz-interests-start');
  367 |     await expect(interestsBtn).toBeVisible();
  368 |     await interestsBtn.click();
  369 |     await page.locator('#select-interest-role').selectOption('Fullstack Developer');
  370 |     await page.locator('#select-interest-arrangement').selectOption('Remote');
  371 |     await page.locator('#select-interest-experience').selectOption('Senior');
  372 |     await page.locator('#input-interest-goals').fill('Learn advanced backend and deployment strategies.');
  373 |     await page.locator('#btn-save-interests').click();
  374 | 
  375 |     // Submit Quiz & Interests
  376 |     const submitQuizBtn = page.locator('#btn-submit-quiz-interests');
  377 |     await expect(submitQuizBtn).toBeVisible();
  378 |     await submitQuizBtn.click();
  379 | 
  380 |     // Verify assessment results render
  381 |     const resultsHeader = page.locator('h3', { hasText: 'Assessment Results' });
  382 |     await expect(resultsHeader).toBeVisible();
  383 |     const verifiedSkillBadge = page.locator('.badge-emerald', { hasText: 'React' }).first();
  384 |     await expect(verifiedSkillBadge).toBeVisible();
  385 |     const gapBadge = page.locator('.badge-rose', { hasText: 'pgvector' }).first();
  386 |     await expect(gapBadge).toBeVisible();
  387 | 
  388 |     // 7. Check Upskilling Hub (should list recommended courses based on gaps)
  389 |     const upskillingTabBtn = page.locator('button', { hasText: 'Upskilling' });
  390 |     await upskillingTabBtn.click();
  391 |     const coursesTitle = page.locator('h3', { hasText: 'Recommended Upskilling Paths' });
  392 |     await expect(coursesTitle).toBeVisible();
  393 |     const courseCard = page.locator('h4', { hasText: 'PostgreSQL & pgvector Deep Dive' });
  394 |     await expect(courseCard).toBeVisible();
  395 | 
  396 |     // 8. Go to Marketplace and apply for a project
  397 |     const marketplaceTabBtn = page.locator('button', { hasText: 'Marketplace' });
  398 |     await marketplaceTabBtn.click();
  399 | 
  400 |     const applyBtn = page.locator('button', { hasText: 'Apply' }).first();
  401 |     await expect(applyBtn).toBeVisible();
  402 |     await applyBtn.click();
  403 | 
  404 |     // Verify button state changes to "Applied"
  405 |     const appliedBtn = page.locator('button', { hasText: 'Applied' }).first();
  406 |     await expect(appliedBtn).toBeVisible();
  407 | 
  408 |     // 9. Go back to Overview and verify applications count and list
  409 |     const overviewTabBtn = page.locator('button', { hasText: 'Overview' });
  410 |     await overviewTabBtn.click();
  411 | 
  412 |     const activeAppBadge = page.locator('p', { hasText: '1 Active' });
  413 |     await expect(activeAppBadge).toBeVisible();
  414 |     const appItem = page.locator('h4', { hasText: 'EdgeTalent AI Matching Engine' });
  415 |     await expect(appItem).toBeVisible();
```