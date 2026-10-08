const {
    analyzeDisruption
} = require("../services/disruptionImpactService");

async function getDisruptionImpact(req, res) {
    try {
        const result = await analyzeDisruption(req.params.id);

        res.json(result);
    } catch (error) {
        console.error(error);

        if (error.message === "Disruption not found") {
            return res.status(404).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: "Failed to analyze disruption"
        });
    }
}

module.exports = {
    getDisruptionImpact
};