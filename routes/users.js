const router = require("express").Router();
const { getCurrentUser, updateUser } = require("../controllers/users");
const auth = require("../middlewares/auth");
const { validateUserUpdate } = require("../middlewares/validation");

router.patch("/me", auth, validateUserUpdate, updateUser);
router.get("/me", auth, getCurrentUser);

module.exports = router;
