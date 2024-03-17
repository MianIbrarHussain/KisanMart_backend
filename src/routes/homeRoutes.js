const express = require("express");
const { UserData, ChatData, ProductsData } = require("../schemes");
const paramsCheck = require("../components/helperFunctions");
const { upload } = require("../components/Upload");
const Router = express.Router();

Router.post("/createChatRoom", async (req, res) => {
  try {
    let check = paramsCheck(["userID", "recipientID"], req.body);
    if (check === true) {
      const existingChat1 = await ChatData.findOne({
        recipients: { $all: [req.body.userID, req.body.recipientID] },
      });
      const existingChat2 = await ChatData.findOne({
        recipients: { $all: [req.body.recipientID, req.body.userID] },
      });
      if (existingChat1 || existingChat2) {
        res.status(201).json({
          chatID: existingChat1._id || existingChat2._id,
          success: true,
        });
      } else {
        const chat = await ChatData.create({
          recipients: [req.body.userID, req.body.recipientID],
          Messages: [],
          lastInChat: {
            [`${req.body.userID}`]: new Date(),
            [`${req.body.recipientID}`]: new Date(),
          },
        });
        if (chat) {
          res.status(200).json({
            chatID: chat._id,
            success: true,
          });
        }
      }
    } else return res.status(400).send(check);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error!");
  }
});

Router.post("/addProduct", upload.array("productImages"), async (req, res) => {
  try {
    let check = paramsCheck(
      [
        "productName",
        "unit",
        "pricePerUnit",
        "region",
        "description",
        "terms",
        "supplierID",
        "Category",
      ],
      req.body
    );
    if (check === true) {
      if (!req.files) {
        return res.status(400).send("Product Picture is required");
      } else {
        const product = await ProductsData.create({
          ...req.body,
          terms: req.body.terms,
          productImages: req.files.map((k) => {
            return k.filename;
          }),
        });
        if (product) {
          return res.status(200).send({
            success: true,
            msg: "Product Uploaded Successfully...",
          });
        }
      }
    } else return res.status(400).send(check);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error!");
  }
});

const productsList = (k) => {
  return {
    productID: k._id,
    productName: k.productName,
    unit: k.unit,
    pricePerUnit: k.pricePerUnit,
    productImage: k.productImages[0],
  };
};

Router.get("/getProducts", async (req, res) => {
  try {
    if (req.query.isSeller == "true") {
      let myProducts;
      if (req.query.filter == "ALL") {
        myProducts = await ProductsData.find({
          supplierID: req.query.userID,
        });
      } else if (req.query.filter === "") {
        myProducts = await ProductsData.find({
          supplierID: req.query.userID,
        });
      } else {
        myProducts = await ProductsData.find({
          supplierID: req.query.userID,
          Category: req.query.filter,
        });
      }
      myProducts = await myProducts.map(productsList);
      res.status(200).json({
        success: true,
        myProducts: myProducts,
      });
    } else {
      let othersProducts;
      if (req.query.filter === "") {
        othersProducts = await ProductsData.find();
        othersProducts = await othersProducts.filter(
          (f) => f.supplierID !== req.query.userID
        );
        let exportQuality = await othersProducts
          .filter((f) => f.quality == true)
          .filter((f) => f.Category !== "FRUITS_OR_VEGETABLES")
          .map(productsList);
        let topSelling = await othersProducts
          .filter((f) => f.quality == false)
          .filter((f) => f.Category !== "FRUITS_OR_VEGETABLES")
          .map(productsList);
        let fruitsVeges = await othersProducts
          .filter((f) => f.Category == "FRUITS_OR_VEGETABLES")
          .map(productsList);
        res.status(200).json({
          success: true,
          exportQuality: exportQuality,
          topSelling: topSelling,
          fruitsVeges: fruitsVeges,
        });
      } else if (req.query.filter === "ALL") {
        othersProducts = await ProductsData.find();
        othersProducts = await othersProducts
          .filter((f) => f.supplierID !== req.query.userID)
          .map(productsList);
        res.status(200).json({
          success: true,
          othersProducts: othersProducts,
        });
      } else {
        othersProducts = await ProductsData.find({
          Category: req.query.filter,
        });
        othersProducts = await othersProducts
          .filter((f) => f.supplierID !== req.query.userID)
          .map(productsList);
        res.status(200).json({
          success: true,
          othersProducts: othersProducts,
        });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error!");
  }
});

Router.get("/getProductDetails/:productID", async (req, res) => {
  try {
    const productID = req.params.productID;
    let productData = await ProductsData.findById(productID);
    let supplierData = await UserData.findById(productData.supplierID);
    res.status(200).send({
      success: true,
      data: {
        productDetails: {
          productName: productData.productName,
          unit: productData.unit,
          pricePerUnit: productData.pricePerUnit,
          productImages: productData.productImages,
          description: productData.description,
          terms: productData.terms,
          Category: productData.Category,
          region: productData.region,
        },
        supplierDetails: {
          profilePicture: supplierData.profilePicture,
          name: supplierData.name,
          phone: supplierData.phone,
          whatsapp: supplierData.whatsapp,
          supplierID: supplierData._id,
          city: supplierData.city,
        },
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error!");
  }
});

Router.post("/getSupplierProducts", async (req, res) => {
  try {
    let check = paramsCheck(["chatID", "userID"], req.body);
    if (check === true) {
      let chat = await ChatData.findById(req.body.chatID);

      let productData = await ProductsData.find({
        supplierID:
          chat.recipients[0] == req.body.userID
            ? chat.recipients[1]
            : chat.recipients[0],
      });
      res.status(200).send({
        success: true,
        supplilerProducts: productData.map((k) => {
          return {
            productName: k.productName,
            unit: k.unit,
            pricePerUnit: k.pricePerUnit,
            description: k.description,
            productImages: k.productImages[0],
            productID: k._id,
          };
        }),
      });
    } else return res.status(400).send(check);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error!");
  }
});

Router.delete("/DeleteProduct/:productID", async (req, res) => {
  try {
    const productID = req.params.productID;
    const product = await ProductsData.findByIdAndDelete(productID);
    if (product) {
      return res.status(200).send({
        success: true,
        message: "Product has been deleted...",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error!");
  }
});

module.exports = Router;
