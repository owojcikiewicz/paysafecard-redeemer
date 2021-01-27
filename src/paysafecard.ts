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
        return "https://login.paysafecard.com/customer-auth/?client_id=mypinsPR&theme=mypins&locale=pl_PL&redirect_uri=https%3A%2F%2Fmy.paysafecard.com%2Fmypins-psc%2FtokenExchange.xhtml";
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
        let url = "https://login.paysafecard.com/customer-auth/?client_id=mypinsPR&theme=mypins&locale=pl_PL&redirect_uri=https%3A%2F%2Fmy.paysafecard.com%2Fmypins-psc%2FtokenExchange.xhtml";
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

            let cookies = await page.cookies();
            await fs.writeFile("./cookies.json", JSON.stringify(cookies, null, 2));

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
        let browser = await puppeteer.launch(options ? options : {headless: false});
        let page = await browser.pages().then(pages => pages[0]);

        if (browser) { // await fs.readFile("./cookies.json")
            let cookieString = await (await fs.readFile("./cookies.json")).toString();
            let cookies = await JSON.parse(cookieString);
            await page.setCookie(...cookies);
        } else {
            console.log("[PSC] Cookies not detected, attempting manual login.");
            await this.manualLogin(browser, credentials);
        };

        return new this(browser, credentials, page);
    };
};

export {PSC};