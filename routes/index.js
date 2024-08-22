const router = require("express").Router();
const userRouter = require("./users");
const clothingItemRouter = require("./clothingItems");
const { ERROR_CODES, ERROR_MESSAGES } = require("../utils/errors");
const { createUser, login } = require("../controllers/users");
const auth = require("../middlewares/auth");

router.use("/users", auth, userRouter);
router.use("/items", auth, clothingItemRouter);
router.post("/signin", login);
router.post("/signup", createUser);

router.use((req, res) => {
  res.status(ERROR_CODES.NOT_FOUND).send({ message: ERROR_MESSAGES.NOT_FOUND });
});

module.exports = router;
