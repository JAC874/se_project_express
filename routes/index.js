const router = require("express").Router();
const userRouter = require("./users");
const clothingItemRouter = require("./clothingItems");
const { createUser, login } = require("../controllers/users");
const auth = require("../middlewares/auth");
const {
  validateUserLogIn,
  validateuserInfoBody,
} = require("../middlewares/validation");
const NotFoundError = require("../errors/not-found-err");

router.use("/items", clothingItemRouter);
router.use("/users", auth, userRouter);
router.post("/signin", validateUserLogIn, login);
router.post("/signup", validateuserInfoBody, createUser);

router.use("*", (req, res, next) => {
  next(new NotFoundError("Route not found"));
});

module.exports = router;
