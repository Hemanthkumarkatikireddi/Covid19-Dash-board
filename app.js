const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dpPath = path.join(__dirname, "covid19India.db");

const app = express();
app.use(express.json());

let database = null;

const initializeDbAndDatabase = async () => {
  try {
    database = await open({
      filename: dpPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("working"));
  } catch (e) {
    console.log(`Db Error:${e.message}`);
    process.exit(1);
  }
};
initializeDbAndDatabase();
// Working API
const convertStateDbObjectToResponseObject = (DbObject) => {
  return {
    stateId: DbObject.state_id,
    stateName: DbObject.state_name,
    population: DbObject.population,
  };
};
const convertDistrictDbObjectToResponseObject = (DbObject) => {
  return {
    districtId: DbObject.district_id,
    districtName: DbObject.district_name,
    stateId: DbObject.state_id,
    cases: DbObject.cases,
    cured: DbObject.cured,
    active: DbObject.active,
    deaths: DbObject.deaths,
  };
};
//All States list
app.get("/states/", async (request, response) => {
  const statesArray = `
    SELECT
        *
    FROM state;`;
  const dbResponse = await database.all(statesArray);
  response.send(
    dbResponse.map((each) => convertStateDbObjectToResponseObject(each))
  );
});
//GET One State API
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `
        SELECT
            *
        FROM 
            state
        WHERE
            state_id = ${stateId};`;
  const dbResponse = await database.get(stateQuery);
  response.send(convertStateDbObjectToResponseObject(dbResponse));
});
//Post District API
app.post("/districts/", async (request, response) => {
  const { stateId, districtName, cases, cured, active, deaths } = request.body;
  const postDistrict = `
    INSERT INTO
        district( state_id,district_name, cases, cured, active, deaths)
    VALUES
        (${stateId},'${districtName}',${cases},${cured},${active},${deaths});`;
  await database.run(postDistrict);
  response.send("District Successfully Added");
});
//GET DistrictId API
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrict = `
        SELECT
            *
        FROM
            district
        WHERE
            district_id=${districtId};`;
  const dbResponse = await database.get(getDistrict);
  response.send(convertDistrictDbObjectToResponseObject(dbResponse));
});
//Delete a District API
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `
        DELETE FROM
            district
        WHERE
            district_id=${districtId};`;
  await database.run(deleteDistrict);
  response.send("District Removed");
});
//Update A District API
app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateDistrict = ` 
    UPDATE
        district
    SET
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE 
        district_id=${districtId};`;
  await database.run(updateDistrict);
  response.send("District Details Updated");
});
//District Details API
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStats = `
        SELECT
            SUM(cases),
            SUM(cured),
            SUM(active),
            SUM(deaths)
        FROM
            district
        WHERE
            state_id=${stateId};`;
  const dbResponse = await database.get(getStats);
  response.send({
    totalCases: dbResponse["SUM(cases)"],
    totalCured: dbResponse["SUM(cured)"],
    totalActive: dbResponse["SUM(active)"],
    totalDeaths: dbResponse["SUM(deaths)"],
  });
});
//Get DistrictId Details API
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictDetails = `
    SELECT
      state_name
    FROM
      district
    NATURAL JOIN
      state
    WHERE 
      district_id=${districtId};`;
  const state = await database.get(getDistrictDetails);
  response.send({ stateName: state.state_name });
});
module.exports = app;
