import { test, expect } from "@playwright/test";

const waitForVisualisation = async (
  page: import("@playwright/test").Page,
  objectId: string
) => {
  await expect(page.getByTestId(`mock-viz-${objectId}`)).toBeVisible();
};

test.describe("Qlik Sense connection (mocked)", () => {
  test("auto-connect updates status and renders dashboard visuals", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByText("Connected to Qlik Sense")).toBeVisible();

    await waitForVisualisation(page, "JRNGq");
    await waitForVisualisation(page, "JRVHPjJ");
  });
});
