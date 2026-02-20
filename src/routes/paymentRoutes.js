const express = require("express");
const router = express.Router();
const controller = require("../controllers/paymentController");

router.post("/topup", controller.createTopUp);
router.post("/webhook", controller.handleWebhook);

module.exports = router;
