import puppeteer from "puppeteer";

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

        return new this(browser, credentials, page);
    };
};

export {PSC};