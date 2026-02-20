const crypto = require("crypto");

module.exports = (orderId, statusCode, grossAmount, signatureKey) => {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;

  const hash = crypto
    .createHash("sha512")
    .update(orderId + statusCode + grossAmount + serverKey)
    .digest("hex");

  return hash === signatureKey;
};
