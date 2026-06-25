import puppeteer from "puppeteer";

export const generatePDF = async (html) => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    try {
        const page = await browser.newPage();
        // A4 at 96dpi: 794 × 1123px
        await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
        await page.setContent(html, { waitUntil: "networkidle0" });
        const pdf = await page.pdf({
            format: "A4",
            margin: { top: "0", right: "0", bottom: "0", left: "0" },
            printBackground: true,
        });
        return pdf;
    } finally {
        await browser.close();
    }
};
