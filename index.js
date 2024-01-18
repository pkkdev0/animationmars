const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const Poster = require("./models/poster");
const bcrypt = require("bcrypt");
const session = require("express-session");
const config = require("./config.js");
const cookieParser = require("cookie-parser");
// ... other middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: !true },
  }),
);
app.use(cookieParser());

mongoose
  .connect(
    "mongodb+srv://zakaryazam8:zakarya12345@zakarya.gpmnbq9.mongodb.net/?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true },
  )
  .then(() => console.log("Connected to MongoDB..."))
  .catch((err) => console.error("Could not connect to MongoDB...", err));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ...

// ...

app.post("/save-user", async (req, res) => {
  const {
    postId,
    username,
    biography,
    imgLink,
    star,
    time,
    triler,
    datatime,
    servervideo,
    servervideo2,
    servervideo3,
    servervideo4,
    servervideo5,
    servervideoname,
    servervideoname2,
    servervideoname3,
    servervideoname4,
    servervideoname5,
  } = req.body;
  const user = new Poster({
    postId,
    username,
    biography,
    imgLink,
    star,
    tags,
    time,
    triler,
    datatime,
    servervideo,
    servervideo2,
    servervideo3,
    servervideo4,
    servervideo5,
    servervideoname,
    servervideoname2,
    servervideoname3,
    servervideoname4,
    servervideoname5,
  });
  try {
    await user.save();
    res.status(201).json({ message: "User saved successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Error saving user", error });
  }
});

// Set the view engine to ejs
app.set("view engine", "ejs");

// Define the path for the views directory
app.set("views", path.join(__dirname, "views"));

// Define a route for the index page
// Define a route for the index page
app.get("/", async (req, res) => {
  try {
    const posters = await Poster.find({}).sort({ createdAt: -1 }).limit(5); // Fetch only the last 5 posters
    const user = req.session.user;
    const { ownerUserId, adminUserId, staffUserId } = require("./config.js"); // Make sure this line comes after const config = require('./config.js');
    const isAdmin = user && adminUserId.includes(user.userId); // Updated this to include checking for an admin
    const isOwner = user && ownerUserId.includes(user.userId); // Checks for owner
    const isStaff = user && staffUserId.includes(user.userId); // Checks for staff
    const data = await Poster.find({}).select("views").lean();
    const uniqueDBTags = await Poster.distinct("tags");
    const configTags = config.tags;
    const combinedTags = Array.from(new Set([...configTags, ...uniqueDBTags]));

    res.render("index", {
      title: "Welcome to my EJS website!",
      posters: posters,
      user: user,
      isAdmin: isAdmin,
      isOwner: isOwner, // Pass the isOwner flag to the index.ejs view
      isStaff: isStaff, // Pass the isStaff flag to the index.ejs view
      formatNumber: formatNumber,
      data: { views: posters.viewsCount },
      tags: combinedTags,
    });
  } catch (error) {
    res.status(500).send("Error fetching posters");
  }
});
function formatNumber(num) {
  if (num >= 1e15) return (num / 1e15).toFixed(1) + "q";
  if (num >= 1e12) return (num / 1e12).toFixed(1) + "t";
  if (num >= 1e9) return (num / 1e9).toFixed(1) + "b";
  if (num >= 1e6) return (num / 1e6).toFixed(1) + "m";
  if (num >= 1e3) return (num / 1e3).toFixed(1) + "k";
  return num.toString();
}
const UserProfile = require("./models/userProfile"); // Add the correct path to your UserProfile model
app.get("/movie-details/:postId", async (req, res) => {
  try {
    const postId = req.params.postId;
    // Remove `.lean()` to get a Mongoose document
    const poster = await Poster.findOne({ postId: postId });

    if (!poster) {
      return res.status(404).send("Poster not found");
    }
    if (!poster.userViews) {
      poster.userViews = new Map();
    }
    const bargUserIds = Array.isArray(poster.barg)
      ? poster.barg
      : [poster.barg];
    const taknekUserIds = Array.isArray(poster.taknek)
      ? poster.taknek
      : [poster.taknek];
    const wargerUserIds = Array.isArray(poster.warger)
      ? poster.warger
      : [poster.warger];
    const uniqueUserIds = [
      ...new Set([...bargUserIds, ...taknekUserIds, ...wargerUserIds]),
    ];

    const relatedProfiles = await UserProfile.find({
      userId: { $in: uniqueUserIds },
    });

    const profilesMap = relatedProfiles.reduce((map, profile) => {
      map[profile.userId] = profile;
      return map;
    }, {});

    poster.bargDetails = bargUserIds.map((id) => profilesMap[id] || null);
    poster.taknekDetails = taknekUserIds.map((id) => profilesMap[id] || null);
    poster.wargerDetails = wargerUserIds.map((id) => profilesMap[id] || null);

    const now = new Date();
    const SIX_HOURS = 6 * 60 * 60 * 1000; // Six hours in milliseconds
    // Check if session exists and user is logged in
    if (req.session && req.session.user) {
      const userId = req.session.user.userId;
      const userLastViewTime = poster.userViews.get(userId);
      if (!userLastViewTime || now - new Date(userLastViewTime) >= SIX_HOURS) {
        poster.viewsCount = (poster.viewsCount || 0) + 1;
        poster.userViews.set(userId, now); // Update the last view time for this user
        await Poster.updateMany({}, { $set: { userViews: {} } });
        await poster.save(); // Save the poster with updated view count and userViews
        // Initialize userViews if it doesn't exist

        const userLastViewTime = poster.userViews.get(userId);
        // Rest of your code...
      }
    } else {
      // Check for a cookie marking the last anonymous visit
      const lastAnonViewTime = req.cookies["anonViewTime"];

      // If no cookie or six hours have passed since the last anonymous visit
      if (
        !lastAnonViewTime ||
        now - new Date(parseInt(lastAnonViewTime)) >= SIX_HOURS
      ) {
        // Increment poster's view count
        poster.viewsCount = (poster.viewsCount || 0) + 1;
        await poster.save(); // Save the poster with updated view count

        // Set a cookie with the current timestamp to track anonymous view timestamp
        res.cookie("anonViewTime", now.getTime(), {
          maxAge: SIX_HOURS,
          httpOnly: true,
        });
      }
    }
    const data = await Poster.find({}).select("views").lean();
    res.render("movie-details", {
      poster: poster.toObject(), // Convert Mongoose document to a plain object
      user: req.session.user,
      bargProfiles: poster.bargDetails,
      taknekProfiles: poster.taknekDetails,
      wargerProfiles: poster.wargerDetails,
      formatNumber: formatNumber,
      data: { views: poster.viewsCount },
    });
  } catch (error) {
    console.error("Error fetching movie details:", error);
    res.status(500).send("Error fetching movie details");
  }
});

app.get("/favorites", (req, res) => {
  res.render("favorites");
});

app.get("/login", (req, res) => {
  res.render("login");
});
// Delete this duplicate route.
app.get("/profile", (req, res) => {
  res.render("profile");
});

app.get("/edit-profile", (req, res) => {
  res.render("edit-profile");
});
app.get("/staff", async (req, res) => {
  try {
    // Aggregation queries to count staff members in different categories
    const countsPromises = [
      Poster.aggregate([
        { $unwind: "$warger" },
        { $group: { _id: "$warger", count: { $sum: 1 } } },
      ]),
      Poster.aggregate([
        { $unwind: "$barg" },
        { $group: { _id: "$barg", count: { $sum: 1 } } },
      ]),
      Poster.aggregate([
        { $unwind: "$taknek" },
        { $group: { _id: "$taknek", count: { $sum: 1 } } },
      ]),
    ];

    // Fetch user profiles for owners, admins, and staff
    const profilesPromises = [
      UserProfile.find({ userId: { $in: config.ownerUserId } }),
      UserProfile.find({ userId: { $in: config.adminUserId } }),
      UserProfile.find({ userId: { $in: config.staffUserId } }),
      UserProfile.find({ userId: { $in: config.bargs } }),
      UserProfile.find({ userId: { $in: config.takneks } }),
      UserProfile.find({ userId: { $in: config.wargers } }),
    ];

    // Execute all promises in parallel using destructuring to obtain results
    const [
      wargerCounts,
      bargCounts,
      taknekCounts,
      owners,
      admins,
      staffs,
      bargs,
      takneks,
      wargers,
    ] = await Promise.all([...countsPromises, ...profilesPromises]);

    // Render the staff page with the data from both operations
    res.render("staff", {
      admins: admins || [],
      owners: owners || [],
      staffs: staffs || [],
      bargs: bargs || [],
      takneks: takneks || [],
      wargers: wargers || [],

      wargerCounts: wargerCounts || [],
      bargCounts: bargCounts || [],
      taknekCounts: taknekCounts || [],
    });
  } catch (error) {
    console.error("Error loading staff page:", error);
    res.status(500).send("Internal Server Error");
  }
});
// Make sure this is the only /profile route and it is correctly implemented.
// Assuming this is the admin check function
const isAdminUser = (user) => {
  // Replace 'your_admin_id' with the actual admin id or add your own logic
  const adminId = user && config.adminUserId.includes(user.userId);
  return user && user._id === adminId;
};

app.get("/profile/:userId", async (req, res) => {
  try {
    const profileUserId = req.params.userId;
    const profileUser = await UserProfile.findOne({ userId: profileUserId });
    const sessionUser = req.session.user;

    // Check if userProfile exists before attempting to fetch related posters
    if (!profileUser) {
      return res.status(404).send("User profile not found");
    }
    // Fetch the posters where the user is either the creator or referenced in any role
    const relatedPosters = await Poster.find({
      $or: [
        { userId: profileUserId },
        { barg: profileUserId },
        { taknek: profileUserId },
        { warger: profileUserId },
        { barg: { $in: [profileUserId] } },
        { taknek: { $in: [profileUserId] } },
        { warger: { $in: [profileUserId] } },
      ],
    });
    // Separate the related posters into their respective categories
    const userPosters = relatedPosters.filter(
      (poster) => poster.userId === profileUserId,
    );
    const userbarg = relatedPosters.filter((poster) =>
      Array.isArray(poster.barg)
        ? poster.barg.includes(profileUserId)
        : poster.barg === profileUserId,
    );
    const usertaknek = relatedPosters.filter((poster) =>
      Array.isArray(poster.taknek)
        ? poster.taknek.includes(profileUserId)
        : poster.taknek === profileUserId,
    );
    const userwarger = relatedPosters.filter((poster) =>
      Array.isArray(poster.warger)
        ? poster.warger.includes(profileUserId)
        : poster.warger === profileUserId,
    );
    // Assuming that bargCounts, taknekCounts, and wargerCounts are fetched from other parts of your application
    // You should ensure that they are available in this scope before trying to pass them to the template

    // Check the user's privileges
    const isOwner =
      sessionUser && config.ownerUserId.includes(sessionUser.userId);
    const isAdmin =
      sessionUser && config.adminUserId.includes(sessionUser.userId);
    const isStaff =
      sessionUser && config.staffUserId.includes(sessionUser.userId);

    // Render the profile page with both the user's posters and associated posters
    res.render("profile", {
      user: profileUser,
      sessionUser: sessionUser,
      isAdmin: isAdmin,
      isOwner: isOwner,
      isStaff: isStaff,
      posters: userPosters,
      userbarg: userbarg,
      usertaknek: usertaknek,
      userwarger: userwarger,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).send("Error fetching user profile");
  }
});
// Add this route to your Express app in index.js

app.get("/edit-profile/:userId", async (req, res) => {
  if (!req.session.user || req.session.user.userId !== req.params.userId) {
    return res.redirect("/login");
  }

  try {
    const user = await UserProfile.findOne({ userId: req.params.userId });
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.render("edit-profile", { user }); // Pass the user object here
  } catch (error) {
    res.status(500).send("Error fetching user information");
  }
});
app.post("/edit-profile/:userId", async (req, res) => {
  if (!req.session.user || req.session.user.userId !== req.params.userId) {
    return res.redirect("/login");
  }

  const {
    username,
    displayname,
    bio,
    age,
    backgrund,
    profileimg,
    password,
    facebookProfile,
    twitterProfile,
    tiktokProfile,
    telegramProfile,
    youtubeProfile,
    instagramProfile,
    discordProfile,
  } = req.body;

  try {
    const updatedUser = await UserProfile.findOneAndUpdate(
      { userId: req.params.userId },
      {
        $set: {
          username,
          displayname,
          bio,
          age,
          backgrund,
          profileimg,
          password,
          facebookProfile,
          twitterProfile,
          tiktokProfile,
          telegramProfile,
          youtubeProfile,
          instagramProfile,
          discordProfile,
        },
      },
      { new: true, runValidators: true },
    );
    if (!updatedUser) {
      return res.status(404).send("User not found");
    }
    req.session.user = updatedUser; // Update the session with the new user information
    res.redirect(`/profile/${req.params.userId}`); // Redirect to the updated profile page
  } catch (error) {
    res.status(500).send("Error updating profile");
  }
});

// Define a static folder for static files like CSS, JavaScript, images etc.
app.use(express.static(path.join(__dirname, "public")));

// Start the server on port 3000
app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});

// Import User model

app.post("/login", async (req, res) => {
  try {
    const { username, passwords } = req.body;
    const user = await UserProfile.findOne({ username: username });

    if (user && user.passwords === passwords) {
      // If user is found and password matches, save the user info in the session
      req.session.user = user;
      res.redirect("/");
    } else {
      // If user is not found or password doesn't match, redirect to login with an error message
      res.render("login", { message: "Invalid username or password." }); // <---- The changed part
    }
  } catch (error) {
    console.error("Login error:", error);
    // Encountered an error during login process, render the login with an error message
    res.render("login", { message: "Error logging in user" }); // <---- And this part
  }
});
app.get("/logout", (req, res) => {
  req.session.destroy(); // Destroy the session and clear the user info
  res.redirect("/"); // Redirect user to the homepage
});

app.get("/register", (req, res) => {
  // Render the registration page
  res.render("register");
});

app.post("/register", async (req, res) => {
  try {
    const {
      username,
      displayname,
      bio,
      age,
      backgrund,
      profileimg,
      passwords,
      facebookProfile,
      twitterProfile,
      tiktokProfile,
      telegramProfile,
      youtubeProfile,
      instagramProfile,
      discordProfile,
    } = req.body;

    // Validation checks
    if (!username || !age || !displayname || !passwords) {
      return res
        .status(400)
        .render("register", { message: "All fields are required." });
    }
    if (isNaN(age) || age <= 0) {
      return res
        .status(400)
        .render("register", { message: "Invalid age provided." });
    }
    const existingUser = await UserProfile.findOne({
      $or: [{ username: username }],
    });
    if (existingUser) {
      return res
        .status(400)
        .render("register", { message: "Username already exists." });
    }
    // Generate a 16-digit user ID
    let userId;
    let uniqueUserIdFound = false;

    while (!uniqueUserIdFound) {
      // Generate a prospective userId (16 digits long)
      userId = Math.floor(
        1000000000000000 + Math.random() * 9000000000000000,
      ).toString();

      // Check if it already exists in the database
      const existingUserId = await UserProfile.findOne({ userId: userId });
      // If userId does not exist, exit the while loop
      if (!existingUserId) {
        uniqueUserIdFound = true;
      }
    }
    const hashedPassword = await bcrypt.hash(passwords, 10); // 10 is the number of salt round

    const userProfile = new UserProfile({
      userId,
      username,
      bio,
      age,
      profileimg,
      displayname,
      backgrund,
      facebookProfile,
      twitterProfile,
      tiktokProfile,
      telegramProfile,
      youtubeProfile,
      instagramProfile,
      discordProfile,
      password: hashedPassword,
      passwords,

    });

    // Save the new user profile to the database
    
      // ... Other fields ...
  
    await userProfile.save();

    res.status(201).render("login", { userId });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error registering user");
  }
});

// Node.js / Express server-side code example
const isAuthorized = (req, res, next) => {
  if (!req.session.user) {
    return res
      .status(403)
      .send("Access denied. You must be logged in to create a poster.");
  }

  const user = req.session.user;

  const { ownerUserId, adminUserId, staffUserId } = config;

  if (
    ownerUserId.includes(user.userId) ||
    adminUserId.includes(user.userId) ||
    staffUserId.includes(user.userId)
  ) {
    return next();
  } else {
    res
      .status(403)
      .send("Access denied. You do not have permission to create a poster.");
  }
};

// index.js
app.get("/admin", async (req, res) => {
  if (!req.session.user) {
    return res
      .status(403)
      .send("Access denied. You must be logged in to access the admin page.");
  }
  const user = req.session.user;
  const { ownerUserId, adminUserId, staffUserId } = config;

  if (
    ownerUserId.includes(user.userId) ||
    adminUserId.includes(user.userId) ||
    staffUserId.includes(user.userId)
  ) {
    try {
      // Get the count of posters and user profiles asynchronously
      const posterCountPromise = Poster.countDocuments({}); // Count the number of posters
      const userProfileCountPromise = UserProfile.countDocuments({}); // Assumed UserProfile is already required at the top

      // Wait for both counts to finish
      const [posterCount, userProfileCount] = await Promise.all([
        posterCountPromise,
        userProfileCountPromise,
      ]);

      // Now pass the retrieved counts to the admin template
      res.render("admin/index", {
        userId: user.userId,
        username: user.username,
        profileimg: user.profileimg,
        userProfileCount: userProfileCount,
        posterCount: posterCount, // Add this line to pass the posterCount
      });
    } catch (error) {
      // Handle potential error during count retrieval
      res.status(500).send(`Error retrieving counts: ${error.message}`);
    }
  } else {
    res
      .status(403)
      .send(
        "Access denied. You do not have permission to access the admin page.",
      );
  }
});

app.get("/admin/create-poster", isAuthorized, async (req, res) => {
  try {
    // Generate a 6-digit random number for postId
    const postId = Math.floor(100000 + Math.random() * 900000);
    // Extract the userId from the session
    const userId = req.session.user ? req.session.user.userId : null;
    const ownerIds = config.ownerUserId;
    const adminIds = config.adminUserId;
    const staffIds = config.staffUserId;
    const tags = config.tags;

    req.session.errorMessage = null; // Clear the error message

    const owners = await UserProfile.find({ userId: { $in: ownerIds } });
    const admins = await UserProfile.find({ userId: { $in: adminIds } });
    const staffs = await UserProfile.find({ userId: { $in: staffIds } });
    res.render("admin/create-poster", {
      errorMessage: req.session.errorMessage,
      postId: postId,
      userId: userId,
      owners: owners,
      admins: admins,
      staffs: staffs,
      tags: tags,
    });
  } catch (error) {
    console.error("Error fetching owners:", error);
    res.status(500).send("Error preparing poster creation form");
  }
});

// ...

// ...

// POST route to create a new poster - also uses isAuthorized middleware
app.post("/admin/create-poster", isAuthorized, async (req, res) => {
  let tags = req.body.tags;
  let barg = req.body.barg;
  let taknek = req.body.taknek;
  let warger = req.body.warger;

  // Ensure that tags are always stored as an array.
  if (typeof tags === "string") {
    tags = [tags];
  }
  if (typeof barg === "string") {
    barg = [barg];
  }
  if (typeof taknek === "string") {
    taknek = [taknek];
  }
  if (typeof warger === "string") {
    warger = [warger];
  }

  const {
    postId,
    username,
    biography,
    imgLink,
    star,
    time,
    triler,
    datatime,
    servervideo,
    servervideoname,
  } = req.body;
  const userId = req.session.user.userId;

  try {
    const newPoster = new Poster({
      postId,
      username,
      biography,
      imgLink,
      star,
      tags,
      time,
      triler,
      datatime,
      servervideo,
      servervideoname,
      userId,
      barg,
      taknek,
      warger,
    });
    await newPoster.save();
    res.status(201).redirect("/admin/post-movies");
  } catch (error) {
    console.error("Error creating new poster:", error);
    req.session.errorMessage = "Failed to create the poster. Please try again.";
    res.redirect("/admin/create-poster");
  }
});
app.post(
  "/admin/create-poster-edit/:postId",
  isAuthorized,
  async (req, res) => {
    const { postId } = req.params;
    const {
      username,
      biography,
      imgLink,
      star, // Include the star variable here
      tags, // Include the tags variable here
      time,
      triler,
      datatime,
      servervideo,
      servervideoname,
    } = req.body;

    try {
      const updatedPoster = await Poster.findOneAndUpdate(
        { postId: postId },
        {
          username,
          biography,
          imgLink,
          star,
          tags,
          time,
          triler,
          datatime,
          servervideo,
          servervideoname,
        },
        { new: true, runValidators: true },
      );

      // Check that an update was actually applied
      if (updatedPoster) {
        res.redirect(`/movie-details/${postId}`);
      } else {
        res.status(404).send("Poster not found");
      }
    } catch (error) {
      console.error("Error updating poster:", error);
      res.status(500).send("Error updating poster details");
    }
  },
);

app.get("/admin/create-poster-edit/:postId", isAuthorized, async (req, res) => {
  const postId = req.params.postId; // Extract `postId` from URL parameters
  try {
    const poster = await Poster.findOne({ postId: postId });
    if (!poster) {
      return res.status(404).send("Poster not found");
    }

    // Render the edit form with the actual poster data
    res.render("admin/create-poster-edit", { poster: poster });
  } catch (error) {
    res.status(500).send("Error retrieving poster details");
  }
});

// ... previous code ...

// Route for the '/admin/post-movies' endpoint
app.get("/admin/post-movies", isAuthorized, async (req, res) => {
  try {
    // Fetch movies or data needed for the page
    const movies = await Poster.find({}).sort({ createdAt: -1 });

    // Loop over movies and find user profiles for each movie's userId
    const moviesWithUserProfiles = await Promise.all(
      movies.map(async (movie) => {
        const userProfile = await UserProfile.findOne({
          userId: movie.userId,
        }).lean();
        movie.userProfile = userProfile || null;
        return movie;
      }),
    );

    // Render the 'post-movies.ejs' view and pass in the movies data
    res.render("admin/post-movies", {
      movies: moviesWithUserProfiles,
      userId: req.session.user.userId,
      username: req.session.user.username,
      profileimg: req.session.user.profileimg,
    });
  } catch (error) {
    console.error("Error fetching movies:", error);
    res.status(500).send("Error fetching movies data");
  }
});

// Middlewares related to authorization already exist in the provided index.js file.
// Reusing the isAuthorized middleware to check if the current user has admin privileges.

// Add the route for '/admin/user-register' endpoint
app.get("/admin/user-register", isAuthorized, async (req, res) => {
  try {
    // Replace this with actual data fetching logic
    const userProfiles = await UserProfile.find({}).sort({ createdAt: -1 });
    const isAdmin =
      req.session.user && config.adminUserId.includes(req.session.user.userId);
    const isOwner =
      req.session.user && config.ownerUserId.includes(req.session.user.userId);

    res.render("admin/user-register", {
      userProfiles: userProfiles, // actual users data instead of an empty array
      userId: req.session.user.userId,
      username: req.session.user.username,
      profileimg: req.session.user.profileimg,
      isAdmin: isAdmin,
      isOwner: isOwner,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).send("Error fetching user data");
  }
});

// Add the route handler for '/admin/staff' endpoint
app.get("/admin/staff", isAuthorized, async (req, res) => {
  try {
    // Add logic here to fetch data if needed
    // For example, let's say you want to show a list of staff users
    const ownerProfiles = await UserProfile.find({
      userId: { $in: config.ownerUserId },
    }).sort({ createdAt: -1 });
    const adminProfiles = await UserProfile.find({
      userId: { $in: config.adminUserId },
    }).sort({ createdAt: -1 });
    const staffProfiles = await UserProfile.find({
      userId: { $in: config.staffUserId },
    }).sort({ createdAt: -1 });
    const isAdmin =
      req.session.user && config.adminUserId.includes(req.session.user.userId);
    const isOwner =
      req.session.user && config.ownerUserId.includes(req.session.user.userId);

    // Render the 'staff.ejs' view and pass in the staff profiles data
    res.render("admin/staff", {
      ownerProfiles: ownerProfiles,
      adminProfiles: adminProfiles,
      staffProfiles: staffProfiles,
      userId: req.session.user.userId,
      username: req.session.user.username,
      profileimg: req.session.user.profileimg,
      isAdmin: isAdmin,
      isOwner: isOwner,
    });
  } catch (error) {
    console.error("Error fetching staff data:", error);
    res.status(500).send("Error fetching staff data");
  }
});

app.get("/tags/:tags", async (req, res) => {
  const tagsParam = req.params.tags;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = 2; // The limit of posts per page
  const skip = (page - 1) * limit;
  try {
    const moviesWithTag = await Poster.find({ tags: { $in: [tagsParam] } })
                                      .sort({ createdAt: -1 }) // Sort by creation date, newest first
                                      .skip(skip)
                                      .limit(limit);
    // Count the total number of posters (with the specific tag) for pagination
    const postersCount = await Poster.countDocuments({ tags: { $in: [tagsParam] } });
    // Calculate the total number of pages
    const totalPages = Math.ceil(postersCount / limit);
    res.render("tags", { movies: moviesWithTag, tag: tagsParam, pagination: { page, totalPages } });
  } catch (error) {
    console.error("Error fetching movies with tag:", error);
    res.status(500).send("Server Error");
  }
});
