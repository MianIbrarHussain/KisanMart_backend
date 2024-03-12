const express = require("express");
const { UserData } = require("../schemes");
const paramsCheck = require("../components/helperFunctions");
const { upload } = require("../components/Upload");
const Router = express.Router();

Router.post("/userRegistration", async (req, res) => {
  try {
    let check = paramsCheck(["email", "password"], req.body);
    if (check === true) {
      const userData = await UserData.create({
        ...req.body,
        isVerified: false,
      });
      return res.status(200).json({
        msg: "ALL GOOD....",
        userID: userData._id,
        success: true,
      });
    } else return res.status(400).send(check);
  } catch (error) {
    console.log(error);
    if (error.code === 11000) {
      return res.status(400).json({
        msg: "Email already registered...",
        success: false,
      });
    }
    console.log(error);
    return res.status(500).send("Internal Server Error!");
  }
});

Router.post(
  "/userVerification",
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      let check = paramsCheck(
        ["name", "phone", "whatsapp", "city", "cnic", "userID"],
        req.body
      );
      if (check === true) {
        if (!req.file) {
          return res.status(400).send("Profile Picture is required");
        } else {
          let checkCNIC = await UserData.find({ cnic: req.body.cnic });
          if (checkCNIC.length == 0) {
            let user = await UserData.findByIdAndUpdate(req.body.userID, {
              isVerified: true,
              profilePicture: req.file.filename,
              ...req.body,
            });
            if (user) {
              return res.status(200).json({
                data: {
                  userID: user._id,
                  isVerified: true,
                  name: req.body.name,
                  phone: req.body.phone,
                  whatsapp: req.body.whatsapp,
                  city: req.body.city,
                  profilePicture: req.body.profilePicture,
                  cnic: req.body.cnic,
                  email: req.body.email,
                },
                success: true,
              });
            }
          } else
            res.status(400).send({
              msg: "CNIC already registered...",
              success: false,
            });
        }
      } else return res.status(400).send(check);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          msg: "Already Verified...",
          success: false,
        });
      }
      console.log(error);
      return res.status(500).send("Internal Server Error!");
    }
  }
);

Router.post("/login", async (req, res) => {
  try {
    let check = paramsCheck(["email", "password"], req.body);
    if (check === true) {
      let user = await UserData.find({
        email: req.body.email,
      });
      if (user.length === 0) {
        return res.status(400).json({
          isRegistered: false,
        });
      } else {
        if (user[0].password === req.body.password) {
          return res.status(200).json({
            success: true,
            data: {
              userID: user[0]._id,
              isVerified: user[0].isVerified,
              name: user[0].name,
              phone: user[0].phone,
              whatsapp: user[0].whatsapp,
              city: user[0].city,
              profilePicture: user[0].profilePicture,
              cnic: user[0].cnic,
              email: user[0].email,
            },
          });
        } else
          return res.status(400).json({
            msg: "Password incorrect...",
          });
      }
    } else return res.status(400).send(check);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error!");
  }
});

module.exports = Router;
