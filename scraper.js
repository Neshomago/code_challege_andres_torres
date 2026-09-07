import * as cherrio from "cheerio";
import { request } from "./fetcher.js";

const entryList = [];

export const $ = (response) => cherrio.load(response);

export const webScraper = (url) => {
    request(url).then((response) =>{
        const page = $(response?.data)
        page('.titleline').each((_, el) => {
            entryList.push({
                title: $(el).text()
            })
        });


        console.log(entryList);
    });
}
