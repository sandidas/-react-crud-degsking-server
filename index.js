const express = require("express");
const cors = require("cors"); // cors middleware
require("dotenv").config(); // to reason of security
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb"); // Mongo DB
const app = express();
const port = process.env.PORT || 5000; // call port where run the server
// middleware
app.use(cors());
app.use(express.json());
//
//
// get link by uri
// const uri = "mongodb://localhost:27017";
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.jatbrrj.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vllpwyl.mongodb.net/?retryWrites=true&w=majority`;
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
const logCollection = client.db("devsking-assignment").collection("log");
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
//
// end point to post single user
app.post("/user", async (req, res) => {
  try {
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
