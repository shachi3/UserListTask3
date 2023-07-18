const PDFDocument = require('pdfkit');
const fs = require('fs');
const QRCode = require('qr-image');
var express = require("express");
const passport = require("passport");
var router = express.Router();

var userModel = require("./users");
const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get("/", function(req, res) {
    res.render("index");
});

router.post("/register", function(req, res) {
    var userDetails = new userModel({
        name: req.body.name,
        username: req.body.username,
        email: req.body.email
    });
    userModel.register(userDetails, req.body.password).then(function() {
        passport.authenticate("local")(req, res, function() {
            res.redirect("/read");
        });
    });
});
router.get(
    "/login",
    passport.authenticate("local", {
        successRedirect: "/readpg",
        failureRedirect: "/loginpg",
    }),
    function(req, res) {}
);





router.get("/readpg", function(req, res) {
    userModel.find({}).then(function(data) {
        res.render("read", { data: data });
    });

});

router.get("/loginpg", function(req, res) {
    res.render("login");
});

router.post("/logout", function(req, res) {
    req.logOut(function(err) {
        if (err) {
            return next(err);
        }
        res.redirect("/");
    });
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}

router.get("/read", isLoggedIn, function(req, res) {
    userModel.find().then(function(data) {
        res.render("read", { data: data });
    });
});
router.get("/edit/:aidi", isLoggedIn, function(req, res) {
    userModel.findOne({ _id: req.params.aidi }).then(function(data) {
        res.render("update", { data: data });
    });
});

router.post("/update/:aidi", isLoggedIn, function(req, res) {
    userModel
        .findOneAndUpdate({ _id: req.params.aidi }, {
            name: req.body.name,
        })
        .then(function(data) {
            data.save()
            res.redirect("/read");
        });
});

router.get("/dlt/:aidi", isLoggedIn, function(req, res) {
    userModel.findOneAndDelete({ _id: req.params.aidi }).then(function(data) {
        res.redirect("/read");
    });
});

// for all user details
router.get('/export/pdf', async(req, res) => {
    try {
        const data = await userModel.find();
        if (data.length === 0) {
            return res.status(404).json({ error: 'No data found' });
        }

        const doc = new PDFDocument();
        doc.pipe(res);

        data.forEach(item => {
            doc.text(`Name: ${item.name}`);
            doc.text(`Email: ${item.email}`);
            doc.text(`username: ${item.username}`);
            doc.moveDown();
        });

        doc.end();
        console.log('PDF file created successfully');
    } catch (err) {
        console.error('Failed to fetch data from MongoDB', err);
        res.status(500).json({ error: 'Failed to fetch data from MongoDB' });
    }
});


router.get('/export/pdf/:aidi', async(req, res) => {
    try {
        const userId = req.params.aidi;
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const doc = new PDFDocument();
        doc.pipe(res);

        Object.entries(user.toObject()).forEach(([key, value]) => {
            doc.text(`${key}: ${value}`);
        });

        doc.end();
        console.log('PDF file created successfully');
    } catch (err) {
        console.error('Failed to fetch user details from MongoDB', err);
        res.status(500).json({ error: 'Failed to fetch user details from MongoDB' });
    }
});



// qr code
router.get('/generate-qr/:email', async(req, res) => {
    try {
        // const email = req.params.email;
        const user = await userModel.findOne({ email: req.params.email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const qrCode = QRCode.image(user.email, { type: 'png' });
        res.type('png');
        qrCode.pipe(res);
    } catch (err) {
        console.error('Failed to fetch user details from MongoDB', err);
        res.status(500).json({ error: 'Failed to fetch user details from MongoDB' });
    }
});

module.exports = router;