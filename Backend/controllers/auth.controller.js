const User = require("../db/model/userSchema");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret123";

const universityDomains = [
  "stud.hochschule-heidelberg.de",
  "hochschule-heidelberg.de"
];

// REGISTER
exports.register = async (req, res) => {
  try {
    const { name, email, password, regNumber } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    // extract domain
    const domain = email.split("@")[1]?.toLowerCase();

    let role = "viewer";
    if (universityDomains.includes(domain)) {
      role = "student";   // default student role
    }

    const user = await User.create({
      name,
      email,
      password,
      regNumber,
      role
    });

    return res.json({
      message: "User registered successfully",
      assignedRole: role
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        email: user.email
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
