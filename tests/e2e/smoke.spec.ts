import { expect, test } from "@playwright/test";

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

// Quiz: advanced track → commander swipe → shortlist → deckbuilding swipe.
test("find a commander with the quiz and start a deck", async ({ page }) => {
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
