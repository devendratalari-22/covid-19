const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'covid19India.db')

const stateObjToResObj = newObject => {
  return {
    stateId: newObject.state_id,
    stateName: newObject.state_name,
    population: newObject.population,
  }
}

const districtsObjToResObj = newObject => {
  return {
    districtId: newObject.district_id,
    districtName: newObject.district_name,
    stateId: newObject.state_id,
    cases: newObject.cases,
    curved: newObject.curved,
    active: newObject.active,
    deaths: newObject.deaths,
  }
}

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

app.get('/states/', async (request, response) => {
  const listOfStates = `
  SELECT
  *
  FROM 
  state
  ORDER BY
  state_id;`

  const statesArray = await db.all(listOfStates)
  response.send(statesArray.map(eachObj => stateObjToResObj(eachObj)))
})

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getListOfStates = `
  SELECT
  *
  FROM 
  state
  WHERE
  state_id=${stateId};`

  const statesList = await db.get(getListOfStates)
  response.send(stateObjToResObj(statesList))
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrict = `
  SELECT
  *
  FROM 
  district
  WHERE
  district_id=${districtId};`

  const districtObj = await db.get(getDistrict)
  response.send(districtsObjToResObj(districtObj))
})

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStateReport = `
  SELECT
  SUM(cases) AS cases,
  SUM(curved) AS curved,
  SUM(active) AS active,
  SUM(deaths) AS deaths
  FROM
  district
  WHERE
  state_id = ${stateId};`

  const stateReport = await db.get(getStateReport)
  response.send(districtsObjToResObj(stateReport))
})

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const stateDetails = `
  SELECT 
  state_name
  FROM
  state JOIN district ON state.state_id = district.district_id
  WHERE
  district.district_id = ${districtId};`

  const stateName = await db.get(stateDetails)
  response.send({stateName: stateName.state_name})
})

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, curved, active, deaths} = request.body
  const addDistrictQuery = `
  INSERT INTO

  district (district_name, state_id, cases, curved, active, deaths)
  
  VALUES 
  (
   '${districtName}',
    ${stateId},
    ${cases},
    ${curved},
    ${active},
    ${deaths} );`

  await db.run(addDistrictQuery)
  response.send('District Successfully Added')
})

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, curved, active, deaths} = request.body
  const updateDistrictQuery = `
  UPDATE
  district
  
  SET
  
   district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    curved = ${curved},
    active = ${active},
    deaths = ${deaths}
    
    WHERE
    district_id = ${districtId};`

  await db.run(updateDistrictQuery)
  response.send('District Details Updated')
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const removedDistrict = `
  DELETE
  FROM 
  district
  WHERE
  district_id=${districtId};`

  await db.run(removedDistrict)
  response.send('District Removed')
})

module.exports = app
