# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.ts >> EdgeTalent Complete E2E User Journeys >> Talent Journey: register, onboard, update profile, run AI analyzer, check courses, and apply for a project
- Location: test\e2e.spec.ts:178:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.user-profile-menu').filter({ hasText: 'Alex Developer' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.user-profile-menu').filter({ hasText: 'Alex Developer' })

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
  109 |             title: "EdgeTalent AI Matching Engine",
  110 |             description: "Build an end-to-end vector matching pipeline inside PostgreSQL using pgvector, typescript, and deno edge functions.",
  111 |             budget: 1500,
  112 |             scope: "medium-term",
  113 |             required_skills: ["TypeScript", "Supabase", "pgvector"],
  114 |             similarity: 0.95
  115 |           }
  116 |         ])
  117 |       });
  118 |     });
  119 | 
  120 |     // Mock applications database query (stateful)
  121 |     await page.route('**/rest/v1/applications**', async (route) => {
  122 |       const method = route.request().method();
  123 |       if (method === 'HEAD') {
  124 |         await route.fulfill({
  125 |           status: 200,
  126 |           headers: {
  127 |             'content-range': hasApplied ? '0-0/1' : '0-0/0'
  128 |           }
  129 |         });
  130 |       } else if (method === 'GET') {
  131 |         if (hasApplied) {
  132 |           await route.fulfill({
  133 |             status: 200,
  134 |             contentType: 'application/json',
  135 |             body: JSON.stringify([
  136 |               {
  137 |                 id: "00000000-0000-0000-0000-000000000005",
  138 |                 project_id: "00000000-0000-0000-0000-000000000003",
  139 |                 talent_id: "00000000-0000-0000-0000-000000000001",
  140 |                 status: "applied",
  141 |                 match_percentage: 95,
  142 |                 match_breakdown: { score_method: "pgvector cosine similarity" },
  143 |                 applied_at: new Date().toISOString(),
  144 |                 projects: {
  145 |                   id: "00000000-0000-0000-0000-000000000003",
  146 |                   title: "EdgeTalent AI Matching Engine",
  147 |                   description: "Build an end-to-end vector matching pipeline.",
  148 |                   required_skills: ["TypeScript", "Supabase", "pgvector"],
  149 |                   budget: 1500,
  150 |                   scope: "medium-term"
  151 |                 }
  152 |               }
  153 |             ])
  154 |           });
  155 |         } else {
  156 |           await route.fulfill({
  157 |             status: 200,
  158 |             contentType: 'application/json',
  159 |             body: JSON.stringify([])
  160 |           });
  161 |         }
  162 |       } else if (method === 'POST') {
  163 |         hasApplied = true;
  164 |         await route.fulfill({
  165 |           status: 200,
  166 |           contentType: 'application/json',
  167 |           body: JSON.stringify({ success: true })
  168 |         });
  169 |       } else {
  170 |         await route.continue();
  171 |       }
  172 |     });
  173 | 
  174 |     await page.goto('/');
  175 |     await page.evaluate(() => localStorage.removeItem('edgetalent_mock_db'));
  176 |   });
  177 | 
  178 |   test('Talent Journey: register, onboard, update profile, run AI analyzer, check courses, and apply for a project', async ({ page }) => {
  179 |     // 1. Visit Landing Page and Navigate to Auth
  180 |     await page.goto('/');
  181 |     await expect(page).toHaveTitle(/EdgeTalent/);
  182 |     const getStartedBtn = page.locator('button#nav-btn-register');
  183 |     await getStartedBtn.click();
  184 | 
  185 |     // 2. Register a new user
  186 |     const toggleToSignUpBtn = page.locator('button', { hasText: 'Register' });
  187 |     await toggleToSignUpBtn.click();
  188 | 
  189 |     const fullNameInput = page.locator('input#fullName');
  190 |     const emailInput = page.locator('input#email');
  191 |     const passwordInput = page.locator('input#password');
  192 |     const submitBtn = page.locator('button[type="submit"]', { hasText: 'Sign Up' });
  193 | 
  194 |     const testEmail = `talent.${Date.now()}@edgetalent.com`;
  195 |     await fullNameInput.fill('Alex Developer');
  196 |     await emailInput.fill(testEmail);
  197 |     await passwordInput.fill('supersecret123');
  198 |     await submitBtn.click();
  199 | 
  200 |     // 3. Complete Persona Onboarding
  201 |     const onboardingHeader = page.locator('h2', { hasText: 'Select Your Persona' });
  202 |     await expect(onboardingHeader).toBeVisible();
  203 | 
  204 |     const selectTalentBtn = page.locator('button', { hasText: 'Select Talent Profile' });
  205 |     await selectTalentBtn.click();
  206 | 
  207 |     // 4. Verify Dashboard Welcome message
  208 |     const welcomeHeader = page.locator('.user-profile-menu', { hasText: 'Alex Developer' });
> 209 |     await expect(welcomeHeader).toBeVisible();
      |                                 ^ Error: expect(locator).toBeVisible() failed
  210 | 
  211 |     // 5. Navigate to Profile Builder and update info
  212 |     const profileTabBtn = page.locator('button', { hasText: 'My Profile' });
  213 |     await profileTabBtn.click();
  214 | 
  215 |     const bioInput = page.locator('label:has-text("Biography Summary") + textarea');
  216 |     await bioInput.fill('Senior React engineer with a focus on high-performance SPAs.');
  217 |     const saveProfileBtn = page.locator('button', { hasText: 'Update Profile' });
  218 |     await saveProfileBtn.click();
  219 | 
  220 |     const successBadge = page.locator('.badge', { hasText: 'Profile updated successfully!' });
  221 |     await expect(successBadge).toBeVisible();
  222 | 
  223 |     // 6. Navigate to Skills & Interests Quiz Center
  224 |     const analyzerTabBtn = page.locator('button', { hasText: 'Skills & Interests' }).first();
  225 |     await analyzerTabBtn.click();
  226 | 
  227 |     // Start Frontend Quiz
  228 |     const startQuizBtn = page.locator('#btn-quiz-frontend-start');
  229 |     await expect(startQuizBtn).toBeVisible();
  230 |     await startQuizBtn.click();
  231 | 
  232 |     // Question 1
  233 |     await page.locator('.quiz-option-btn-0-0').click();
  234 |     await page.locator('#btn-quiz-next').click();
  235 | 
  236 |     // Question 2
  237 |     await page.locator('.quiz-option-btn-1-0').click();
  238 |     await page.locator('#btn-quiz-next').click();
  239 | 
  240 |     // Question 3
  241 |     await page.locator('.quiz-option-btn-2-0').click();
  242 |     await page.locator('#btn-quiz-next').click();
  243 | 
  244 |     // Question 4
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
```