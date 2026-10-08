const express = require("express");

const {
    getDisruptionImpact
} = require("../controllers/disruptionController");

const router = express.Router();

router.get("/:id/impact", getDisruptionImpact);

module.exports = router;