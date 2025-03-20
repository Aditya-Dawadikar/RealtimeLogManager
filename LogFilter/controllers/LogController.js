const { Client } = require("@elastic/elasticsearch");
const config = require('../config');

const esClient = new Client({ node: config.ELASTICSEARCH_HOST });

const LogQueryController = async (req, res) => {
    try {

        const { skip = 0, limit = 100, query } = req.query

        const searchBody = {
            index: "logs",
            size: parseInt(limit),
            from: parseInt(skip),
            body: {}
        }

        if (query) {
            searchBody.body.query = {
                bool: {
                    should: [
                        { match: { "user_id": query } },
                        { match: { "video_title": query } },
                        { wildcard: { "video_title.keyword": `*${query}*` } }
                    ],
                    minimum_should_match: 1
                }
            }
        }

        const response = await esClient.search(searchBody)

        // Ensure we have a valid response structure
        if (!response || !response.hits) {
            return res.status(500).json({
                error: "Unexpected Elasticsearch response structure"
            });
        }

        res.json(response.hits.hits.map(hit => hit._source));
    } catch (error) {
        if (error.meta && error.meta.body && error.meta.body.error) {
            console.error("Elasticsearch Error:", error.meta.body.error);
            return res.status(500).json({
                error: error.meta.body.error
            });
        }

        console.error("Error fetching logs from Elasticsearch:", error);
        res.status(500).json({
            error: "Failed to fetch logs from Elasticsearch"
        });
    }
}

const LogTopVideosController = async (req, res) => {
    try {
        const { k = 5 } = req.query

        const searchBody = {
            index: "logs",
            size: 0,
            body: {
                aggs: {
                    top_videos: {
                        terms: {
                            field: "video_title.keyword",
                            size: parseInt(k)
                        }
                    }
                }
            }
        }

        const response = await esClient.search(searchBody)

        if (!response || !response.aggregations || !response.aggregations.top_videos) {
            return res.status(500).json({
                error: "Unexpected Elastic Search reponse structure"
            })
        }

        const result = response.aggregations.top_videos.buckets.map(bucket => ({
            video_title: bucket.key,
            count: bucket.doc_count
        }))

        res.json(result)

    } catch (error) {
        if (error.meta && error.meta.body && error.meta.body.error) {
            console.error("Elasticsearch Error:", error.meta.body.error);
            return res.status(500).json({
                error: error.meta.body.error
            });
        }

        console.error("Error fetching top videos from Elasticsearch:", error);
        res.status(500).json({
            error: "Failed to fetch aggregation data"
        });
    }
}

const LogTopUsersController = async (req, res) => {
    try {
        const { k = 5 } = req.query

        const searchBody = {
            index: "logs",
            size: 0,
            body: {
                aggs: {
                    top_users: {
                        terms: {
                            field: "user_id",
                            size: parseInt(k)
                        }
                    }
                }
            }
        }

        const response = await esClient.search(searchBody)

        if (!response || !response.aggregations || !response.aggregations.top_users) {
            return res.status(500).json({
                error: "Unexpected Elastic Search reponse structure"
            })
        }

        const result = response.aggregations.top_users.buckets.map(bucket => ({
            user_id: bucket.key,
            count: bucket.doc_count
        }))

        res.json(result)

    } catch (error) {
        if (error.meta && error.meta.body && error.meta.body.error) {
            console.error("Elasticsearch Error:", error.meta.body.error);
            return res.status(500).json({
                error: error.meta.body.error
            });
        }

        console.error("Error fetching top users from Elasticsearch:", error);
        res.status(500).json({
            error: "Failed to fetch aggregation data"
        });
    }
}

const LogEventDistributionController = async (req, res) => {
    try {

        const searchBody = {
            index: "logs",
            size: 0,
            body: {
                aggs: {
                    event_distribution: {
                        terms: {
                            field: "event",
                            size: 10
                        }
                    }
                }
            }
        }

        const response = await esClient.search(searchBody)

        if (!response || !response.aggregations || !response.aggregations.event_distribution) {
            return res.status(500).json({
                error: "Unexpected Elastic Search response structure"
            })
        }

        const result = response.aggregations.event_distribution.buckets.map(bucket => ({
            event: bucket.key,
            count: bucket.doc_count
        }))

        res.json(result)

    } catch (error) {
        if (error.meta && error.meta.body && error.meta.body.error) {
            console.error("Elasticsearch Error:", error.meta.body.error);
            return res.status(500).json({
                error: error.meta.body.error
            });
        }

        console.error("Error fetching event distribution from Elasticsearch:", error);
        res.status(500).json({
            error: "Failed to fetch aggregation data"
        });
    }
}

const LogTimeIntrevalController = async (req, res) => {
    try {
        // Default interval = past 1hr
        const { interval = "1h" } = req.query

        const now = Date.now()
        let durationMs;

        if (interval.endsWith("m")) {
            durationMs = parseInt(interval) * 60 * 1000
        } else if (interval.endsWith("h")) {
            durationMs = parseInt(interval) * 60 * 60 * 1000
        } else if (interval.endsWith("d")) {
            durationMs = parseInt(interval) * 24 * 60 * 60 * 1000
        } else {
            return res.status(400).json({
                error: "Invalid interval format. Use '5m', '1h', '6h', '1d', etc."
            })
        }

        const fromTimestamp = now - durationMs

        const searchBody = {
            index: "logs",
            size: 1000,
            body: {
                query: {
                    range: {
                        processed_at: {
                            gte: fromTimestamp,
                            lte: now,
                            format: "epoch_millis"
                        }
                    }
                }
            }
        }

        const response = await esClient.search(searchBody)

        if (!response || !response.hits) {
            return res.status(500).json({
                error: "Unexpected Elastic Search response structure"
            })
        }

        res.json(response.hits.hits.map(hit => hit._source));

    } catch (error) {

        if (error.meta && error.meta.body && error.meta.body.error) {
            console.error("Elasticsearch Error:", error.meta.body.error);
            return res.status(500).json({
                error: error.meta.body.error
            });
        }

        console.error("Error fetching logs for time interval from Elasticsearch:", error);
        res.status(500).json({
            error: "Failed to fetch logs for time interval"
        });
    }
}

module.exports = {
    LogQueryController,
    LogTopVideosController,
    LogTopUsersController,
    LogEventDistributionController,
    LogTimeIntrevalController
}
