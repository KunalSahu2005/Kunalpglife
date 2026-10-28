// Mini Store - full backend in one file (Express + MongoDB + JWT)
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Database tables (models) ----------
const User = mongoose.model(
  "User",
  new mongoose.Schema({ name: String, email: { type: String, unique: true }, password: String })
);
const Product = mongoose.model(
  "Product",
  new mongoose.Schema({ name: String, price: Number, image: String, description: String })
);
const Order = mongoose.model(
  "Order",
  new mongoose.Schema(
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      items: [{ name: String, price: Number, qty: Number }],
      total: Number,
    },
    { timestamps: true }
  )
);

// ---------- Login check (middleware) ----------
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
const makeToken = (user) => jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

const auth = (req, res, next) => {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Please login first" });
  try {
    req.userId = jwt.verify(token, JWT_SECRET).id;
    next();
  } catch (e) {
    res.status(401).json({ message: "Invalid token, login again" });
  }
};

// ---------- Auth routes ----------
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });
    if (await User.findOne({ email }))
      return res.status(400).json({ message: "Email already used" });
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
    res.json({ token: makeToken(user), user: { name: user.name, email: user.email } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: "Wrong email or password" });
    res.json({ token: makeToken(user), user: { name: user.name, email: user.email } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ---------- Product routes ----------
app.get("/api/products", async (req, res) => {
  const search = req.query.search || "";
  res.json(await Product.find({ name: new RegExp(search, "i") }));
});

app.post("/api/products", auth, async (req, res) => {
  try {
    const { name, price, image, description } = req.body;
    if (!name || !price) return res.status(400).json({ message: "Name and price are required" });
    const product = await Product.create({
      name,
      price,
      description,
      image: image || "https://picsum.photos/seed/" + encodeURIComponent(name) + "/300/200",
    });
    res.json(product);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.delete("/api/products/:id", auth, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// ---------- Order routes ----------
app.post("/api/orders", auth, async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ message: "Cart is empty" });
    const orderItems = [];
    let total = 0;
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;
      orderItems.push({ name: product.name, price: product.price, qty: item.qty });
      total += product.price * item.qty;
    }
    res.json(await Order.create({ user: req.userId, items: orderItems, total }));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.get("/api/orders", auth, async (req, res) => {
  res.json(await Order.find({ user: req.userId }).sort({ createdAt: -1 }));
});

// ---------- Frontend page ----------
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

// ---------- Sample products ----------
async function addSampleProducts() {
  if ((await Product.countDocuments()) > 0) return;
  const list = [
    ["Wireless Earbuds", 1299], ["Smart Watch", 2499], ["Backpack", 899], ["Running Shoes", 1799],
    ["Water Bottle", 349], ["Desk Lamp", 599], ["Bluetooth Speaker", 1599], ["Cotton T-Shirt", 499],
  ];
  await Product.insertMany(
    list.map(([name, price]) => ({
      name,
      price,
      description: "Good quality " + name.toLowerCase() + " at a nice price.",
      image: "https://picsum.photos/seed/" + encodeURIComponent(name) + "/300/200",
    }))
  );
}

// ---------- Start ----------
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Database connected");
    await addSampleProducts();
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log("Open http://localhost:" + port));
  })
  .catch((err) => console.log("Database error:", err.message));
