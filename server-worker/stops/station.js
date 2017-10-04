const moment = require('moment-timezone')
const cache = require('../cache')
const line = require('../lines/index')
const sql = require('mssql')
const connection = require('../db/connection.js')
const realtime = require('../realtime/nz-akl.js')
const wlg = require('./nz-wlg.js')

var station = {
  stopInfo: function(req, res) {
    if (req.params.station) {
      station._stopInfo(req.params.station, req.params.prefix || 'nz-akl').then(function(data) {
        res.send(data)
      }).catch(function(err) {
        res.status(404).send(err)  
      })
    } else {
      res.status(404).send({
        'error': 'please specify a station'
      })
    }
  },
  _stopInfo: function(stop, prefix) {
    return new Promise(function(resolve, reject) {
      stop = stop.trim()

      // returns data
      let override = false
      if (prefix === 'nz-wlg' && wlg.badStops.indexOf(stop) > -1) {
        override = stop
        stop = stop + '1'
      }

      const sqlRequest = connection.get().request()
      sqlRequest.input('prefix', sql.VarChar, prefix)
      sqlRequest.input('version', sql.VarChar, cache.currentVersion(prefix))
      sqlRequest.input('stop_id', sql.VarChar, stop)
      sqlRequest.query(`
        SELECT 
          stops.prefix as stop_region,
          stops.stop_code as stop_id, 
          stops.stop_name,
          stops.stop_desc,
          stops.stop_lat,
          stops.stop_lon,
          stops.zone_id,
          stops.location_type,
          stops.parent_station,
          stops.stop_timezone,
          stops.wheelchair_boarding,
          routes.route_type
        FROM
          stops
        LEFT JOIN
          stop_times
        ON stop_times.uid = (
            SELECT TOP 1 uid 
            FROM    stop_times
            WHERE 
            stop_times.prefix = stops.prefix and
            stop_times.version = stops.version and
            stop_times.stop_id = stops.stop_id
        )
        LEFT JOIN trips ON trips.trip_id = stop_times.trip_id
        LEFT JOIN routes on routes.route_id = trips.route_id
        WHERE
          stops.prefix = @prefix
          and stops.version = @version
          and stops.stop_code = @stop_id
      `).then((result) => {
        const data = result.recordset[0]
        delete data.uid
        if (override) {
          data.stop_id = override
        }
        resolve(data)
      }).catch(err => {
        return reject({
          error: 'station not found'
        })
      })
    })
  },
  stopTimes: function(req, res) {
    // option in the future?
    // let fastData = false
    // if (req.params.fast === 'fast') {
    //   fastData = true
    // }
    if (!req.params.station) {
      console.log(req.params.station)
      return res.status(404).send({
        'error': 'please x specify a station'
      })
    }

    req.params.station = req.params.station.trim()
    const prefix = req.params.prefix || 'nz-akl'
    
    let sending = {
      provider: 'sql-server'
    }

    const time = moment().tz('Pacific/Auckland')
    let currentTime = new Date(Date.UTC(1970,0,1,time.hour(),time.minute()))
    sending.currentTime = currentTime.getTime()/1000

    const today = new Date(0)
    today.setFullYear(time.year())
    today.setUTCMonth(time.month())
    today.setUTCDate(time.date())

    // midnight fix
    if (time.hour() < 5) {
      today.setTime(today.getTime() - (1000 * 60 * 60 * 24))
    }

    // combines train stations platforms together
    let procedure = 'GetStopTimes'
    if (prefix === 'nz-wlg' && wlg.badStops.indexOf(req.params.station) > -1) {
      procedure = 'GetMultipleStopTimes'
    }

    const realtimeTrips = []
    connection.get().request()
      .input('prefix', sql.VarChar(50), prefix)
      .input('version', sql.VarChar(50), cache.currentVersion(prefix))
      .input('stop_id', sql.VarChar(100), req.params.station)
      .input('departure_time', sql.Time, currentTime)
      .input('date', sql.Date, today)
      .execute(procedure)
      .then((trips) => {
        sending.trips = trips.recordset.map((record) => {
          record.arrival_time_seconds = new Date(record.arrival_time).getTime()/1000
          if (record.arrival_time_24) {
            record.arrival_time_seconds += 86400
          }
          record.departure_time_seconds = new Date(record.departure_time).getTime()/1000
          if (record.departure_time_24) {
            record.departure_time_seconds += 86400
          }

          record.route_color = line.getColor(prefix, record.route_short_name)

          // 30mins of realtime 
          if (record.departure_time_seconds < (sending.currentTime + 1800) || record.departure_time_24) {
            realtimeTrips.push(record.trip_id)
          }

          delete record.arrival_time
          delete record.arrival_time_24
          delete record.departure_time
          delete record.departure_time_24
          return record
        })
        if (prefix === 'nz-akl') {
          sending.realtime = realtime.getTripsCachedAuckland(realtimeTrips) 
          res.send(sending)
        } else {
          res.send(sending)
        }

        
      }).catch(function(err) {
        res.status(500).send(err)
      })
  },
  timetable: function(req, res) {
    if (parseInt(req.params.direction) > 2 || parseInt(req.params.direction) < 0) {
      return res.status(400).send({error: 'Direction is not valid.'})
    }
    let sending = {}
    const prefix = req.params.prefix || 'nz-akl'
    const currentVersion = cache.currentVersion(prefix)

    const time = moment().tz('Pacific/Auckland')

    const today = new Date(0)
    today.setFullYear(time.year())
    today.setUTCMonth(time.month())
    today.setUTCDate(time.date())

    // combines train stations platforms together
    let procedure = 'GetTimetable'
    if (prefix === 'nz-wlg' && wlg.badStops.indexOf(req.params.station) > -1) {
      procedure = 'GetMultipleTimetable'
    }

    connection.get().request()
      .input('prefix', sql.VarChar(50), prefix)
      .input('version', sql.VarChar(50), currentVersion)
      .input('stop_id', sql.VarChar(100), req.params.station)
      .input('route_short_name', sql.VarChar(50), req.params.route)
      .input('date', sql.Date, today)
      .input('direction', sql.Int, req.params.direction)
      .execute(procedure)
      .then((trips) => {
        sending.trips = trips.recordset.map((record) => {
          record.arrival_time_seconds = new Date(record.arrival_time).getTime()/1000
          if (record.arrival_time_24) {
            record.arrival_time_seconds += 86400
          }
          record.departure_time_seconds = record.arrival_time_seconds

          record.route_color = line.getColor(prefix, req.params.route)

          delete record.arrival_time
          delete record.arrival_time_24
          return record
        })
        res.send(sending.trips)
      }).catch(function(err) {
        res.status(500).send(err)
      })
  }
}
module.exports = station