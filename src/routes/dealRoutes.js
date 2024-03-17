const express = require("express");
const { UserData, ProductsData, DealsData } = require("../schemes");
const paramsCheck = require("../components/helperFunctions");
const Router = express.Router();

Router.post("/createNewOffer", async (req, res) => {
  try {
    let check = paramsCheck(
      [
        "buyerID",
        "requiredQuantity",
        "offeredPrice",
        "productID",
        "terms",
        "estimatedDate",
      ],
      req.body
    );

    if (check === true) {
      let product = await ProductsData.findById(req.body.productID);
      const deal = await DealsData.create({
        sellerID: product.supplierID,
        buyerID: req.body.buyerID,
        requiredQuantity: req.body.requiredQuantity,
        offeredPrice: req.body.offeredPrice,
        productID: req.body.productID,
        terms: req.body.terms,
        estimatedDate: req.body.estimatedDate,
        status: 0,
      });
      res.status(200).send({
        success: true,
        dealID: deal._id,
      });
    } else return res.status(400).send(check);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error!");
  }
});

Router.get("/getDealDetails/:offerID/:userID", async (req, res) => {
  try {
    const offerID = req.params.offerID;
    const userID = req.params.userID;
    let offerData = await DealsData.findById(offerID);
    const user =
      offerData.sellerID === userID ? offerData.buyerID : offerData.sellerID;
    let userData = await UserData.findById(user);
    let productData = await ProductsData.findById(offerData.productID);
    if (productData) {
      return res.status(200).send({
        success: true,
        data: {
          product: {
            productName: productData.productName,
            productImages: productData.productImages,
            description: productData.description,
          },
          user: {
            profilePicture: userData.profilePicture,
            name: userData.name,
            phone: userData.phone,
            whatsapp: userData.whatsapp,
            city: userData.city,
            isSeller: offerData.sellerID === userID ? false : true,
          },
          offer: {
            requiredQuantity: offerData.requiredQuantity,
            offeredPrice: offerData.offeredPrice,
            terms: offerData.terms,
            estimatedDate: offerData.estimatedDate,
            status: offerData.status,
            offerID: offerData._id,
          },
        },
      });
    } else {
      return res.status(200).send({
        success: true,
        data: {
          product: {
            productName: "User may have deleted this product",
            productImages: [],
            description: "N/A",
          },
          user: {
            profilePicture: userData.profilePicture,
            name: userData.name,
            phone: userData.phone,
            whatsapp: userData.whatsapp,
            city: userData.city,
            isSeller: offerData.sellerID === userID ? false : true,
          },
          offer: {
            requiredQuantity: offerData.requiredQuantity,
            offeredPrice: offerData.offeredPrice,
            terms: offerData.terms,
            estimatedDate: offerData.estimatedDate,
            status: offerData.status,
            offerID: offerData._id,
          },
        },
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error!");
  }
});

Router.get("/getMyDeals/:userID", async (req, res) => {
  try {
    const userID = req.params.userID;
    let deals = await DealsData.find({
      $or: [{ buyerID: userID }, { sellerID: userID }],
    });
    if (deals)
      res.status(200).send({
        success: true,
        data: deals.map((k) => {
          return { offerID: k._id, status: k.status };
        }),
      });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error!");
  }
});

Router.put("/changeDealStaus/:offerID/:userID/:userID", async (req, res) => {
  try {
    const offerID = req.params.offerID;
    const userID = req.params.userID;
    const status = req.params.userID;
    let offerData = await DealsData.findByIdAndUpdate(offerID, {
      status: status,
    });
    let productData = await ProductsData.findById(offerData.productID);
    const user =
      offerData.sellerID === userID ? offerData.buyerID : offerData.sellerID;
    let userData = await UserData.findById(user);
    res.status(200).send({
      success: true,
      data: {
        product: {
          productName: productData.productName,
          productImages: productData.productImages,
          description: productData.description,
        },
        user: {
          profilePicture: userData.profilePicture,
          name: userData.name,
          phone: userData.phone,
          whatsapp: userData.whatsapp,
          city: userData.city,
          isSeller: offerData.sellerID === userID ? false : true,
        },
        offer: {
          requiredQuantity: offerData.requiredQuantity,
          offeredPrice: offerData.offeredPrice,
          terms: offerData.terms,
          estimatedDate: offerData.estimatedDate,
          status: offerData.status,
          offerID: offerData._id,
        },
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error!");
  }
});

module.exports = Router;
