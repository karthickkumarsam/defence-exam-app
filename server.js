import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

// --- Firebase Admin from ENV (Render variables) ---
const serviceAccount = {
  project_id: process.env.FB_PROJECT_ID,
  client_email: process.env.FB_CLIENT_EMAIL,
  private_key: process.env.FB_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

const app = express();
app.use(express.json());
app.use(cors());

// Firebase init
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const userCollection = db.collection("users");

// ✅ Health check
app.get("/", (req, res) => res.json({ message: "API is running ✅" }));

// ✅ Register
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const userDoc = await userCollection.doc(email).get();
    if (userDoc.exists) return res.status(400).json({ error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await userCollection.doc(email).set({
      email,
      password: hashedPassword,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ message: "User registered successfully", user: { email } });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ✅ Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const userDoc = await userCollection.doc(email).get();
    if (!userDoc.exists) return res.status(400).json({ error: "Invalid credentials" });

    const userData = userDoc.data();
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    res.json({ message: "Login successful", user: { email } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on ${PORT}`));
