import { test, expect } from '@playwright/test';

// Helper to mock Supabase Auth session in both Cookies and LocalStorage
async function mockSupabaseSession(page: any, userId: string, email: string, name?: string) {
  const sessionData = {
    access_token: 'mock-token',
    refresh_token: 'mock-refresh',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: {
      id: userId,
      email: email,
      role: 'authenticated',
      aud: 'authenticated',
      user_metadata: name ? { full_name: name } : {}
    }
  };

  // Set Cookie for @supabase/ssr
  await page.context().addCookies([{
    name: 'sb-vwqwfurtukewvvzbogwi-auth-token',
    value: encodeURIComponent(JSON.stringify(sessionData)),
    domain: 'localhost',
    path: '/'
  }]);

  // Set LocalStorage for backup / client-side auth state
  await page.addInitScript((session) => {
    window.localStorage.setItem('sb-vwqwfurtukewvvzbogwi-auth-token', JSON.stringify(session));
  }, sessionData);
}

test.describe('E2E Matchmaking & Routing Flow', () => {

  test.beforeEach(async ({ page }) => {
    // Listen to browser console and page errors for debugging
    page.on('console', msg => console.log(`BROWSER LOG [${msg.type()}]:`, msg.text()));
    page.on('pageerror', err => console.log('BROWSER EXCEPTION:', err.message));

    // Intercept Supabase auth calls globally to return an authenticated user session
    await page.route('**/auth/v1/user*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-user-789',
          email: 'adopter@example.com',
          role: 'authenticated',
          aud: 'authenticated',
          user_metadata: { full_name: 'Andra Ciuli' }
        })
      });
    });

    // Catch-all mock for favorites to prevent real network calls
    await page.route('**/rest/v1/favorites*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
  });
  
  test('should complete the matchmaking quiz and show suggestions', async ({ page }) => {
    // Mock animal database retrieval
    await page.route('**/rest/v1/animals*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'test-animal-123',
            name: 'Rex',
            species: 'Dog',
            breed: 'German Shepherd',
            status: 'available',
            image_url: [],
            shelters: {
              id: 'shelter-456',
              name: 'Happy Paws Shelter'
            }
          }
        ])
      });
    });

    // Mock local matchmaker API response
    await page.route('**/api/matchmaker', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          matches: [
            { id: 'test-animal-123', score: 95, reason: 'Great match for your home!' }
          ]
        })
      });
    });

    await page.goto('/matchmaker');

    // Step 1: Basics & Home
    await expect(page.locator('h2', { hasText: 'Basics & Home' })).toBeVisible();
    await page.locator('label:has(input[value="Dog"])').click();
    await page.locator('button', { hasText: 'Next Step' }).click();

    // Step 2: Lifestyle
    await expect(page.locator('h2', { hasText: 'Lifestyle' })).toBeVisible();
    await page.locator('button', { hasText: 'Next Step' }).click();

    // Step 3: Preferences
    await expect(page.locator('h2', { hasText: 'Preferences' })).toBeVisible();
    await page.locator('button', { hasText: 'Find My Match' }).click();
    
    // Results
    const resultsHeader = page.locator('h2', { hasText: 'Your Best Matches' });
    await expect(resultsHeader).toBeVisible({ timeout: 10000 });
  });

  test('should mock geolocation and render the ArcGIS map viewport', async ({ browser }) => {
    const context = await browser.newContext({
      permissions: ['geolocation'],
      geolocation: { latitude: 44.4268, longitude: 26.1025 },
      viewport: { width: 1280, height: 720 }
    });

    const page = await context.newPage();
    await page.goto('/map');

    const mapContainer = page.locator('.esri-view');
    await expect(mapContainer).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test('should complete the adoption request modal with custom questions and submit successfully', async ({ page }) => {
    // 1. Set Supabase session in Cookies and LocalStorage
    await mockSupabaseSession(page, 'test-user-789', 'adopter@example.com', 'Andra Ciuli');

    // 2. Intercept Supabase API queries
    // Mock the user profile check (user has complete profile)
    await page.route('**/rest/v1/users*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          first_name: 'Andra',
          last_name: 'Ciuli',
          phone: '0712345678',
          adoption_profile: {
            housing_type: 'Apartment',
            household_members: '2 adults',
            physical_activity: 'Moderate'
          }
        })
      });
    });

    // Mock the single animal fetch with custom questions
    await page.route('**/rest/v1/animals*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-animal-123',
          name: 'Rex',
          species: 'dog',
          breed: 'German Shepherd',
          age: 2,
          sex: 'masculin',
          status: 'available',
          description: 'Un caine prietenos si de paza.',
          characteristics: { vaccinated: true, sterilized: true, dewormed: true },
          extra_questions: ['Deții o curte îngrădită?', 'Câte ore va rămâne singur?'],
          image_url: [],
          shelter_id: 'shelter-456',
          shelters: {
            id: 'shelter-456',
            name: 'Happy Paws Shelter',
            address: 'Strada Sperantei nr 10',
            phone: '0722111222',
            email: 'contact@happypaws.com'
          }
        })
      });
    });

    // Mock prior request status query
    await page.route('**/rest/v1/adoption_requests*', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'req-999', status: 'pending' })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      }
    });

    // 3. Go to the animal's details page
    await page.goto('/animals/test-animal-123');

    // Verify animal page elements are loaded
    await expect(page.locator('h1')).toHaveText('Rex');
    
    // Click "Cere Adopție" button to open modal
    const adoptBtn = page.locator('button', { hasText: 'Cere Adopție' });
    await expect(adoptBtn).toBeVisible();
    await adoptBtn.click();

    // 4. Fill custom questions in the modal
    const firstQuestionInput = page.locator('input[type="text"]').first();
    await expect(firstQuestionInput).toBeVisible();
    await firstQuestionInput.fill('Da, curte de 200mp');

    const secondQuestionInput = page.locator('input[type="text"]').nth(1);
    await secondQuestionInput.fill('Maxim 4 ore pe zi');

    const messageTextarea = page.locator('textarea');
    await messageTextarea.fill('Suntem o familie iubitoare și vrem un prieten.');

    // 5. Submit and verify success toast notification
    const submitRequestBtn = page.locator('button', { hasText: 'Trimite Cererea' });
    await submitRequestBtn.click();

    // Check if the page shows the success toast notification
    const successMsg = page.locator('text=Cererea de adopție a fost trimisă cu succes!');
    await expect(successMsg).toBeVisible();
  });

  test('should login as shelter manager and schedule a visit from the dashboard', async ({ page }) => {
    // Override user global mock for this test to be a shelter admin
    await page.route('**/auth/v1/user*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'admin-user-789',
          email: 'admin@happypaws.com',
          role: 'authenticated',
          aud: 'authenticated'
        })
      });
    });

    // 1. Set Supabase session for admin
    await mockSupabaseSession(page, 'admin-user-789', 'admin@happypaws.com');

    // 2. Intercept auth queries to return admin role and shelter association
    await page.route('**/rest/v1/users*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          role: 'shelter_admin'
        })
      });
    });

    await page.route('**/rest/v1/shelters*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'shelter-456'
        })
      });
    });

    // Mock fetching adoption requests list in dashboard
    await page.route('**/rest/v1/adoption_requests*', async route => {
      if (route.request().method() === 'POST' || route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'req-111',
              created_at: new Date().toISOString(),
              status: 'pending',
              message: 'Vreau să îl adopt pe Rex!',
              extra_answers: {
                'Deții o curte îngrădită?': 'Da, curte mare',
                'Câte ore va rămâne singur?': 'Maxim 2 ore'
              },
              animals: {
                id: 'test-animal-123',
                name: 'Rex',
                species: 'dog',
                breed: 'German Shepherd',
                shelter_id: 'shelter-456'
              },
              users: {
                email: 'adoptator@example.com',
                first_name: 'Andra',
                last_name: 'Ciuli',
                phone: '0712345678',
                adoption_profile: {
                  housing_type: 'Apartment',
                  household_members: '2 adults',
                  physical_activity: 'Moderate'
                }
              }
            }
          ])
        });
      }
    });

    // Mock animals status update call
    await page.route('**/rest/v1/animals*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    // 3. Go to the dashboard
    await page.goto('/dashboard');

    // Click on the appointments / requests sidebar tab
    const requestsTab = page.locator('button', { hasText: 'Appointments' });
    await expect(requestsTab).toBeVisible();
    await requestsTab.click();

    // Verify mock request card is listed
    const applicantName = page.locator('h4', { hasText: 'Andra Ciuli' });
    await expect(applicantName).toBeVisible();

    // Click request card to expand details
    await applicantName.click();

    // Check custom answers and details are shown in the DOM
    await expect(page.locator('p', { hasText: 'Da, curte mare' })).toBeVisible();

    // Click "Approve & Schedule"
    const scheduleBtn = page.locator('button', { hasText: 'Approve & Schedule' });
    await expect(scheduleBtn).toBeVisible();
    await scheduleBtn.click();

    // 4. Fill schedule visit modal
    const dateInput = page.locator('input[type="datetime-local"]');
    await expect(dateInput).toBeVisible();
    
    // Choose a date 3 days in the future at 10:00 AM
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    futureDate.setHours(10, 0, 0, 0);
    const dateValueString = futureDate.toISOString().slice(0, 16);
    
    await dateInput.fill(dateValueString);

    const modalTextarea = page.locator('textarea');
    await modalTextarea.fill('Te așteptăm cu drag în vizită!');

    // Click Confirm
    const confirmBtn = page.locator('button', { hasText: 'Confirm & Approve' });
    await confirmBtn.click();

    // Verify modal closes
    await expect(page.locator('.modal')).not.toBeVisible();
  });
});
