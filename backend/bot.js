const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");
const { sendToSheet } = require("./googleapis/googleSheet");

// Store user data and cart
const userProfiles = {};
const userCarts = {};
const orderHistory = {};

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true },
});

client.on("qr", (qr) => qrcode.generate(qr, { small: true }));
client.on("ready", () =>
  console.log("🚀 WhatsApp AI E-Commerce Bot is Ready!")
);

// 🛒 Handle incoming messages
client.on("message", async (msg) => {
  const userId = msg.from;
  const text = msg.body.toLowerCase();

  // 📌 PROFILE MANAGEMENT
  if (!userProfiles[userId] && !text.startsWith("profile create")) {
    return msg.reply(
      "⚠️ Please create a profile first! Send:\n*Profile Create <Your Name> <Your Address>*"
    );
  }

  if (text.startsWith("profile create ")) {
    const [, name, ...addressParts] = text.split(" ");
    const address = addressParts.join(" ");

    if (!name || !address) {
      return msg.reply(
        "❌ Invalid format! Use:\n*Profile Create <Name> <Full Address>*"
      );
    }

    userProfiles[userId] = { name, address };
    return msg.reply(`✅ Profile created successfully!\nWelcome *${name}* 🎉`);
  }

  // 🛒 ADD TO CART
  if (text.startsWith("add ")) {
    const [, product, quantity] = text.split(" ");
    if (!userCarts[userId]) userCarts[userId] = [];
    userCarts[userId].push({ product, quantity });

    return msg.reply(
      `✅ Added *${quantity}x ${product}* to your cart! Type 'Show Cart' to view.`
    );
  }

  // 🛍️ SHOW CART
  if (text === "show cart") {
    if (!userCarts[userId] || userCarts[userId].length === 0) {
      return msg.reply(
        "🛒 Your cart is empty! Use 'Add <Product> <Qty>' to add items."
      );
    }

    let cartMessage = "🛒 Your Cart:\n";
    userCarts[userId].forEach((item, index) => {
      cartMessage += `\n${index + 1}. ${item.quantity}x ${item.product}`;
    });
    cartMessage += "\n\nType 'Checkout' to place your order!";
    return msg.reply(cartMessage);
  }

  // 🛒 CHECKOUT
  if (text === "checkout") {
    if (!userCarts[userId] || userCarts[userId].length === 0) {
      return msg.reply("❌ Your cart is empty! Add items before checking out.");
    }

    const orderId = `ORD-${Date.now()}`;
    orderHistory[orderId] = {
      userId,
      items: userCarts[userId],
      status: "Processing",
    };

    msg.reply(`🎉 Order placed! Your order ID is *${orderId}*`);
    delete userCarts[userId]; // Clear cart after checkout
  }

  // 📦 ORDER TRACKING
  if (text.startsWith("track ")) {
    const [, orderId] = text.split(" ");
    const order = orderHistory[orderId];

    if (order) {
      return msg.reply(
        `📦 Order Status:\nOrder ID: *${orderId}*\nStatus: *${order.status}*`
      );
    } else {
      return msg.reply("❌ Order not found! Please check your Order ID.");
    }
  }

  // 🔄 RETURNS & EXCHANGES
  if (text.startsWith("return ")) {
    const [, orderId] = text.split(" ");
    if (!orderHistory[orderId]) {
      return msg.reply("❌ Order not found!");
    }

    orderHistory[orderId].status = "Return Requested";
    return msg.reply("🔄 Return initiated! Our team will contact you soon.");
  }

  if (text.startsWith("exchange ")) {
    const [, orderId] = text.split(" ");
    if (!orderHistory[orderId]) {
      return msg.reply("❌ Order not found!");
    }

    orderHistory[orderId].status = "Exchange Requested";
    return msg.reply("🔄 Exchange requested! Our team will reach out.");
  }

  // ℹ️ FAQ & CUSTOMER SUPPORT
  if (text === "faq") {
    return msg.reply(
      "📚 *FAQ:*\n\n" +
        "1️⃣ *Returns:* Within 7 days\n" +
        "2️⃣ *Exchanges:* Size/Color changes\n" +
        "3️⃣ *Tracking:* 3-5 business days\n" +
        "4️⃣ *Support:* Email: support@yourbusiness.com"
    );
  }

  // ℹ️ DEFAULT MESSAGE
  return msg.reply(
    "🤖 *E-Commerce Bot Commands:*\n" +
      "» *Profile Create <Name> <Address>* - Create profile\n" +
      "» *Add <Product> <Qty>* - Add items to cart\n" +
      "» *Show Cart* - View your cart\n" +
      "» *Checkout* - Place your order\n" +
      "» *Track <OrderID>* - Check order status\n" +
      "» *Return <OrderID>* - Request a return\n" +
      "» *Exchange <OrderID>* - Request an exchange\n" +
      "» *FAQ* - View frequently asked questions"
  );
});

client.initialize();
