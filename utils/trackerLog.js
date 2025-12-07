const fs = require("fs");
const { getName } = require("country-list");
const geoip = require("geoip-lite");

// Variables for 'myLogger' function
let count = 0;
let info = {};
let serve = "";
let ip = "";
let countUser = {};
let geo = "";
let countryName = "";
let cityName = "";

// Defining log function (to be run inside app.get only)
// Appends log.txt with ip, conutry, city and num of times of connected user
module.exports.myLogger = (req) => {
  try {
    // Hardcodes my ip address in so it works in test mode
    if (process.env.NODE_ENV !== "production") {
      // returns a nrandom ip address to sim multiple connections
      const ipChoice = [
        "5.70.37.177",
        "85.255.233.69",
        "93.177.74.181",
        "45.152.183.118",
        "122.155.174.76",
      ];
      const ranNum = Math.floor(Math.random() * 5);
      ip = ipChoice[ranNum];
    } else {
      ip = req.ipInfo.ip || req.ip || req.ips;
    }

    // looking up the ip address, country and city
    geo = geoip.lookup(ip) || "UNKNOWN";
    countryName = geo.country || "UNKNOWN";
    cityName = geo.city || "UNKNOWN";

    if (geo.country != undefined) {
      countryName = getName(geo.country);
    }

    // setting up the date and time variables
    let today = new Date();
    let time =
      today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    let date =
      today.getDate() +
      "-" +
      (today.getMonth() + 1) +
      "-" +
      today.getFullYear();

    // Setting up a counter for times a user has visited
    if (countUser[ip]) {
      countUser[ip] += 1;
    } else {
      countUser[ip] = 1;
    }

    // Either creates a new object or updates exsisting object for the ip address
    if (Object.keys(info).indexOf(ip) != -1) {
      info[ip][2] = "Times Visited: " + countUser[ip];

      if (req.url in info[ip][5]) {
        info[ip][5][req.url]++;
      } else {
        info[ip][5][req.url] = 1;
      }
    } else {
      let reqUrl = req.url;
      let url = {};
      url[reqUrl] = 1;

      info[ip] = [
        "Counrty: " + countryName,
        "City: " + cityName,
        "Times Visited: " + countUser[ip],
        "Date (L.V): " + date,
        "Time (L.V): " + time,
        url,
      ];
    }

    // creates Json looking string out of info created above
    // add new line between key value pairs to make it easier to read
    let infoJson = JSON.stringify(info, null, "\t").replace(
      '],\n\t"',
      '],\n\n\t"',
    );

    // counts amount of times the website has been visited
    count++;

    //re-writes logs.txt file with data above from infoJson and date/time info as well as server start time from httpServe below
    fs.writeFile(
      "./tracker/logs.txt",
      serve +
        "\r\n\r\n" +
        "Website visited " +
        count +
        " times, most recently @ " +
        date +
        " " +
        time +
        "\r\n\r\n" +
        infoJson,
      (err) => {
        if (err) {
          throw err;
        }
      },
    );
  } catch (err) {
    console.log("Tracker Failed: " + err + err.stack);
  }
};

// To be run in server http
module.exports.serveHTTP = () => {
  // setting up time/date info
  let today = new Date();
  let time =
    today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  let date =
    today.getDate() + "-" + (today.getMonth() + 1) + "-" + today.getFullYear();
  let year = today.getFullYear().toString().substr(-2);

  // setting up the new name of the logs.txt file to be archived
  let nameNew =
    "logs - " +
    year +
    today.getDate() +
    (today.getMonth() + 1) +
    today.getHours() +
    today.getMinutes() +
    ".txt";

  // renames and moves the logs.txt file to old logs
  fs.rename("./tracker/logs.txt", "./tracker/oldLogs/" + nameNew, () => {
    console.log(
      "New logs.txt file made, old logs.txt file moved and renamed to ==> oldLogs/" +
        nameNew,
    );
  });

  fs.writeFile(
    "./tracker/logs.txt",
    "Server Restarted " + date + " " + time + "\r\n",
    () => {
      serve = "Server Restarted " + date + " " + time;
    },
  );
};
