import test from "tape"
const ship7ApiLib = require("../src");

test("ship7ApiLib", (t) => {
  t.plan(6)
  t.ok(ship7ApiLib.Controller, "Controller")
  t.ok(ship7ApiLib.Crypto, "Crypto")
  t.ok(ship7ApiLib.Facade, "Facade")
  t.ok(ship7ApiLib.Mail, "Mail")
  t.ok(ship7ApiLib.Router, "Router")
  t.ok(ship7ApiLib.Middleware, "Middleware")
})
