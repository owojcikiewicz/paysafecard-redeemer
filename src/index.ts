import dotenv from "dotenv"; dotenv.config();
import {PSC} from "./paysafecard";

(async() => {
    let client = await PSC.init({username: "oskanio1231", password: "!zaPxE9S955ziK&!Dt&A!qEzNsy$"}, {headless: false});
    await client.login();
})();