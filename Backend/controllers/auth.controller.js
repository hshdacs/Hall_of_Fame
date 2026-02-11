const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../db/model/userSchema");
const JWT_SECRET = process.env.JWT_SECRET || "supersecret123";

// REGISTER USER
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Determine role
    let assignedRole = "viewer";
    if (email.endsWith("@stud.hochschule-heidelberg.de")) assignedRole = "student";
    if (email.endsWith("@hochschule-heidelberg.de")) assignedRole = "faculty";

    const user = await User.create({
      name,
      email,
      // Password is hashed by userSchema pre-save hook
      password,
      role: assignedRole
    });

    res.status(200).json({
      message: "User registered successfully",
      assignedRole
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// LOGIN USER + GET JWT TOKEN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    // Compare passwords
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid email or password" });

    // JWT Payload
    const payload = { id: user._id, role: user.role };

    // Generate token
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: "7d"
    });

    // Response
    res.status(200).json({
      message: "Login successful",
      token,
      role: user.role
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
