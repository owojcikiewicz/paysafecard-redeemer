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
    logged: boolean;

    get LOGIN_PAGE() {
        return "https://my.paysafecard.com";
    };

    set LOGGED_IN(status: boolean) {
        this.logged = status
    };

    get LOGGED_IN() {
        return this.logged;
    };

    constructor(browser: puppeteer.browser, credentials: Credentials, page: puppeteer.page) {
        this.browser = browser;
        this.credentials = credentials;
        this.page = page;
        this.logged = false;

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
            await page.goto("https://www.google.com");
            await page.waitForTimeout(1000);
        };
    };

    async redeemCode(code: string): Promise<any>{
        return new Promise(async (reject, resolve) => {
            if (this.LOGGED_IN == false) {
                reject("PSC Client not logged in.");
            };

            if (code.length != 16) {
                reject("Invalid code.");
            };

            let page = await this.getPage();
            let topupField = await page.waitForSelector("#popup:pin");
            let topupButton = await page.waitForSelector("#topup:login");

            await topupField.type(code);
            await topupButton.click();
        });
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

            await usernameField.click({clickCount: 3});
            await usernameField.press("Backspace");
            await usernameField.type(this.credentials.username);
            await passwordField.type(this.credentials.password);
            await loginButton.click();

            await page.waitForTimeout(1000);
            this.LOGGED_IN = true;
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