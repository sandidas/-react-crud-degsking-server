const express = require("express");
const cors = require("cors"); // cors middleware
require("dotenv").config(); // to reason of security
const cloudinary = require("cloudinary").v2;
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb"); // Mongo DB
const app = express();
const port = process.env.PORT || 5000; // call port where run the server
// middleware
app.use(cors());
// app.use(express.json());
app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ limit: "50mb" }));
// app.use(express.urlencoded({ extended: true })); //
//
//
// get link by uri
// const uri = "mongodb://localhost:27017";

const uri = `mongodb+srv://kingsdev:3wkPBxht1d2m0HEa@cluster0.vllpwyl.mongodb.net/?retryWrites=true&w=majority`;
// call mongo db client
const client = new MongoClient(uri);

async function dbConnect() {
  try {
    // db and collection name
    await client.connect();
  } catch (error) {
    console.log(error);
  }
}
// call to connect with db
dbConnect();
//
//
// call multiple collection which you want to use
const usersCollection = client.db("devsking-assignment").collection("users");
const serviceCollection = client.db("devsking-assignment").collection("services");
const reviewsCollection = client.db("devsking-assignment").collection("reviews");

const logCollection = client.db("devsking-assignment").collection("log");
//
//
//
// Cloudinary API config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});
//
//
//
//
//
//
//
// crate JWT (Jeson Web Token) and send it to client
app.post("/jwt", async (req, res) => {
  try {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "2d" });

    if (token) {
      return res.send({
        success: true,
        token: token,
        message: "Successfully token generated",
      });
    } else {
      // fail post data
      return res.send({
        success: false,
        message: "Token generate fail!",
      });
    }
  } catch (error) {}
});
//
//
// Verify JWT
const verifyJWT = (req, res, next) => {
  // console.log(req.headers.authorization);
  const { authorization } = req.headers;
  // console.log(authorization);

  if (!authorization) {
    return res.status(401).send({
      message: "Unauthorized Access",
      success: false,
      status: 401,
    });
  }
  const token = authorization.split(" ")[1]; // after split will get an array, after that we are taking array 1 key's value inside token variable.
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized Access",
        success: false,
        status: 401,
      });
    }
    req.decoded = decoded;
    next();
  });
};
//
//
// STORE SINGLE USER IN DB
//
// end point to post single user
app.post("/user", async (req, res) => {
  // check user exist or not in db by email
  const { email } = req.body;

  // if this user doesn't has any account, then create one

  try {
    const existingEmail = await usersCollection.findOne({ email: email });

    if (existingEmail) {
      return res.send({
        success: false,
        message: "This Email ID has an account",
      });
      return;
    }
    const result = await usersCollection.insertOne(req.body); // post data
    // console.log(result);
    // success post data
    if (result.insertedId) {
      return res.send({
        success: true,
        userId: result.insertedId,
        message: `Successfully data inserted with id ${result.insertedId}`,
      });
    } else {
      // fail post data
      return res.send({
        success: false,
        message: "Data insert fail!",
      });
    }
  } catch (error) {
    // fail post data
    console.log(error.message);
    return res.send({
      success: false,
      message: error.message,
    });
  }
});
//
//
//
// to verify authorization get current uaser information, becasue all uers doensont register by social

//
// SERVICE by pagination user
app.get("/services", verifyJWT, async (req, res) => {
  const currentPage = parseInt(req.query.page);
  const itemsPerPage = parseInt(req.query.size);
  const userId = req.query.uid;
  email: req.query.email;
  // req.query.email
  const query = {};

  try {
    const cursor = serviceCollection.find({ uid: req.query.uid }).sort({ _id: -1 });
    const services = await cursor
      .skip((currentPage - 1) * itemsPerPage)
      .limit(itemsPerPage)
      .toArray(); // post data
    // number of row count inside this collection
    const totalItems = await serviceCollection.countDocuments({ uid: req.query.uid });

    // success get data data
    return res.send({
      success: true,
      message: `Successfully data received`,
      data: { services, totalItems }, // send responce with quantity and data
    });
  } catch (error) {
    // fail post data
    console.log(error.message);
    return res.send({
      success: false,
      message: error.message,
    });
  }
});
//
//
//

//
// SERVICE by pagination user
app.get("/reviews", async (req, res) => {
  const currentPage = parseInt(req.query.page);
  const itemsPerPage = parseInt(req.query.size);
  const userId = req.query.uid;
  email: req.query.email;
  // req.query.email
  const query = {};

  try {
    const cursor = reviewsCollection.find({ uid: req.query.uid }).sort({ _id: -1 });
    const reviews = await cursor
      .skip((currentPage - 1) * itemsPerPage)
      .limit(itemsPerPage)
      .toArray(); // post data
    // number of row count inside this collection

    const totalItems = await reviewsCollection.countDocuments({ uid: req.query.uid });

    // success get data data
    return res.send({
      success: true,
      message: `Successfully data received`,
      data: { reviews, totalItems }, // send responce with quantity and data
    });
  } catch (error) {
    // fail post data
    console.log(error.message);
    return res.send({
      success: false,
      message: error.message,
    });
  }
});
//
// STORE SERVICE with FUN
//
app.post("/service", verifyJWT, async (req, res) => {
  const { thumbnail } = req.body;
  const uploadedThumbnail = await cloudinary.uploader.upload(thumbnail, { folder: "dev/devsking/services" });

  const photoUrl = uploadedThumbnail.secure_url;

  const service = req.body;
  service["thumbnail"] = photoUrl;
  // console.log(service);

  try {
    const result = await serviceCollection.insertOne(service); // post data

    // success post data
    if (result.insertedId) {
      return res.send({
        success: true,
        insertedId: result.insertedId,
        message: `Successfully data inserted with id ${result.insertedId}`,
      });
    } else {
      // fail post data
      return res.send({
        success: false,
        message: "Data insert fail!",
      });
    }
  } catch (error) {
    // fail post data
    return res.send({
      success: false,
      message: error.message,
    });
  }
});

//
//
// get by single service user
// WILL JWT ADD LATER AFTER UPDATE
app.get("/service/:id", verifyJWT, async (req, res) => {
  const { id } = req.params;
  try {
    const service = await serviceCollection.findOne({ _id: ObjectId(id) });
    if (service?._id) {
      return res.send({
        success: true,
        data: service,
        message: "Data found",
      });
    } else {
      return res.send({
        success: false,
        message: "Data not found! fetching...",
      });
    }
  } catch (error) {
    return res.send({
      success: false,
      error: error.message,
    });
  }
});
//
//
app.patch("/service/:id", async (req, res) => {
  const { id } = req.params;

  // cloudinary image service
  const { thumbnail } = req.body;
  const uploadedThumbnail = await cloudinary.uploader.upload(thumbnail, { folder: "dev/devsking/services" });
  // generate phot url from cloudinary
  const photoUrl = uploadedThumbnail.secure_url;

  const contet = req.body;
  contet["thumbnail"] = photoUrl;

  try {
    const service = await serviceCollection.updateOne({ _id: ObjectId(id) }, { $set: contet });
    console.log(service);

    if (service.matchedCount) {
      console.log("success");
      return res.send({
        success: true,
        data: service,
        message: `Successfully updated`,
      });
    } else {
      return res.send({
        success: false,
        error: "Update fail!",
      });
    }
  } catch (error) {
    return res.send({
      success: false,
      error: error.message,
    });
  }
});
//
//
// delete
app.delete("/service/:id", verifyJWT, async (req, res) => {
  const { id } = req.params;

  try {
    const search = await serviceCollection.findOne({ _id: ObjectId(id) });
    if (!search?._id) {
      return res.send({
        success: false,
        error: "Data doesn't exist",
      });
    }
    const result = await serviceCollection.deleteOne({ _id: ObjectId(id) });

    if (result.deletedCount) {
      return res.send({
        success: true,
        message: `Successfully deleted`,
      });
    } else {
    }
  } catch (error) {
    return res.send({
      success: false,
      error: error.message,
    });
  }
});
//
// store review for logged in user
app.post("/storereview", async (req, res) => {
  const review = req.body;
  const { serviceId, uid } = req.body;

  try {
    // get photo url from user collection
    const userInfo = await usersCollection.findOne({ uid: uid });
    console.log("user", userInfo);
    review["photoUrl"] = userInfo.photoURL;

    const result = await reviewsCollection.insertOne(review); // post data

    const service = await serviceCollection.findOne({ _id: ObjectId(serviceId) });

    if (!service.reviewsCount) {
      service["reviewsCount"] = 0;
      service["ratingsCount"] = 0;
      service["ratingsAverage"] = 0;
    }
    service["reviewsCount"] = service.reviewsCount + 1;
    service["ratingsCount"] = service.ratingsCount + review.rating;
    service["ratingsAverage"] = service.ratingsCount / service.reviewsCount;

    const ratingResult = await serviceCollection.updateOne({ _id: ObjectId(serviceId) }, { $set: service });

    if (result.insertedId && ratingResult.modifiedCount) {
      return res.send({
        success: true,
        insertedId: result.insertedId,
        message: "Successfully ratings submitted",
      });
    } else {
      // fail post data
      return res.send({
        success: false,
        message: "Fail to add!",
      });
    }
  } catch (error) {
    // fail post data
    return res.send({
      success: false,
      message: error.message,
    });
  }
});
//
//
// delete
app.delete("/review/:id", verifyJWT, async (req, res) => {
  const { id } = req.params;

  try {
    const search = await reviewsCollection.findOne({ _id: ObjectId(id) });
    if (!search?._id) {
      return res.send({
        success: false,
        error: "Data doesn't exist",
      });
    }
    const result = await reviewsCollection.deleteOne({ _id: ObjectId(id) });

    if (result.deletedCount) {
      return res.send({
        success: true,
        message: `Successfully deleted`,
      });
    } else {
    }
  } catch (error) {
    return res.send({
      success: false,
      error: error.message,
    });
  }
});
//
//
//
//

//
app.patch("/review/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const review = await reviewsCollection.updateOne({ _id: ObjectId(id) }, { $set: req.body });

    if (review.matchedCount) {
      console.log("success");
      return res.send({
        success: true,
        data: review,
        message: `Successfully updated`,
      });
    } else {
      return res.send({
        success: false,
        error: "Update fail!",
      });
    }
  } catch (error) {
    return res.send({
      success: false,
      error: error.message,
    });
  }
});
//
//
//
// Data form public API
app.get("/servicespublic", async (req, res) => {
  const currentPage = parseInt(req.query.page);
  const itemsPerPage = parseInt(req.query.size);

  try {
    const cursor = serviceCollection.find({}).sort({ _id: -1 });
    const services = await cursor
      .skip((currentPage - 1) * itemsPerPage)
      .limit(itemsPerPage)
      .toArray(); // post data
    // number of row count inside this collection
    const totalItems = await serviceCollection.countDocuments({});

    // success get data data
    return res.send({
      success: true,
      message: `Successfully data received`,
      data: { services, totalItems }, // send responce with quantity and data
    });
  } catch (error) {
    // fail post data
    console.log(error.message);
    return res.send({
      success: false,
      message: error.message,
    });
  }
});
//
//
// get by single service for public
app.get("/serviceandreview/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const service = await serviceCollection.findOne({ _id: ObjectId(id) });
    const cursor = reviewsCollection.find({ serviceId: id }).sort({ _id: -1 });
    const reviews = await cursor.toArray();

    if (service?._id) {
      return res.send({
        success: true,
        data: { service, reviews },
        message: "Data found",
      });
    } else {
      return res.send({
        success: false,
        message: "Data not found! fetching...",
      });
    }
  } catch (error) {
    return res.send({
      success: false,
      error: error.message,
    });
  }
});
// // |||||||||||||||| COMPLETED
//
//
//
app.post("/log", async (req, res) => {
  try {
    const result = await logCollection.insertOne(req.body); // post data
    // console.log(req.body);
    // success post data
    if (result.insertedId) {
      return res.send({
        success: true,
        userId: result.insertedId,
        message: `Successfully data inserted with id ${result.insertedId}`,
      });
    } else {
      // fail post data
      return res.send({
        success: false,
        message: "Data insert fail!",
      });
    }
  } catch (error) {
    // fail post data
    // console.log(error.message);
    return res.send({
      success: false,
      message: error.message,
    });
  }
});
//
// end point to get data
// end point to get all data
app.get("/users", async (req, res) => {
  try {
    const cursor = usersCollection.find({});
    const users = await cursor.toArray(); // post data
    // success get data data
    return res.send({
      success: true,
      message: `Successfully data received`,
      data: users,
    });
  } catch (error) {
    // fail post data
    // console.log(error.message);
    return res.send({
      success: false,
      message: error.message,
    });
  }
});
//
//
//
// users by pagination
// https://server-side-xi.vercel.app/userspagination?page=0&size=20
app.get("/userspagination", async (req, res) => {



  const currentPage = parseInt(req.query.page);
  const itemsPerPage = parseInt(req.query.size);
  // console.log(req.headers);
  // req.query.email
  const query = {};

  try {
    const cursor = usersCollection.find({}).sort({ _id: -1 });
    const users = await cursor
      .skip((currentPage - 1) * itemsPerPage)
      .limit(itemsPerPage)
      .toArray(); // post data
    // number of row count inside this collection
    const totalItems = await usersCollection.estimatedDocumentCount();
    // success get data data
    return res.send({
      success: true,
      message: `Successfully data received`,
      data: { users, totalItems }, // send responce with quantity and data
    });
  } catch (error) {
    // fail post data
    console.log(error.message);
    return res.send({
      success: false,
      message: error.message,
    });
  }
});
//
//
//
//
//
//
// get by query
// example: https://server-side-xi.vercel.app/user?email=${user.email}
// ?email=adfadf@gmail.com
app.get("/user", async (req, res) => {
  // console.log(req.query);
  let query = {};
  // this block for query parameter
  if (req.query.email) {
    query = {
      email: req.query.email, // field name
    };
  }
  try {
    const cursor = usersCollection.find(query);
    const users = await cursor.toArray(); // post data
    // success get data data
    return res.send({
      success: true,
      message: `Successfully data received`,
      data: users,
    });
  } catch (error) {
    // fail post data
    console.log(error.message);
    return res.send({
      success: false,
      message: error.message,
    });
  }
});
//
//
//
// delete
app.delete("/user/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await usersCollection.findOne({ _id: ObjectId(id) });
    if (!user?._id) {
      return res.send({
        success: false,
        error: "User doesn't exist",
      });
      return;
    }
    const result = await usersCollection.deleteOne({ _id: ObjectId(id) });

    if (result.deletedCount) {
      return res.send({
        success: true,
        message: `Successfully deleted the ${user.name}`,
      });
    } else {
    }
  } catch (error) {
    return res.send({
      success: false,
      error: error.message,
    });
  }
});
//
//
//
// get individual
app.get("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await usersCollection.findOne({ _id: ObjectId(id) });
    return res.send({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.send({
      success: false,
      error: error.message,
    });
  }
});
//
//
// edit / partial update
app.patch("/user/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await usersCollection.updateOne({ _id: ObjectId(id) }, { $set: req.body });

    console.log(result);
    if (result.matchedCount) {
      return res.send({
        userId: result.insertedId,
        success: true,
        message: `successfully updated ${req.body.name}`,
      });
    } else {
      return res.send({
        success: false,
        error: "Couldn't update  the user",
      });
    }
  } catch (error) {
    return res.send({
      success: false,
      error: error.message,
    });
  }
});
//
// port Listening
app.listen(port, () => {
  console.log(`Listening to port ${port}`);
});
