export let lastCrawl = null;

export const setLastCrawl = (data) => {
    lastCrawl = data;
}

export const requireCrawl = (req, res, next) => {
    if (!lastCrawl) {
        return res.status(400).json({error: "Crawl the URL on [POST] /crawl endopoint"});
    }
    next();
}