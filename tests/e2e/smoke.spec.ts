import { expect, test, type Page } from "@playwright/test";

// End to end: choose a commander, swipe, finish in the editor, export, then goldfish the deck.
// Needs network access, since card suggestions come from EDHREC and images from Scryfall.
test("build, export and goldfish a deck", async ({ page }) => {
  await page.goto("/build");
  await page.getByPlaceholder("Search commanders or creature types…").fill("krenko mob");
  await page.getByRole("button", { name: "Krenko, Mob Boss" }).click();
  await page.getByRole("button", { name: "Start swiping" }).click();

  await expect(page.getByText("cards picked")).toBeVisible({ timeout: 30_000 });
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(80);
  }
  await expect(page.getByTestId("picked-count")).toHaveText("20/99");

  await page.getByRole("button", { name: "Finish with basics & edit" }).click();
  await expect(page.getByText("Deck size is legal")).toBeVisible();

  await page.getByRole("button", { name: "Export" }).click();
  await expect(page.getByRole("dialog").locator("textarea")).toHaveValue(/^Commander\n1 Krenko, Mob Boss\n\nDeck\n/);
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Goldfish" }).click();
  await page.getByRole("button", { name: "Keep 7" }).click();
  const hand = page.locator("[data-zone=hand] [data-card-name]");
  await expect(hand).toHaveCount(7);
  await page.keyboard.press("d");
  await expect(hand).toHaveCount(8);
  await expect(page.getByTestId("turn")).toHaveText("1");
});

// Deck settings: set a budget before starting, then change the land count while swiping.
test("adjust deck settings before and while swiping", async ({ page }) => {
  await page.goto("/build");
  await page.getByPlaceholder("Search commanders or creature types…").fill("krenko mob");
  await page.getByRole("button", { name: "Krenko, Mob Boss" }).click();
  await page.getByRole("button", { name: "Advanced settings" }).click();
  const budget = page.getByRole("group", { name: "Budget per card" });
  await budget.getByRole("button", { name: "$5", exact: true }).click();
  await expect(budget.getByRole("button", { name: "$5", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Start swiping" }).click();

  await expect(page.getByText("cards picked")).toBeVisible({ timeout: 30_000 });
  const landsCounter = page.getByText(/^Lands 0\/\d+$/);
  const lands = Number((await landsCounter.textContent())!.split("/")[1]);

  await page.getByRole("button", { name: "Deck settings" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("group", { name: "Budget per card" }).getByRole("button", { name: "$5", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await dialog.getByRole("button", { name: "More lands" }).click();
  await expect(landsCounter).toHaveText(`Lands 0/${lands + 1}`);

  await dialog.getByRole("button", { name: "Reset to recommendation" }).click();
  await expect(landsCounter).toHaveText(`Lands 0/${lands}`);
  await page.keyboard.press("Escape");
  // Keys go to the dialog until its close animation ends, which a production build reaches faster than dev.
  await expect(dialog).toBeHidden();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("picked-count")).toHaveText("1/99");
});

/** The advanced track with answers that leave plenty of white-black vampire commanders. */
async function answerAdvancedQuiz(page: Page) {
  await page.goto("/quiz");
  await page.getByRole("button", { name: /I know my way around/ }).click();
  await expect(page.getByTestId("quiz-progress")).toHaveText("1 / 7");

  await page.getByRole("button", { name: /Death by a thousand cuts/ }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: /The graveyard/ }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  // Single-choice questions advance on click.
  await page.getByRole("button", { name: /Punish everything/ }).click();
  await page.getByRole("button", { name: /Build an engine/ }).click();
  await page.getByRole("button", { name: /Some decisions/ }).click();
  await page.getByRole("button", { name: /White/ }).click();
  await page.getByRole("button", { name: /Black/ }).click();
  await page.getByRole("radio", { name: "Two" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByTestId("quiz-progress")).toHaveText("7 / 7");
  await page.getByRole("button", { name: /Vampires/ }).click();
  await page.getByRole("button", { name: "Show my commanders" }).click();
}

// Quiz: advanced track → commander swipe → shortlist → deckbuilding swipe.
test("find a commander with the quiz and start a deck", async ({ page }) => {
  await answerAdvancedQuiz(page);

  await expect(page.getByTestId("commander-count")).toHaveText("Commander 1 of 30", { timeout: 30_000 });
  await expect(page.getByTestId("fit-reasons").locator("li").first()).toBeVisible();
  for (const key of ["ArrowRight", "ArrowRight", "ArrowUp", "ArrowLeft"]) {
    await page.keyboard.press(key);
    await page.waitForTimeout(80);
  }
  await expect(page.getByTestId("commander-count")).toHaveText("Commander 5 of 30");
  await expect(page.getByTestId("shortlist-count")).toHaveText("3");

  await page.getByRole("button", { name: "Review shortlist" }).click();
  await expect(page.getByRole("heading", { name: "Your shortlist" })).toBeVisible();
  await page.getByRole("radio", { name: /Upgraded/ }).click();
  await page.getByRole("button", { name: "Start swiping" }).click();

  await expect(page).toHaveURL(/\/build\/[\w-]+$/);
  await expect(page.getByText("cards picked")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Bracket 3/)).toBeVisible();
});

// Sharing: a link carries the deck to a fresh browser, which can open it in goldfish.
test("share a deck by link and goldfish it elsewhere", async ({ page, browser }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: async (text: string) => void ((window as unknown as { copied: string }).copied = text) },
    });
  });
  await page.goto("/build");
  await page.getByPlaceholder("Search commanders or creature types…").fill("krenko mob");
  await page.getByRole("button", { name: "Krenko, Mob Boss" }).click();
  await page.getByRole("button", { name: "Start swiping" }).click();
  await expect(page.getByText("cards picked")).toBeVisible({ timeout: 30_000 });
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(80);
  }
  await page.getByRole("button", { name: "Finish with basics & edit" }).click();
  await page.getByRole("button", { name: "Share" }).click();
  await expect(page.getByText("Link copied")).toBeVisible();
  const link = await page.evaluate(() => (window as unknown as { copied: string }).copied);
  expect(link).toMatch(/\/d\/[\w-]+$/);

  const other = await browser.newPage();
  await other.goto(link);
  await expect(other.getByRole("heading", { name: "Krenko, Mob Boss" })).toBeVisible();
  await expect(other.getByText("100 cards")).toBeVisible();
  await other.getByRole("button", { name: "Goldfish this deck" }).click();
  await other.getByRole("button", { name: "Keep 7" }).click();
  await expect(other.locator("[data-zone=hand] [data-card-name]")).toHaveCount(7);
});

// Sharing a quiz result: the shortlist link opens the best match elsewhere, which can start that commander.
test("share a quiz shortlist and build its best match", async ({ page, browser }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: async (text: string) => void ((window as unknown as { copied: string }).copied = text) },
    });
  });
  await answerAdvancedQuiz(page);
  await expect(page.getByTestId("commander-count")).toBeVisible({ timeout: 30_000 });
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(80);
  await page.keyboard.press("ArrowRight");
  await page.getByRole("button", { name: "Review shortlist" }).click();
  const top = (await page.getByRole("heading", { level: 2 }).first().textContent())!;

  await page.getByRole("button", { name: "Share" }).click();
  await expect(page.getByText("Link copied")).toBeVisible();
  const link = await page.evaluate(() => (window as unknown as { copied: string }).copied);
  expect(link).toMatch(/\/q\/[\w-]+$/);

  const other = await browser.newPage();
  await other.goto(link);
  await expect(other.getByRole("heading", { level: 1, name: top })).toBeVisible();
  await expect(other.getByText(/\d+% match/).first()).toBeVisible();
  // The best match comes first; its "Build" button is a link styled as a button.
  await other.locator('a[href^="/build?commander="]').first().click();
  await expect(other.getByRole("heading", { level: 2, name: top })).toBeVisible({ timeout: 30_000 });
  await expect(other.getByRole("button", { name: "Start swiping" })).toBeEnabled({ timeout: 30_000 });
});
