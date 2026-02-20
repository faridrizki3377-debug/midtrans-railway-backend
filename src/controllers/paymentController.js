const { v4: uuidv4 } = require("uuid");
const pool = require("../config/db");
const midtransService = require("../services/midtransService");
const verifySignature = require("../utils/verifySignature");

exports.createTopUp = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    const orderId = "ORDER-" + uuidv4();

    const transaction = await midtransService.createTransaction(orderId, amount);

    await pool.query(
      "INSERT INTO transactions(id, user_id, order_id, amount, status) VALUES($1,$2,$3,$4,$5)",
      [uuidv4(), userId, orderId, amount, "pending"]
    );

    res.json({
      snapToken: transaction.token,
      redirectUrl: transaction.redirect_url
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status
    } = req.body;

    const isValid = verifySignature(
      order_id,
      status_code,
      gross_amount,
      signature_key
    );

    if (!isValid) return res.status(403).json({ message: "Invalid Signature" });

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const trx = await client.query(
        "SELECT * FROM transactions WHERE order_id=$1",
        [order_id]
      );

      if (!trx.rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Transaction not found" });
      }

      const transaction = trx.rows[0];

      if (transaction_status === "settlement") {
        await client.query(
          "UPDATE users SET balance = balance + $1 WHERE id=$2",
          [transaction.amount, transaction.user_id]
        );

        await client.query(
          "UPDATE transactions SET status='success' WHERE order_id=$1",
          [order_id]
        );
      }

      await client.query("COMMIT");

    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    res.json({ message: "Webhook processed" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
