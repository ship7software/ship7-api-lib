import test from "tape"
import ship7ApiLib from "../src"

test("ship7ApiLib", (t) => {
  t.plan(5)
  t.ok(ship7ApiLib.Controller, "Controller")
  t.ok(ship7ApiLib.Crypto, "Crypto")
  t.ok(ship7ApiLib.Facade, "Facade")
  t.ok(ship7ApiLib.Mail, "Mail")
  t.ok(ship7ApiLib.Router, "Router")
})
