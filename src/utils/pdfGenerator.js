import puppeteer from "puppeteer";

export const generatePDF = async (html) => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });
        const pdf = await page.pdf({
            format: "A4",
            margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
            printBackground: true,
        });
        return pdf;
    } finally {
        await browser.close();
    }
};
