const mongo = require("mongoose");

const UserRegistration = mongo.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isVerified: {
    type: Boolean,
    required: true,
  },
  name: {
    type: String,
    required: false,
  },
  phone: {
    type: String,
    required: false,
  },
  whatsapp: {
    type: String,
    required: false,
  },
  city: {
    type: String,
    required: false,
  },
  profilePicture: {
    type: String,
    required: false,
  },
  cnic: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
});

const Chats = mongo.Schema(
  {
    recipients: [String],
    Messages: [
      {
        sender: String,
        isOffer: Boolean,
        message: String,
        offerID: String,
        timestamp: Date,
      },
    ],
  },
  { timestamps: true }
);

const Products = mongo.Schema({
  productName: {
    type: String,
    required: true,
  },
  unit: {
    type: String,
    required: true,
  },
  pricePerUnit: {
    type: String,
    required: true,
  },
  region: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  terms: {
    type: String,
    required: true,
  },
  supplierID: {
    type: String,
    required: true,
  },
  quality: {
    type: Boolean,
    required: true,
  },
  offersMade: {
    type: Number,
    required: false,
    default: 0,
  },
  Category: {
    type: String,
    required: true,
  },
  productImages: [String],
});

const Deals = mongo.Schema({
  sellerID: {
    type: String,
    required: true,
  },
  buyerID: {
    type: String,
    required: true,
  },
  requiredQuantity: {
    type: String,
    required: true,
  },
  offeredPrice: {
    type: String,
    required: true,
  },
  productID: {
    type: String,
    required: true,
  },
  terms: {
    type: String,
    required: true,
  },
  estimatedDate: {
    type: String,
    required: true,
  },
  status: {
    type: Number,
    required: true,
  },
});

const UserData = mongo.model("USERDATA", UserRegistration);
const ChatData = mongo.model("CHATDATA", Chats);
const ProductsData = mongo.model("PRODUCTSDATA", Products);
const DealsData = mongo.model("DEALSDATA", Deals);

module.exports = { UserData, ChatData, ProductsData, DealsData };
