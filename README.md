# Multilogger - Kan samla loggar för flera applikationer

Uppsättning i SV:

# 1. Ladda upp webappen

# 2. Ge appen behörighet 
I Sitevision > Tillägg > Multilogger > Egenskaper

Ge appen rättigheter för både "GET" och "POST". 

Checka i boxen för "Privilegierat läge" och konfigurera en serviceanvändare/tjänsteanvändare i Sitevision.


## Anrop

Anropet görs mot restappen via:

/rest-api/kxn-multilogger/updateLog

Det krävs två parametrar i anropet:
- errorLog: Sträng med loggmeddelande
- loggingAppName: Namnet på applikationen som loggar.

Exempel:

/rest-api/kxn-multilogger/updateLog?errorLog=Ett roligt felmeddelande&loggingAppName=testApp