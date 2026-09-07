import * as cherrio from "cheerio";
import { request } from "./fetcher.js";


export const webScraper = async (url) => {
    const response = await request(url);
    const $ = cherrio.load(response.data);
    const entryList = [];

    $('.athing').each((_, el) => {
        const row = $(el);
        const subtext = row.next().find('.subtext');
        const title = row.find('.titleline').text();
        const points = subtext.find('.score').text();
        const comments = subtext.find('.subline > a')
            .filter((_, val) => /comment/.test($(val).text()))
            .text();
        
        entryList.push({
            number: _ + 1,
            title,
            points:  parseInt(points, 10) || 0,
            comments: parseInt(comments, 10) || 0
        });
    });
    return entryList;
}
