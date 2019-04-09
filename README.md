# Dalmazia

This is a non official client application for TobyRich Moskito.

# Architecture

```
,-----------.      ,-------.     ,-------.
|Web Browser|      |Node.js|     |Moskito|
|-----------|  ws  |-------| ble |-------|
|-----------|------|-------|-----|-------|
`-----------'      `-------'     `-------'
```

# Running

## development/without Moskito

```
node server.js
# open localhost:3000
```

## with Moskito

1. start your Moskito
2. start server
```
node server.js moskito
# open localhost:3000
```
3. open localhost:3000
