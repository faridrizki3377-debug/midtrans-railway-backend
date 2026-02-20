const midtransClient = require("midtrans-client");

const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

exports.createTransaction = async (orderId, amount) => {
  return await snap.createTransaction({
    transaction_details: {
      order_id: orderId,
      gross_amount: amount
    }
  });
};
