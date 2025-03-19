const { Client } = require("@elastic/elasticsearch");
const config = require('../config');

const esClient = new Client({ node: config.ELASTICSEARCH_HOST });

const LogQueryController = async (req, res) => {
    try {
        const response = await esClient.search({
            index: "logs",
            size: 1000
        });

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
    // TODO
}

const LogTopUsersController = async (req, res) => {
    // TODO
}

const LogEventDistributionController = async (req, res) => {
    // TODO
}

const LogTimeIntrevalController = async (req, res) => {
    // TODO
}

module.exports = {
    LogQueryController,
    LogTopVideosController,
    LogTopUsersController,
    LogEventDistributionController,
    LogTimeIntrevalController
}
