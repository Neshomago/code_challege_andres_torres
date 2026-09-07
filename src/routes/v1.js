import express from 'express';
import { webScraper } from '../services/scraper.js';
import {filterMinComments, filterMinPoints} from '../services/filterService.js';
import  {lastCrawl, setLastCrawl, requireCrawl} from '../state.js'
import { getRecentAudit, saveAudit } from '../db.js';

export const crawlHandler = async (req, res) => {
    const { url } = req.body;
    const entries = await webScraper(url);
    setLastCrawl({url, entries});
    res.json({ url, count: entries.length, entries });
}

export const filterByComments = (req, res) => {
    const min = Number(req.query.min) || 0;
    const filtered = filterMinComments(lastCrawl.entries, min);
    saveAudit("comments", { min }, filtered.length, lastCrawl.url);
    res.json({filter: 'comments', min, count: filtered.length, entries: filtered})
}

export const filterByPoints = (req, res) => {
    const min = Number(req.query.min) || 0;
    const filtered = filterMinPoints(lastCrawl.entries, min);
    saveAudit("points", { min }, filtered.length, lastCrawl.url);
    res.json({filter: 'points', min, count: filtered.length, entries: filtered})
}

export const auditHandler = (req, res) => {
    res.json(getRecentAudit(20));
}

export const v1 = express.Router();
v1.post("/crawl", crawlHandler);
v1.get("/entries/filter/points", requireCrawl, filterByPoints);
v1.get("/entries/filter/comments", requireCrawl, filterByComments);
v1.get("/audit", auditHandler);