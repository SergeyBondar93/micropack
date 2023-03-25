import { sayHi } from "./func.js";
import "./style.css";

const p = document.createElement("p");
p.innerText = sayHi();

document.getElementById("app").append(p);
