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
app.use(express.urlencoded({ limit: "50mb" }));
//
//
// get link by uri
const uri = "mongodb://localhost:27017";

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vllpwyl.mongodb.net/?retryWrites=true&w=majority`;
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
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });

    if (token) {
      res.send({
        success: true,
        token: token,
        message: "Successfully token generated",
      });
    } else {
      // fail post data
      res.send({
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
    res.status(401).send({
      message: "Unauthorized Access",
    });
  }
  const token = authorization.split(" ")[1]; // after split will get an array, after that we are taking array 1 key's value inside token variable.
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      res.status(401).send({
        message: "Unauthorized Access",
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
      res.send({
        success: false,
        message: "This Email ID has an account",
      });
      return;
    }
    const result = await usersCollection.insertOne(req.body); // post data
    // console.log(result);
    // success post data
    if (result.insertedId) {
      res.send({
        success: true,
        userId: result.insertedId,
        message: `Successfully data inserted with id ${result.insertedId}`,
      });
    } else {
      // fail post data
      res.send({
        success: false,
        message: "Data insert fail!",
      });
    }
  } catch (error) {
    // fail post data
    console.log(error.message);
    res.send({
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
// SERVICE by pagination
// http://localhost:5000/userspagination?page=0&size=20
app.get("/services", verifyJWT, async (req, res) => {
  const currentPage = parseInt(req.query.page);
  const itemsPerPage = parseInt(req.query.size);
  const userId = req.query.uid;
  email: req.query.email;
  console.log(userId);
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
    res.send({
      success: true,
      message: `Successfully data received`,
      data: { services, totalItems }, // send responce with quantity and data
    });
  } catch (error) {
    // fail post data
    console.log(error.message);
    res.send({
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
// STORE SERVICE with FUN
//
app.post("/service", verifyJWT, async (req, res) => {
  const { thumbnail } = req.body;
  const uploadedThumbnail = await cloudinary.uploader.upload(thumbnail, { folder: "dev/devsking/services" });

  const photoUrl = uploadedThumbnail.secure_url;

  const service = req.body;
  service["thumbnail"] = photoUrl;
  console.log(service);

  try {
    const result = await serviceCollection.insertOne(service); // post data

    // success post data
    if (result.insertedId) {
      res.send({
        success: true,
        insertedId: result.insertedId,
        message: `Successfully data inserted with id ${result.insertedId}`,
      });
    } else {
      // fail post data
      res.send({
        success: false,
        message: "Data insert fail!",
      });
    }
  } catch (error) {
    // fail post data
    console.log(error.message);
    res.send({
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
//
//

//
//
app.post("/log", async (req, res) => {
  try {
    const result = await logCollection.insertOne(req.body); // post data
    console.log(req.body);
    // success post data
    if (result.insertedId) {
      res.send({
        success: true,
        userId: result.insertedId,
        message: `Successfully data inserted with id ${result.insertedId}`,
      });
    } else {
      // fail post data
      res.send({
        success: false,
        message: "Data insert fail!",
      });
    }
  } catch (error) {
    // fail post data
    console.log(error.message);
    res.send({
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
    res.send({
      success: true,
      message: `Successfully data received`,
      data: users,
    });
  } catch (error) {
    // fail post data
    console.log(error.message);
    res.send({
      success: false,
      message: error.message,
    });
  }
});
//
//
//
// users by pagination
// http://localhost:5000/userspagination?page=0&size=20
app.get("/userspagination", async (req, res) => {
  // const decoded = req.decoded;
  // console.log("inside api", decoded);
  /*
  it's important while send user based data to client
  if (decoded.email !== req.query.email) {
    res.status(403).send({ message: "unauthorized access" });
  }
  */

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
    res.send({
      success: true,
      message: `Successfully data received`,
      data: { users, totalItems }, // send responce with quantity and data
    });
  } catch (error) {
    // fail post data
    console.log(error.message);
    res.send({
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
// example: http://localhost:5000/user?email=${user.email}
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
    res.send({
      success: true,
      message: `Successfully data received`,
      data: users,
    });
  } catch (error) {
    // fail post data
    console.log(error.message);
    res.send({
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
      res.send({
        success: false,
        error: "User doesn't exist",
      });
      return;
    }
    const result = await usersCollection.deleteOne({ _id: ObjectId(id) });

    if (result.deletedCount) {
      res.send({
        success: true,
        message: `Successfully deleted the ${user.name}`,
      });
    } else {
    }
  } catch (error) {
    res.send({
      success: false,
      error: error.message,
    });
  }
});
//
// delete multiple
app.post("/user/deletemany", async (req, res) => {
  const { id } = req.params;

  const resource = ["636427a32230000694a67d98", "636427a82230000694a67d9a"];
  const resourceOptimized = resource.map((re) => {
    return ObjectId(re);
  });
  const result = await usersCollection.remove({ _id: { $in: resourceOptimized } });

  res.send(result);
  console.log(result);
  return;
  // const resData = await usersCollection.deleteMany({ _id: { $eq: search } });
  // const result = await usersCollection.filter({ resData });

  try {
    const user = await usersCollection.filter({ _id: ObjectId(id) });
    if (!user?._id) {
      res.send({
        success: false,
        error: "User doesn't exist",
      });
      return;
    }
    const result = await usersCollection.deleteMany([]);

    if (result.deletedCount) {
      res.send({
        success: true,
        message: `Successfully deleted the ${user.name}`,
      });
    } else {
    }
  } catch (error) {
    res.send({
      success: false,
      error: error.message,
    });
  }
});
//
//
// get individual
app.get("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await usersCollection.findOne({ _id: ObjectId(id) });
    res.send({
      success: true,
      data: user,
    });
  } catch (error) {
    res.send({
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
      res.send({
        userId: result.insertedId,
        success: true,
        message: `successfully updated ${req.body.name}`,
      });
    } else {
      res.send({
        success: false,
        error: "Couldn't update  the user",
      });
    }
  } catch (error) {
    res.send({
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
