import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { name, password } = req.body;

  try {
    await dbConnect();

    const existingUser = await User.findOne({ name });
    if (existingUser) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      password: hashedPassword,
    });

    await newUser.save();

    return res.status(201).json({ message: "User created" });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
