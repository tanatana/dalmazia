'use strict'

const stdout = require('./stdout')
const moskito = require('./moskito')

exports.Stdout = stdout.StdoutAdapter
exports.Moskito = moskito.MoskitoAdapter
