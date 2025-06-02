import express from "express";
import {
  createGuest,
  getAllGuests,
  getGuestById,
  updateGuest,
  deleteGuest,
} from "../controllers/guestController";

const router = express.Router();

router.route("/").post(createGuest).get(getAllGuests);

router.route("/:id").get(getGuestById).put(updateGuest).delete(deleteGuest);

export default router;
