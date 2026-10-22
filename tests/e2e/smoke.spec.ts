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
