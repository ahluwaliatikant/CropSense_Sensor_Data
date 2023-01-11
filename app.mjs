import morgan from 'morgan'
import axios from 'axios'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import path from 'path'
import mongoose from 'mongoose'
import cron from 'node-cron'
const __dirname = path.resolve()

const app = express()
app.use(morgan('short'))
app.use(express.static('public'))
app.use(cookieParser())
app.use(cors())

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0
const PORT = process.env.PORT || 4000

mongoose
  .connect(
    'mongodb+srv://jmytwenty8:YZuwqGopYwJvFSB8@realtimedb.qkk9ojv.mongodb.net/plant-iot-realtime',
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then((result) => {
    app.listen(PORT)
  })
  .catch((e) => {
    console.log(e)
  })

const dbSchema = new mongoose.Schema(
  {
    moisture: Number,
    soilTemperature: Number,
    weatherTemperature: Number,
    weatherCondition: String,
    weatherHumidity: Number,
    weatherLocation: String,
  },
  {
    timestamps: true,
  }
)

const sensordata = mongoose.model('sensordata', dbSchema)

function insertData(sen1, sen2, sen3, sen4, sen5, sen6) {
  const data = new sensordata({
    moisture: sen1,
    soilTemperature: sen2,
    weatherTemperature: sen3,
    weatherCondition: sen4,
    weatherHumidity: sen5,
    weatherLocation: sen6,
  })
  data
    .save()
    .then((result) => {
      console.log(result)
    })
    .catch((e) => {
      console.log(e)
    })
}

var cookie = ''

async function fetchCookie() {
  let response = await axios({
    method: 'post',
    url: 'https://platform.sensenuts-ei.com:4000/login',
    data: {
      uname: 'IP_Delhi',
      pass: 'IP_Delhi@12345',
    },
    withCredentials: true,
  })
  return response
}

async function fetchMoisture() {
  let response = axios({
    method: 'get',
    url: 'https://platform.sensenuts-ei.com:4000/assetOne.json/606fc3ea0f119f26ed97c0c1',
    headers: { Cookie: cookie },
  })
  return response
}
async function fetchSoilTemperature() {
  let response = axios({
    method: 'get',
    url: 'https://platform.sensenuts-ei.com:4000/assetOne.json/606fc4940f119f26ed97c0c2',
    headers: { Cookie: cookie },
  })
  return response
}

async function fetchOpenWeather() {
  let response = axios({
    method: 'get',
    url: 'http://api.openweathermap.org/data/2.5/weather?lat=28.6139&lon=77.2090&appid=ee2e2f06d162edec893dcf9dfdcb55b9&units=metric',
  })
  return response
}

cron.schedule('0 */12 * * *', () => {
  fetchCookie().then((data) => {
    cookie = data.headers['set-cookie'][0].split(';')[0]
    fetchMoisture().then((data) => {
      let moisture = JSON.stringify(data.data.latest_entry.data.moisture)
      fetchSoilTemperature().then((data) => {
        let soilTemperature = JSON.stringify(data.data.latest_entry.data.Temp)
        fetchOpenWeather().then((data) => {
          let weatherTemperature = data.data.main.temp
          let weatherCondition = data.data.weather[0].main
          let weatherHumidity = data.data.main.humidity
          let weatherLocation = data.data.name
          insertData(
            moisture,
            soilTemperature,
            weatherTemperature,
            weatherCondition,
            weatherHumidity,
            weatherLocation
          )
        })
      })
    })
  })
})

app.get('/', (req, res) => {
  fetchCookie().then((data) => {
    cookie = data.headers['set-cookie'][0].split(';')[0]
    fetchMoisture().then((data) => {
      let moisture = JSON.stringify(data.data.latest_entry.data.moisture)
      fetchSoilTemperature().then((data) => {
        let soilTemperature = JSON.stringify(data.data.latest_entry.data.Temp)
        fetchOpenWeather().then((data) => {
          let weatherTemperature = data.data.main.temp
          let weatherCondition = data.data.weather[0].main
          let weatherHumidity = data.data.main.humidity
          let weatherLocation = data.data.name
          res.send({
            moisture,
            soilTemperature,
            weatherTemperature,
            weatherCondition,
            weatherHumidity,
            weatherLocation,
          })
          insertData(
            moisture,
            soilTemperature,
            weatherTemperature,
            weatherCondition,
            weatherHumidity,
            weatherLocation
          )
        })
      })
    })
  })
})
