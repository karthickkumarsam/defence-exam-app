import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import admin from "firebase-admin";
import exams from "./exams.js";
import path from "path"
import { fileURLToPath } from "url";
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/public", express.static(path.join(__dirname, "public")))

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
    const { name, email, password, dob, gender, education, branchInterest } = req.body;
    if (!email || !password || !name || !dob || !gender || !education || !branchInterest)
      return res.status(400).json({ error: "All fields are required" });

    const existingUser = await userCollection.where("email", "==", email).get();
    if (!existingUser.empty)
      return res.status(400).json({ error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserRef = await userCollection.add({
      name,
      email,
      password: hashedPassword,
      dob,
      gender,
      education,
      branchInterest,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ message: "User registered successfully", user: { id: newUserRef.id, email } });
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

    const userQuery = await userCollection.where("email", "==", email).limit(1).get();
    if (userQuery.empty) return res.status(400).json({ error: "Invalid credentials" });

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    res.status(200).json({ message: "Login successful", user: { id: userDoc.id, email } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ✅ Get all exams
app.get("/exams", async (req, res) => {
    try {
        const exams = [
            { id: "cds", name: "CDS" },
            { id: "nda", name: "NDA" },
            { id: "afcat", name: "AFCAT" },
            { name: "General Knowledge", url: "public/exams/GK/General_Knowledge.pdf" },
            { name: "Aptitude", url: "public/exams/Aptitude/Aptitude_Algebra.pdf" }
        ] 
        if(!exams || !exams.length) return res.status(400).json({ error: "No exams found"}) 

        res.json({ message: "Exams fetched successfully", exams })    
    } catch (error) {
        console.error("Fetch exams error:", error)
        res.status(500).json({ error: "Something went wrong" }) 
    }
})

// ✅ Get exams details
app.get("/exams/:examId/:userId", async (req, res) => {
    try {
        const { examId, userId } = req.params;
        const userDoc = await userCollection.doc(userId).get()
        if(!userDoc.exists) return res.status(400).json({ error: "User not found" })

        const profile = userDoc.data();  
        const exam = exams.find((e) => e.id == examId);
        if (!exam) return res.status(404).json({ error: "Exam not found" });

        const reason = checkEligibility(profile, exam)
        if(reason) return res.status(403).json({ message: `Sorry, you are not eligible due to: ${reason}`})

        res.status(200).json({ message: "Congratulations, you are eligible!", exam });
    } catch (error) {
        console.error("Fetch exam error:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

// ✅ Get Profile by ID
app.get("/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userDoc = await userCollection.doc(id).get();

    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });

    const userData = userDoc.data();
    delete userData.password;

    res.json({ message: "Profile fetched successfully", profile: { id, ...userData } });    
  } catch (error) {
    console.error("Fetch profile error:", err);
    res.status(500).json({ error: "Something went wrong" });    

  }
})

// ✅ Update Profile by ID
app.put("/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, state, city, mobile, profile } = req.body;

    const userDoc = await userCollection.doc(id).get();
    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });

    await userCollection.doc(id).update({
      ...(name && { name }),
      ...(state && { state }),
      ...(city && { city }),
      ...(mobile && { mobile }),
      ...(profile && { profile }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const updatedDoc = await userCollection.doc(id).get();
    const updatedUser = updatedDoc.data();
    delete updatedUser.password;

    res.json({ message: "Profile updated successfully", profile: { id, ...updatedUser } });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Eligibility check utility
function getAge(dob) {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

function checkEligibility(profile, examObj) {
  const age = getAge(profile.dob);
  const { gender, education, branchInterest } = profile;
  const req = examObj.requirements;

  if (examObj.id === "nda") {
    if (age < 16.5 || age > 19) return "Age not in NDA range";
    if (gender !== "Male") return "NDA is only for Male candidates";
    if (!/(12th Pass|Equivalent)/i.test(education)) return "NDA requires 12th Pass or Equivalent";
    if (!req.branch.includes(branchInterest)) return "Invalid branch for NDA";
    return null;
  }
  if (examObj.id === "cds") {
    if (branchInterest === "Army" && (age < 19 || age > 24)) return "Age not in CDS Army range";
    if ((branchInterest === "Navy" || branchInterest === "Air Force") && (age < 19 || age > 22)) return "Age not in CDS Navy/Air range";
    if (!["Male", "Female"].includes(gender)) return "Invalid gender for CDS";
    if (!/Graduate/i.test(education)) return "CDS requires Graduation";
    if (!req.branch.includes(branchInterest)) return "Invalid branch for CDS";
    return null;
  }
  if (examObj.id === "afcat") {
    if (branchInterest === "Flying Branch" && (age < 20 || age > 24)) return "Age not in AFCAT Flying range";
    if (branchInterest === "Ground Duty (Technical)" && (age < 20 || age > 26)) return "Age not in AFCAT Ground Duty Technical range";
    if (branchInterest === "Ground Duty (Admin)" && (age < 20 || age > 26)) return "Age not in AFCAT Ground Duty Admin range";
    if (!["Male", "Female"].includes(gender)) return "Invalid gender for AFCAT";
    if (branchInterest === "Ground Duty (Technical)" && !/Engineering/i.test(education)) return "Engineering degree required for Technical Branch";
    if (branchInterest === "Ground Duty (Admin)" && !/Graduate/i.test(education)) return "Graduate degree required for Admin Branch";
    if (!req.branch.includes(branchInterest)) return "Invalid branch for AFCAT";
    return null;
  }
  return "Unknown exam";
}

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on ${PORT}`));
