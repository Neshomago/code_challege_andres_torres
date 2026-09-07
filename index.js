
import { webScraper } from "./src/services/scraper.js";

const entries = await webScraper("https://news.ycombinator.com/");

console.log('entries from scraper: ', entries);
