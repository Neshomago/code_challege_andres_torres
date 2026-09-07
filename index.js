
import { webScraper } from "./scraper.js";

const entries = await webScraper("https://news.ycombinator.com/");

console.log('entries from scraper: ', entries);
