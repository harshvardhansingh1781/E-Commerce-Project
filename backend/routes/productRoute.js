const express = require("express");
const {
  getAllProducts,
  creatProduct,
  updateProduct,
  deleteProduct,
  getProductsDetails,
  createProductReview,
  getProductReview,
  deleteReview,
} = require("../controllers/productController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

router.route("/products").get(getAllProducts);
router
  .route("/admin/products/new")
  .post(isAuthenticatedUser, authorizeRoles("admin"), creatProduct);

router
  .route("/admin/products/:id")
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateProduct)
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteProduct);

router.route("/products/:id").get(getProductsDetails);

router.route("/review").put(isAuthenticatedUser, createProductReview);

router
  .route("/reviews")
  .get(getProductReview)
  .delete(isAuthenticatedUser, deleteReview);
module.exports = router;
