const express = require("express");
const mongoose = require("mongoose");
const path = require('path');
const bcrypt = require('bcrypt');
const User = require("./models/User.Js");
const jwt = require('jsonwebtoken');
const session = require('express-session');
const Todo = require('./models/Todo');

const app = express();

const uri = "mongodb+srv://sagirab:12345@cluster0.elzure6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(uri).then(() => console.log("connected to mongodb")).catch(err => console.error("could not connect to mongodb", err));

app.use(express.static('Public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const jwtSecret = "SKDJFKSJDKGKSDFGHJK#)@$()@";

// Middleware to create a session for the user 
app.use(session({
    secret: 'jwtSecret',
    resave: false,
    saveUninitialized: true
}));

// Middleware to authenticate JWT token and attach the user to the request object
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: "No authentication token provided" });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: "Unauthorized, token malformed" });
    }

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            console.error('JWT verification error:', err);
            return res.status(403).json({ error: "Forbidden, token invalid", details: err.message });
        }
        req.user = user;
        next();
    });
}


app.get("/", (req, res) => {
    if (req.session.userId) {
        res.redirect("/todos");
    } else {
        res.redirect("/login");
    }
});


app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname + "/Public/LoginUser.html"))
});

app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname + "/Public/RegisterUser.html"));
});

app.get("/todos", (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname + "/Public/todosUser.html"));
});



// Get todos for the logged-in user
app.get("/api/todos", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        const userId = req.session.userId;
        const todos = await Todo.find({ user: userId });
        // Send the todos as JSON
        res.json(todos);
    } catch (error) {
        console.error("An error occurred", error);
        res.status(500).json({ error: "An error occurred" });
    }
});

// Register a new user and hash their password before saving them to the database
app.post("/register", async (req, res) => {
    try {
        const { email, password, username } = req.body;

        const user_exists = await User.findOne({ email });
        if (user_exists) {
            return res.status(400).json({ error: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({ email, password: hashedPassword, username });

        await user.save();
        res.status(200).json({ message: "Registration successful" });

    } catch (error) {
        console.error("An error occurred", error);
        res.status(500).json({ error: "An error occurred" });
    }
});


// Login a user and generate a JWT token for them to use for subsequent requests to the server
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Invalid email or password" });
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: "Invalid email or password" });
        }
        const token = jwt.sign({ _id: user._id }, jwtSecret, { expiresIn: "1h" });

        req.session.userId = user._id;
        req.session.email = user.email;
        req.session.username = user.username;

        res.status(200).json({ token, user: { email: user.email, username: user.username } });
    } catch (error) {
        console.error("An error occurred", error);
        res.status(500).json({ error: "An error occurred" });
    }
});

// Add todo for the logged-in user 
app.post("/addTodo", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        const userId = req.session.userId;
        const { text } = req.body;
        const newTodo = new Todo({
            text,
            user: userId,
            completed: false
        });
        await newTodo.save();
        res.status(200).json({ message: "Todo added successfully" });
    } catch (error) {
        console.error("Error in adding todo:", error);
        res.status(500).json({ error: "An error occurred", details: error.message });
    }
});


// Edit todo for the logged-in user
app.post('/editTodo', authenticateToken, async (req, res) => {
    const { id, text, completed } = req.body;
    if (!id) {
        return res.status(400).json({ error: 'Missing todo ID' });
    }

    try {
        const todo = await Todo.findById(id);
        if (!todo) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        todo.text = text !== undefined ? text : todo.text;
        todo.completed = completed !== undefined ? completed : todo.completed;

        const updatedTodo = await todo.save();
        res.json(updatedTodo);
    } catch (error) {
        console.error("An error occurred", error);
        res.status(500).json({ error: "An error occurred", details: error.message });
    }
});


// Delete todo for the logged-in user
app.post("/deleteTodo", authenticateToken, async (req, res) => {
    try {
        const { todoId } = req.body;
        if (!todoId) {
            return res.status(400).json({ error: "Missing todoId" });
        }
        await Todo.findByIdAndDelete(todoId);
        res.status(200).json({ message: "Todo deleted successfully" });
    } catch (error) {
        console.error("An error occurred", error);
        res.status(500).json({ error: "An error occurred" });
    }
});


// Logout a user by destroying their session and redirecting them to the login page
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error logging out:', err);
            return res.status(500).json({ error: 'An error occurred' });
        }
        res.status(200).json({ message: 'Logged out successfully' });
    });
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`server is running on port:${PORT}`)); 