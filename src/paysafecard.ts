import puppeteer from "puppeteer";
import {promises as fs} from "fs";

interface Credentials {
    username: string;
    password: string;
};

class PSC {
    browser: puppeteer.browser;
    page: puppeteer.page;
    credentials: Credentials;

    get LOGIN_PAGE() {
        return "https://my.paysafecard.com";
    };

    constructor(browser: puppeteer.browser, credentials: Credentials, page: puppeteer.page) {
        this.browser = browser;
        this.credentials = credentials;
        this.page = page;

        console.log("[PSC] Successfully initialized client.");
    };

    async getPage(): Promise<puppeteer.page> {
        return await this.browser.pages().then(pages => pages[0]);
    };

    async close(): Promise<void> {
        console.log("[PSC] Closing browser.");
        await this.browser.close();
    };
    
    static async manualLogin(browser: puppeteer.browser, credentials: Credentials): Promise<void> {
        let url = "https://my.paysafecard.com";
        let page = await browser.pages().then(pages => pages[0]);

        await page.goto(url);
        await page.waitForTimeout(1000);

        if (credentials) {
            let usernameField = await page.waitForSelector("#username");
            let passwordField = await page.waitForSelector("#password");
            let loginButton = await page.waitForSelector("#loginButton");

            await usernameField.type(credentials.username);
            await passwordField.type(credentials.password);
            await loginButton.click();
            await page.waitForTimeout(2000);
            
            let smsButton = await page.waitForSelector("#setupFallbackButton");
            await smsButton.click();
            await page.waitForTimeout(2000);
            
            let confirmButton = await page.waitForSelector("#smsConfirmButton");
            await page.waitForTimeout(15000);
            await confirmButton.click();

            await fs.writeFile("./status.txt", "1")
            await browser.close();
        };
    };

    async login() {
        let url = this.LOGIN_PAGE;
        let page = await this.getPage();

        await page.goto(url);
        await page.waitForTimeout(1000);

        if (this.credentials) {
            let usernameField = await page.waitForSelector("#username");
            let passwordField = await page.waitForSelector("#password");
            let loginButton = await page.waitForSelector("#loginButton");

            await usernameField.type(this.credentials.username);
            await passwordField.type(this.credentials.password);
            await loginButton.click();
        };
    };

    static async init(credentials: Credentials, options?: {}) {
        let browser = await puppeteer.launch(options ? options : {headless: true, userDataDir: "./user_data"});
        let page = await browser.pages().then(pages => pages[0]);

        try {
            await fs.readFile("./status.txt");
            console.log("[PSC] User data detected, proceeding.");
            return new this(browser, credentials, page);
        } catch(ex) {
            console.log("[PSC] Cookies not detected, attempting manual login.");
            await this.manualLogin(browser, credentials);
        };
    };
};

export {PSC};