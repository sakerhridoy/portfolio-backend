import express from "express";
import {
  getPublicProducts,
  getPublicProduct,
  freeDownload,
  updateBkash,
  createOrder,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrders,
  updateOrderStatus
} from "./digitalProduct.controller.js";
import { protect } from "../../middleware/auth.js";

const router = express.Router();

router.get("/public", getPublicProducts);
router.get("/public/:id", getPublicProduct);
router.post('/free-download', freeDownload);
router.post('/free-download/:productId', freeDownload);
router.post('/order', createOrder);
router.post('/order/:productId', createOrder);

// Admin
router.use(protect);
router.patch("/bkash", updateBkash);
router.route("/").get(getAllProducts).post(createProduct);
router.route("/:id").put(updateProduct).delete(deleteProduct);
router.route("/orders").get(getOrders);
router.route("/orders/:id/status").patch(updateOrderStatus);

export default router;
