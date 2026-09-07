import express from 'express';
import { webScraper } from '../services/scraper.js';
import {filterMinPoints} from '../services/filterService.js';
import  {lastCrawl, setLastCrawl, requireCrawl} from '../state.js'

export const crawlHandler = async (req, res) => {
    const { url } = req.body;
    const entries = await webScraper(url);
    res.json({ url, count: entries.length, entries });
}

export const filterByPoints = (req, res) => {
    const min = Number(req.query.min) || 0;
    const filtered = filterMinPoints(lastCrawl.entries, min);
    res.json({filter: 'points', min, count: filtered.length, entries: filtered})
}

export const v1 = express.Router();
v1.post("/crawl", crawlHandler);
v1.get("/entries/filter/points", requireCrawl, filterByPoints);
//v1.get("/entries/filter/comments", requireCrawl, filterByComments);